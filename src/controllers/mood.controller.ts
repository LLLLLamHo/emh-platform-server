import Koa from 'koa';
import Router from 'koa-router';
// import { accountService } from '../services/account.service';
import { moodService } from '../services/mood.service';
import { cosService } from '../services/cos.service';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode, HTTP_ERROR } from '../constants/code';


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
  // 获取指定心情记录
  router.get(`/${ROUTER_PREFIX}`, async (ctx: Koa.Context) => {
    const { id } = ctx.query;

    if (!id) {
      throw new HttpException('Missing mood id', ErrorCode.MISS_PARAM);
    }

    const { error, result } = await moodService.getMood(ctx, id as string);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.GET_MOOD_DETAIL_FAIL);
    }

    ctx.body = result;
  });

  // 获取用户心情记录 可以搜索年、月、日不同区间
  router.get(`/${ROUTER_PREFIX}/list`, async (ctx: Koa.Context) => {
    const { year, month, day, image = '0' } = ctx.query;

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
    }, image === '1');

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.MOOD_TRANSFER_SAVE_FAIL);
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

    // 先查找是否存在相同的记录
    const { result: existResult, error: existError } = await moodService.userMoodExist(ctx, Number(year), Number(month), Number(day));

    if (existError) {
      throw new HttpException(existError.message, existError.status, existError.code);
    }

    // 走更新逻辑
    if (existResult) {
      const { error, result } = await moodService.updateMood(ctx, `${existResult.id}`, {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        mood,
        content,
        imgs,
      });
      if (error) {
        throw new HttpException(error.message, error.status, error.code);
      }
      ctx.body = result;
    } else {
      const { error, result } = await moodService.saveMood(ctx, {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        mood,
        content,
        imgs,
      });

      if (error) {
        if (imgs) {
          cosService.removeObject(ctx, imgs.split(','));
        }
        throw new HttpException(error.message, error.status, error.code);
      }

      ctx.body = result;
    }
  });

  // 更新用户心情记录
  router.put(`/${ROUTER_PREFIX}/update`, async (ctx: Koa.Context) => {
    const body = ctx.request.body as Partial<MoodSaveRequest>;
    const { id } = ctx.query;
    const { year, month, day, mood, content, imgs } = body;
    if (!year || !month || !day) {
      throw new HttpException('Missing required parameters', ErrorCode.MISS_PARAM);
    }

    if (!id) {
      throw new HttpException('Missing mood id', ErrorCode.MISS_PARAM);
    }

    const { error, result } = await moodService.updateMood(ctx, id as string, {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      mood,
      content,
      imgs,
    });
    if (error) {
      if (imgs) {
        cosService.removeObject(ctx, imgs.split(','));
      }
      throw new HttpException(error.message, error.status, error.code);
    }
    ctx.body = result;
  });

  // 删除用户心情记录（POST）
  router.delete(`/${ROUTER_PREFIX}/delete`, async (ctx: Koa.Context) => {
    const { id } = ctx.query;
    const { error, result } = await moodService.deleteMood(ctx, `${id}`);
    if (error) {
      throw new HttpException(error.message, ErrorCode.SERVER_ERROR);
    }
    ctx.body = result;
  });
}
