import { moodService } from './mood.service';
import { cozeService } from './coze.service';
import { analyseService } from './analyse.service';
import { analyseResultService } from './analyse-result.service';
import { DB } from '../db';

/**
 * 每个月1号开始生成上个月的心情分析。按年份记录。
 * 获取心情分析的时候（年份），如果该年份有记录则返回，没有则返回？空 还是重新调用下。
 */
class SchedulerService {
  // 每天凌晨1点执行的主调度方法
  async dailyAnalyseScheduler(ctx: any) {
    const now = new Date();
    const { year, month } = this.getLastYearMonth(now);
    const { db } = ctx.state;

    console.log(`[analyse定时任务] 当前时间: ${now.toLocaleString()}, 目标分析: ${year}年${month}月`);

    let page = 0;
    const pageSize = 100;

    let users = await this.getUserListForPage(db, page, pageSize);

    while (users.length > 0) {
      const user = users[0];
      if (user) {
        console.log(`[analyse定时任务] 用户 ${user.id} ${year}年${month}月 分析开始`);
        const newContext = {
          state: {
            db: ctx.state.db,
            user,
          },
        };
        const success  = await this.generateMonthlyAnalysis(newContext, user.id, year, month);
        if (success) {
          console.log(`[analyse定时任务] 用户 ${user.id} ${year}年${month}月 分析成功`);
        } else {
          console.log(`[analyse定时任务] 用户 ${user.id} ${year}年${month}月 分析失败`);
        }
        users.shift(); // 移除第一个用户
      }

      // 最后一个用户处理完后，获取下一页用户列表
      if (users.length === 0) {
        page += 1;
        users = await this.getUserListForPage(db, page, pageSize);
      }
    }

    console.log('[analyse定时任务] 所有用户执行完成');
  }

  // 获取失败列表重新尝试生成
  async retryFailedAnalysis(ctx: any) {
    const { db } = ctx.state;

    let page = 0;
    const pageSize = 100;

    let failList = await this.getFailAnalysisListForPage(db, page, pageSize);

    console.log(`[analyse result定时任务] 目标分析: ${failList.length}个失败分析`);

    while (failList.length > 0) {
      const failAnalysis = failList[0];
      if (failAnalysis) {
        console.log(`[analyse result定时任务] 用户 ${failAnalysis.userId} ${failAnalysis.year}年${failAnalysis.month}月 分析开始`);
        const newContext = {
          state: {
            db: ctx.state.db,
          },
        };
        const success  = await this.generateMonthlyAnalysis(newContext, failAnalysis.userId, failAnalysis.year, failAnalysis.month);
        if (success) {
          console.log(`[analyse result定时任务] 用户 ${failAnalysis.userId} ${failAnalysis.year}年${failAnalysis.month}月 分析成功`);
        } else {
          console.log(`[analyse result定时任务] 用户 ${failAnalysis.userId} ${failAnalysis.year}年${failAnalysis.month}月 分析失败`);
        }
        failList.shift(); // 移除第一个用户
      }

      // 最后一个用户处理完后，获取下一页用户列表
      if (failList.length === 0) {
        page += 1;
        failList = await this.getFailAnalysisListForPage(db, page, pageSize);
      }
    }

    console.log('[analyse result定时任务] 所有用户执行完成');
  }

  private async getFailAnalysisListForPage(db: DB, page = 0, pageSize = 100) {
    return await db.analyseResultModule.findAll({
      where: { status: 'failed' },
      attributes: ['id', 'userId', 'year', 'month'],
      limit: pageSize,
      offset: page * pageSize,
    });
  }

  private async getUserListForPage(db: DB, page = 0, pageSize = 100) {
    return await db.userModule.findAll({
      attributes: ['id'],
      limit: pageSize,
      offset: page * pageSize,
    });
  }

  /**
   * 处理数据格式转换（从 analyse.controller 抽离的通用函数）
   */
  private processMoodData(result: any, monthNum: number): { processedData: any; hasContent: boolean } {
    let processedData: any = result;
    let hasContent = false;

    if (result?.[monthNum]) {
      const monthData = result[monthNum] as Record<string, any>;
      const formattedEntries: string[] = [];

      // 遍历该月份的所有日期数据
      Object.keys(monthData).forEach((day) => {
        const dayData = monthData[day];
        if (dayData?.content) {
          formattedEntries.push(`${monthNum}月${day}号的记录：${dayData.content}`);
          hasContent = true;
        }
      });

      // 如果有内容记录，则使用格式化后的字符串
      if (formattedEntries.length > 0) {
        processedData = formattedEntries.join('。');
      }
    }

    return { processedData, hasContent };
  }

  // 获取上个月的年份和月份
  private getLastYearMonth(now: Date) {
    let year = now.getFullYear();
    let month = now.getMonth(); // getMonth() 0-11
    if (month === 0) {
      year -= 1;
      month = 12;
    }
    return { year, month };
  }

  /**
   * 为指定用户生成指定月份的心情分析
   */
  private async generateMonthlyAnalysis(ctx: any, userId: number, year: number, month: number): Promise<boolean> {
    try {
      // 获取该月份的心情数据
      const { error, result } = await moodService.getMoodList(ctx, userId, {
        year,
        month,
      }, false);

      if (error) {
        console.error(`[analyse定时任务] 用户 ${userId} ${year}年${month}月 获取心情数据失败:`, error);
        // 记录失败结果
        await analyseResultService.saveAnalyseResult(ctx, {
          userId,
          year,
          month,
          status: 'failed',
        });
        return false;
      }

      // 处理数据格式转换
      const { processedData, hasContent } = this.processMoodData(result, month);

      // 检查是否有心情记录内容
      if (!hasContent) {
        console.log(`[analyse定时任务] 用户 ${userId} ${year}年${month}月 没有心情记录，跳过 AI 分析`);
        // 记录失败结果（无数据）
        await analyseResultService.saveAnalyseResult(ctx, {
          userId,
          year,
          month,
          status: 'empty',
        });
        return false;
      }

      // 调用 Coze 进行 AI 分析
      const stream = await cozeService.analyzeMoodStream(ctx, processedData, year, month);
      let allContent = '';
      for await (const chunk of cozeService.processStreamResponse(stream)) {
        allContent += chunk;
      }
      console.log(`[analyse定时任务] 用户 ${userId} ${year}年${month}月 分析完成:`, `${allContent.substring(0, 100)}...`);

      // 保存分析结果到数据库
      if (allContent) {
        const { error: saveError, result: saveResult } = await analyseService.saveAnalyse(ctx, userId, {
          year,
          month,
          analysisContent: allContent.trim(),
        });

        if (saveError) {
          console.error(`[analyse定时任务] 用户 ${userId} ${year}年${month}月 保存分析结果失败:`, saveError);
          // 记录失败结果
          await analyseResultService.saveAnalyseResult(ctx, {
            userId,
            year,
            month,
            status: 'failed',
          });
          return false;
        }
        console.log(`[analyse定时任务] 用户 ${userId} ${year}年${month}月 分析结果已保存:`, saveResult);
        // 记录成功结果
        await analyseResultService.saveAnalyseResult(ctx, {
          userId,
          year,
          month,
          status: 'success',
        });
        return true;
      }
      // 记录失败结果（AI 分析内容为空）
      console.log(`[analyse定时任务] 用户 ${userId} ${year}年${month}月, AI 分析结果为空`);
      await analyseResultService.saveAnalyseResult(ctx, {
        userId,
        year,
        month,
        status: 'failed',
      });
      return false;
    } catch (error: any) {
      console.error(`[analyse定时任务] 用户 ${userId} ${year}年${month}月 分析失败:`, error);
      // 记录失败结果
      await analyseResultService.saveAnalyseResult(ctx, {
        userId,
        year,
        month,
        status: 'failed',
      });
      return false;
    }
  }
}

export const schedulerService = new SchedulerService();
export const dailyAnalyseScheduler = schedulerService.dailyAnalyseScheduler.bind(schedulerService);
export const retryFailedAnalysis = schedulerService.retryFailedAnalysis.bind(schedulerService);
