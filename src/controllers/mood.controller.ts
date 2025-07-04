import Koa from 'koa';
import Router from 'koa-router';
// import { accountService } from '../services/account.service';
import { moodService } from '../services/mood.service';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode } from '../constants/code';

const ROUTER_PREFIX = 'mood';

interface MoodSaveRequest {
  year: number;
  month: number;
  day: number;
  mood: string;
  content?: string;
  imgs?: string;
}

export function moodRouter(router: Router) {
  // 获取用户心情记录 可以搜索年、月、日不同区间
  router.get(`/${ROUTER_PREFIX}/list`, async (ctx: Koa.Context) => {
    const { year, month, day } = ctx.query;

    if (!year) {
      throw new HttpException('Missing year parameter', ErrorCode.MISS_PARAM);
    }

    const yearNum = parseInt(year as string, 10);
    if (isNaN(yearNum)) {
      throw new HttpException('Invalid year parameter', ErrorCode.MISS_PARAM);
    }

    const monthNum = month ? parseInt(month as string, 10) : undefined;
    if (month && isNaN(monthNum!)) {
      throw new HttpException('Invalid month parameter', ErrorCode.MISS_PARAM);
    }

    const dayNum = day ? parseInt(day as string, 10) : undefined;
    if (day && isNaN(dayNum!)) {
      throw new HttpException('Invalid day parameter', ErrorCode.MISS_PARAM);
    }

    const { error, result } = await moodService.getMoodList(ctx, {
      year: yearNum,
      month: monthNum,
      day: dayNum,
    });

    if (error) {
      throw new HttpException(error.message, ErrorCode.SERVER_ERROR);
    }

    ctx.body = result;
  });

  // 保存用户心情记录
  router.post(`/${ROUTER_PREFIX}/save`, async (ctx: Koa.Context) => {
    const body = ctx.request.body as MoodSaveRequest;
    const { year, month, day, mood, content, imgs } = body;
    if (!year || !month || !day || !mood) {
      throw new HttpException('Missing required parameters', ErrorCode.MISS_PARAM);
    }

    const { error, result } = await moodService.saveMood(ctx, {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      mood,
      content,
      imgs,
    });
    if (error) {
      console.log(error);
      throw new HttpException(error.message, ErrorCode.SERVER_ERROR);
    }

    ctx.body = result;
  });

  // // 更新用户心情记录（POST）
  // router.post(`/${ROUTER_PREFIX}/update`, async (ctx: Koa.Context) => {
  //   const body = ctx.request.body as Partial<MoodSaveRequest>;
  //   const { year, month, day, mood, content, imgs } = body;
  //   if (!year || !month || !day) {
  //     throw new HttpException('Missing required parameters', ErrorCode.MISS_PARAM);
  //   }
  //   const { error, result } = await moodService.updateMood(ctx, {
  //     year: Number(year),
  //     month: Number(month),
  //     day: Number(day),
  //     mood,
  //     content,
  //     imgs,
  //   });
  //   if (error) {
  //     throw new HttpException(error.message, ErrorCode.SERVER_ERROR);
  //   }
  //   ctx.body = result;
  // });

  // 删除用户心情记录（POST）
  router.post(`/${ROUTER_PREFIX}/delete`, async (ctx: Koa.Context) => {
    const body = ctx.request.body as Partial<MoodSaveRequest>;
    const { year, month, day } = body;
    if (!year || !month || !day) {
      throw new HttpException('Missing required parameters', ErrorCode.MISS_PARAM);
    }
    const yearNum = Number(year);
    const monthNum = Number(month);
    const dayNum = Number(day);
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      throw new HttpException('Invalid date parameter', ErrorCode.MISS_PARAM);
    }
    const { error, result } = await moodService.deleteMood(ctx, {
      year: yearNum,
      month: monthNum,
      day: dayNum,
    });
    if (error) {
      throw new HttpException(error.message, ErrorCode.SERVER_ERROR);
    }
    ctx.body = result;
  });
}
