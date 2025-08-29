import Koa from 'koa';
import Router from 'koa-router';
import { moodService } from '../services/mood.service';
import { cozeService } from '../services/coze.service';
import { analyseService } from '../services/analyse.service';
import { schedulerService } from '../services/scheduler.service';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode, HTTP_ERROR } from '../constants/code';

const ROUTER_PREFIX = 'analyse';

export function analyseRouter(router: Router) {
  // 获取指定月份的心情分析结果
  router.get(`/${ROUTER_PREFIX}/month`, async (ctx: Koa.Context) => {
    const { year, month } = ctx.query;
    const { state } = ctx;

    if (!year || !month) {
      throw new HttpException('Missing year or month parameter', ErrorCode.MISS_PARAM);
    }

    const yearNum = parseInt(year as string, 10);
    const monthNum = parseInt(month as string, 10);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      throw new HttpException('Invalid year or month parameter', ErrorCode.MISS_PARAM);
    }

    if (monthNum < 1 || monthNum > 12) {
      throw new HttpException('Invalid month parameter (1-12)', ErrorCode.MISS_PARAM);
    }

    try {
      // 第一步：先查询 analyse 表中是否已有该用户该年月的分析结果
      const { error: queryError, result: existingAnalyse } = await analyseService.getAnalyse(ctx, {
        year: yearNum,
        month: monthNum,
      });

      if (queryError) {
        console.error('查询分析记录失败:', queryError);
      }

      // 如果已有分析结果，直接返回
      if (existingAnalyse?.analysisContent) {
        ctx.body = {
          content: existingAnalyse.analysisContent,
          fromCache: true,
          analyseId: existingAnalyse.id,
          createdAt: existingAnalyse.createdAt,
        };
        return;
      }

      // 第二步：如果没有缓存，则获取心情数据进行分析
      const { error, result } = await moodService.getMoodList(ctx, state.user.id, {
        year: yearNum,
        month: monthNum,
      }, false);

      if (error) {
        throw new HttpException(error.message, HTTP_ERROR, ErrorCode.MOOD_TRANSFER_SAVE_FAIL);
      }

      // 处理数据格式转换
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

        // 如果有内容记录，则使用格式化后的字符串，否则保持原数据结构
        if (formattedEntries.length > 0) {
          processedData = formattedEntries.join('。');
        }
      }

      // 检查是否有心情记录内容
      if (!hasContent) {
        console.log('该月份没有心情记录，跳过 AI 分析');
        ctx.body = {
          content: '该月份没有心情记录，无法进行分析',
          fromCache: false,
          saved: false,
        };
        return;
      }

      // 第三步：调用 Coze 进行 AI 分析
      const stream = await cozeService.analyzeMoodStream(ctx, processedData, yearNum, monthNum);
      let allContent = '';
      for await (const chunk of cozeService.processStreamResponse(stream)) {
        allContent += chunk;
      }
      console.log('全部流式内容：', allContent);

      // 第四步：保存分析结果到数据库
      if (allContent) {
        const { error: saveError, result: saveResult } = await analyseService.saveAnalyse(ctx, state.user.id, {
          year: yearNum,
          month: monthNum,
          analysisContent: allContent.trim(),
        });

        if (saveError) {
          console.error('保存分析结果失败:', saveError);
        } else {
          console.log('分析结果已保存:', saveResult);
        }
      }

      // 返回分析结果
      ctx.body = {
        content: allContent,
        fromCache: false,
        saved: !!(allContent?.trim()),
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Month analysis failed', HTTP_ERROR, ErrorCode.SERVER_ERROR);
    }
  });

  // 获取指定年份所有月份的心情分析结果
  router.get(`/${ROUTER_PREFIX}/year`, async (ctx: Koa.Context) => {
    const { year } = ctx.query;

    if (!year) {
      throw new HttpException('Missing year parameter', ErrorCode.MISS_PARAM);
    }

    const yearNum = parseInt(year as string, 10);
    if (isNaN(yearNum)) {
      throw new HttpException('Invalid year parameter', ErrorCode.MISS_PARAM);
    }

    try {
      // 获取当前月份，只查询到当前月份
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() 返回 0-11

      // 确定查询的月份范围
      let maxMonth = 12;
      if (yearNum === currentYear) {
        maxMonth = currentMonth; // 如果是当前年份，只查询到当前月份
      }

      console.log(`查询 ${yearNum} 年 1-${maxMonth} 月的分析结果`);

      // 批量查询所有月份的分析结果
      const analyses = await analyseService.getAllAnalyses(ctx);

      if (analyses.error) {
        throw new HttpException(analyses.error.message, HTTP_ERROR, ErrorCode.SERVER_ERROR);
      }

      // 过滤出指定年份的分析结果
      const yearAnalyses = (analyses.result || []).filter((analyse: any) => analyse.year === yearNum);

      // 构建月份映射，确保每个月都有结果
      const monthMap: Record<number, any> = {};

      // 初始化所有月份
      for (let month = 1; month <= maxMonth; month++) {
        monthMap[month] = {
          month,
          year: yearNum,
          content: '',
          hasData: false,
          fromCache: false,
          message: '该月份没有心情记录，无法进行分析',
        };
      }

      // 填充有缓存数据的月份
      yearAnalyses.forEach((analyse: any) => {
        if (analyse.month <= maxMonth) {
          monthMap[analyse.month] = {
            month: analyse.month,
            year: analyse.year,
            content: analyse.analysisContent,
            hasData: true,
            fromCache: true,
            analyseId: analyse.id,
            createdAt: analyse.createdAt,
            updatedAt: analyse.updatedAt,
          };
        }
      });

      // 统计没有缓存的月份
      const monthsWithoutCacheList: number[] = [];
      for (let month = 1; month <= maxMonth; month++) {
        if (!monthMap[month].fromCache) {
          monthsWithoutCacheList.push(month);
        }
      }

      if (monthsWithoutCacheList.length > 0) {
        console.log(`没有分析结果的月份: ${monthsWithoutCacheList.join(', ')}`);
      }

      // 转换为数组格式
      const result = Object.values(monthMap).sort((a: any, b: any) => a.month - b.month);

      // 统计信息
      const monthsWithData = result.filter((item: any) => item.hasData).length;
      const monthsFromCache = result.filter((item: any) => item.fromCache).length;
      const monthsWithoutCache = result.filter((item: any) => !item.fromCache).length;

      ctx.body = {
        year: yearNum,
        maxMonth,
        totalMonths: maxMonth,
        analyses: result,
        summary: {
          totalAnalyses: monthsWithData,
          monthsWithData,
          monthsWithoutData: maxMonth - monthsWithData,
          monthsFromCache,
          monthsWithoutCache,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.log('查询年度分析失败:', error);
      throw new HttpException('Year analysis query failed', HTTP_ERROR, ErrorCode.SERVER_ERROR);
    }
  });

  // // 获取指定年月的心情分析结果
  // router.get(`/${ROUTER_PREFIX}`, async (ctx: Koa.Context) => {
  //   const { year, month } = ctx.query;

  //   if (!year || !month) {
  //     throw new HttpException('Missing year or month parameter', ErrorCode.MISS_PARAM);
  //   }

  //   const yearNum = parseInt(year as string, 10);
  //   const monthNum = parseInt(month as string, 10);

  //   if (isNaN(yearNum) || isNaN(monthNum)) {
  //     throw new HttpException('Invalid year or month parameter', ErrorCode.MISS_PARAM);
  //   }

  //   if (monthNum < 1 || monthNum > 12) {
  //     throw new HttpException('Invalid month parameter (1-12)', ErrorCode.MISS_PARAM);
  //   }

  //   const { error, result } = await analyseService.getAnalyse(ctx, {
  //     year: yearNum,
  //     month: monthNum,
  //   });

  //   if (error) {
  //     throw new HttpException(error.message, HTTP_ERROR, ErrorCode.SERVER_ERROR);
  //   }

  //   ctx.body = result;
  // });

  // // 获取用户的所有分析记录
  // router.get(`/${ROUTER_PREFIX}/list`, async (ctx: Koa.Context) => {
  //   const { error, result } = await analyseService.getAllAnalyses(ctx);

  //   if (error) {
  //     throw new HttpException(error.message, HTTP_ERROR, ErrorCode.SERVER_ERROR);
  //   }

  //   ctx.body = result;
  // });

  // // 删除指定年月的心情分析结果
  // router.delete(`/${ROUTER_PREFIX}`, async (ctx: Koa.Context) => {
  //   const { year, month } = ctx.query;

  //   if (!year || !month) {
  //     throw new HttpException('Missing year or month parameter', ErrorCode.MISS_PARAM);
  //   }

  //   const yearNum = parseInt(year as string, 10);
  //   const monthNum = parseInt(month as string, 10);

  //   if (isNaN(yearNum) || isNaN(monthNum)) {
  //     throw new HttpException('Invalid year or month parameter', ErrorCode.MISS_PARAM);
  //   }

  //   if (monthNum < 1 || monthNum > 12) {
  //     throw new HttpException('Invalid month parameter (1-12)', ErrorCode.MISS_PARAM);
  //   }

  //   const { error, result } = await analyseService.deleteAnalyse(ctx, {
  //     year: yearNum,
  //     month: monthNum,
  //   });

  //   if (error) {
  //     throw new HttpException(error.message, HTTP_ERROR, ErrorCode.SERVER_ERROR);
  //   }

  //   ctx.body = result;
  // });

  // 测试接口：手动触发生成指定月份的分析
  router.post(`/${ROUTER_PREFIX}/test-generate`, async (ctx: Koa.Context) => {
    const body = ctx.request.body as { year?: string | number; month?: string | number; userId?: string | number };
    const { year, month, userId } = body;
    const { state } = ctx;

    if (!year || !month) {
      throw new HttpException('Missing year or month parameter', ErrorCode.MISS_PARAM);
    }

    const yearNum = parseInt(year.toString(), 10);
    const monthNum = parseInt(month.toString(), 10);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      throw new HttpException('Invalid year or month parameter', ErrorCode.MISS_PARAM);
    }

    if (monthNum < 1 || monthNum > 12) {
      throw new HttpException('Invalid month parameter (1-12)', ErrorCode.MISS_PARAM);
    }

    // 如果没有指定用户ID，使用当前登录用户
    const targetUserId = userId ? parseInt(userId.toString(), 10) : state.user.id;

    if (isNaN(targetUserId)) {
      throw new HttpException('Invalid userId parameter', ErrorCode.MISS_PARAM);
    }

    try {
      console.log(`[测试接口] 开始为用户 ${targetUserId} 生成 ${yearNum}年${monthNum}月 的分析`);

      // 创建新的上下文对象
      const newContext = {
        state: {
          db: ctx.state.db,
          user: { id: targetUserId },
        },
      };

      // 调用调度器服务生成分析
      const success = await schedulerService['generateMonthlyAnalysis'](newContext, targetUserId, yearNum, monthNum);

      if (success) {
        ctx.body = {
          success: true,
          message: `用户 ${targetUserId} ${yearNum}年${monthNum}月 分析生成成功`,
          data: {
            userId: targetUserId,
            year: yearNum,
            month: monthNum,
            status: 'success',
          },
        };
      } else {
        ctx.body = {
          success: false,
          message: `用户 ${targetUserId} ${yearNum}年${monthNum}月 分析生成失败`,
          data: {
            userId: targetUserId,
            year: yearNum,
            month: monthNum,
            status: 'failed',
          },
        };
      }
    } catch (error: any) {
      console.error(`[测试接口] 生成分析失败:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Test generate analysis failed', HTTP_ERROR, ErrorCode.SERVER_ERROR);
    }
  });
}
