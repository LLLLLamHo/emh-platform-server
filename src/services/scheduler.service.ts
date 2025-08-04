import Koa from 'koa';
import { moodService } from './mood.service';
import { cozeService } from './coze.service';
import { analyseService } from './analyse.service';
import { analyseResultService } from './analyse-result.service';

/**
 * 每个月1号开始生成上个月的心情分析。按年份记录。
 * 获取心情分析的时候（年份），如果该年份有记录则返回，没有则返回？空 还是重新调用下。
 */
class SchedulerService {
  /**
   * 处理数据格式转换（从 analyse.controller 抽离的通用函数）
   */
  private processMoodData(result: any, monthNum: number): { processedData: any; hasContent: boolean } {
    let processedData: any = result;
    let hasContent = false;

    if (result && result[monthNum]) {
      const monthData = result[monthNum] as Record<string, any>;
      const formattedEntries: string[] = [];

      // 遍历该月份的所有日期数据
      Object.keys(monthData).forEach((day) => {
        const dayData = monthData[day];
        if (dayData && dayData.content) {
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

  // 获取上个月分析失败的用户ID
  private async getFailedUserIds(ctx: any, year: number, month: number): Promise<number[]> {
    const failedResults = await ctx.state.db.analyseResultModule.findAll({
      where: { year, month, status: 'failed' },
      attributes: ['userId'],
      group: ['userId'],
    });
    return failedResults.map((r: any) => r.userId);
  }

  /**
   * 为指定用户生成指定月份的心情分析
   */
  private async generateMonthlyAnalysis(ctx: any, userId: number, year: number, month: number): Promise<boolean> {
    try {
      console.log(`开始为用户 ${userId} 生成 ${year}年${month}月 的心情分析`);

      // 获取该月份的心情数据
      const { error, result } = await moodService.getMoodList(ctx, {
        year,
        month,
      }, false);

      if (error) {
        console.error(`用户 ${userId} ${year}年${month}月 获取心情数据失败:`, error);
        // 记录失败结果
        await analyseResultService.saveAnalyseResult(ctx, {
          userId,
          year,
          month,
          status: 'failed',
          errorMessage: `获取心情数据失败: ${error}`,
        });
        return false;
      }

      // 处理数据格式转换
      const { processedData, hasContent } = this.processMoodData(result, month);

      // 检查是否有心情记录内容
      if (!hasContent) {
        console.log(`用户 ${userId} ${year}年${month}月 没有心情记录，跳过 AI 分析`);
        // 记录失败结果（无数据）
        await analyseResultService.saveAnalyseResult(ctx, {
          userId,
          year,
          month,
          status: 'success',
          analysisContent: '没有心情记录无需分析',
        });
        return false;
      }

      // 调用 Coze 进行 AI 分析
      const stream = await cozeService.analyzeMoodStream(ctx, processedData, year, month);
      let allContent = '';
      for await (const chunk of cozeService.processStreamResponse(stream)) {
        allContent += chunk;
      }
      console.log(`用户 ${userId} ${year}年${month}月 分析完成:`, `${allContent.substring(0, 100)}...`);

      // 保存分析结果到数据库
      if (allContent && allContent.trim()) {
        const { error: saveError, result: saveResult } = await analyseService.saveAnalyse(ctx, {
          year,
          month,
          analysisContent: allContent,
        });

        if (saveError) {
          console.error(`用户 ${userId} ${year}年${month}月 保存分析结果失败:`, saveError);
          // 记录失败结果
          await analyseResultService.saveAnalyseResult(ctx, {
            userId,
            year,
            month,
            status: 'failed',
            errorMessage: `保存分析结果失败: ${saveError}`,
          });
          return false;
        }
        console.log(`用户 ${userId} ${year}年${month}月 分析结果已保存:`, saveResult);
        // 记录成功结果
        await analyseResultService.saveAnalyseResult(ctx, {
          userId,
          year,
          month,
          status: 'success',
          analysisContent: allContent,
        });
        return true;
      } else {
        // // 记录失败结果（AI 分析内容为空）
        // await analyseResultService.saveAnalyseResult(ctx, {
        //   userId,
        //   year,
        //   month,
        //   status: 'failed',
        //   errorMessage: 'AI 分析结果为空',
        // });
        return false;
      }
    } catch (error: any) {
      console.error(`用户 ${userId} ${year}年${month}月 分析失败:`, error);
      // 记录失败结果
      await analyseResultService.saveAnalyseResult(ctx, {
        userId,
        year,
        month,
        status: 'failed',
        errorMessage: `分析过程异常: ${error.message || error}`,
      });
      return false;
    }
  }

  // 每天凌晨1点执行的主调度方法
  async dailyAnalyseScheduler(ctx: any) {
    const now = new Date();
    const { year, month } = this.getLastYearMonth(now);
    const { db } = ctx.state;
    let userIds: number[] = [];
    
    console.log(`[analyse定时任务] 当前时间: ${now.toLocaleString()}, 目标分析: ${year}年${month}月`);
    
    if (now.getDate() === 1) {
      // 每月1号：分析所有用户的上个月数据
      console.log(`[analyse定时任务] 每月1号，开始分析所有用户 ${year}年${month}月 的心情数据`);
      const users = await db.userModule.findAll({ attributes: ['id'] });
      userIds = users.map((u: any) => u.id);
      console.log(`[analyse定时任务] 找到 ${userIds.length} 个用户需要分析`);
    } else {
      // 每月2号及以后：只重试分析失败的用户
      console.log(`[analyse定时任务] 每月${now.getDate()}号，检查 ${year}年${month}月 分析失败的用户`);
      userIds = await this.getFailedUserIds(ctx, year, month);
      console.log(`[analyse定时任务] 找到 ${userIds.length} 个失败用户需要重试`);
    }
    
    if (userIds.length === 0) {
      console.log(`[analyse定时任务] ${year}年${month}月 无需分析的用户`);
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const userId of userIds) {
      const success = await this.generateMonthlyAnalysis(ctx, userId, year, month);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`[analyse定时任务] ${year}年${month}月 执行完成，成功: ${successCount}，失败: ${failCount}`);
    
    // 如果有失败的用户，明天会继续重试
    if (failCount > 0) {
      console.log(`[analyse定时任务] ${failCount} 个用户分析失败，将在明天凌晨1点重试`);
    }
  }
}

export const schedulerService = new SchedulerService();
export const dailyAnalyseScheduler = schedulerService.dailyAnalyseScheduler.bind(schedulerService);
