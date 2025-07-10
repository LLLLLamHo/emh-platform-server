import Koa from 'koa';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { getUTCTimeRange } from '../utils/get-time-range';
import { cosService } from './cos.service';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode, HTTP_ERROR } from '../constants/code';
import { MoodImageModel } from '../db/mood_images';
// import { MoodModel } from '../db/mood';

interface MoodData {
  mood: string;
  content?: string;
  dateStr: string;
  timestamp: number;
  images?: string[]
}

interface GetMoodListParams {
  year: number;
  month?: number;
  day?: number;
}

interface MoodUpdateParams {
  year: number;
  month: number;
  day: number;
  mood?: string;
  content?: string;
  imgs?: string;
}

interface MoodDeleteParams {
  year: number;
  month: number;
  day: number;
}

class MoodService {
  /**
   * 获取用户心情记录
   */
  async getMoodList(ctx: Koa.Context, params: GetMoodListParams, getImages = false) {
    try {
      const { db } = ctx.state;
      const { user } = ctx.state;

      // 计算时间戳范围
      const { startTimestamp, endTimestamp } = getUTCTimeRange(params.year, params.month, params.day);

      // 获取该时间范围内的所有心情记录
      const moods = await db.moodModule.findAll({
        where: {
          userId: user.id,
          timestamp: {
            [Op.between]: [startTimestamp, endTimestamp],
          },
        },
        include: getImages ? {
          model: MoodImageModel,
          attributes: ['imageUrl'],
          as: 'moodImages',
        } : undefined,
        order: [['timestamp', 'DESC']],
      });

      // 按月份和日期组织数据
      const moodListByYear: Record<number, Record<number, MoodData>> = {};
      moods.forEach((mood: any) => {
        const [, month, day] = mood.dateStr.split('-').map(Number);
        if (!moodListByYear[month]) {
          moodListByYear[month] = {};
        }
        moodListByYear[month][day] = {
          mood: mood.mood,
          content: mood.content,
          dateStr: mood.dateStr,
          timestamp: mood.timestamp,
          images: mood?.moodImages || [],
        };
      });

      return {
        error: null,
        result: moodListByYear,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 保存用户心情记录
   */
  async saveMood(ctx: Koa.Context, data: { year: number; month: number; day: number; mood: string; content?: string; imgs?: string }) {
    const { db } = ctx.state;
    const t = await db.sequelize.transaction();

    try {
      const { user } = ctx.state;

      let moodImages: string[] = [];
      // 处理图片转存
      if (data.imgs) {
        let imgArr: string[] = [];
        imgArr = data.imgs.split(',');

        const { result, error } = await cosService.moveObject(ctx, imgArr);
        if (error as unknown as Error) {
          throw new HttpException(error?.message || 'UNKNOW ERROR', HTTP_ERROR, ErrorCode.MOOD_TRANSFER_SAVE_FAIL);
        }
        moodImages = result;
      }


      // 构建日期字符串和时间戳
      const dateStr = dayjs.utc(`${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`).format('YYYY-MM-DD');
      const timestamp = dayjs.utc(dateStr).valueOf();

      // 开启事务
      // 创建或更新心情记录
      const createRes = await db.moodModule.create({
        userId: user.id,
        dateStr,
        timestamp,
        mood: data.mood,
        content: data.content,
      }, {
        transaction: t,
      });

      if (!createRes) {
        throw new HttpException('create mood record fail', HTTP_ERROR, ErrorCode.MOOD_CREATE_RECORED_FAIL);
      }

      if (moodImages && moodImages.length > 0) {
        const insetData = moodImages.map(item => ({
          userId: user.id,
          moodId: createRes.id,
          imageUrl: item,
          timestamp,
        }));
        const createMoodImages = await db.moodImageModule.bulkCreate(insetData, { transaction: t });
        if (!createMoodImages) {
          throw new HttpException('create mood image record fail', HTTP_ERROR, ErrorCode.MOOD_CREATE_IMAGE_RECORED_FAIL);
        }
      }

      await t.commit();
      return {
        error: null,
        result: createRes.dataValues,
      };
    } catch (error: any) {
      await t.rollback();
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 更新用户心情记录
   */
  async updateMood(ctx: Koa.Context, data: MoodUpdateParams) {
    try {
      const { db } = ctx.state;
      const { wxInfo } = ctx.state;
      const user = await db.userModule.findOne({ where: { openid: wxInfo.openid } });
      if (!user) {
        return { error: new Error('User not found'), result: null };
      }
      const dateStr = dayjs.utc(`${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`).format('YYYY-MM-DD');
      const timestamp = dayjs.utc(dateStr).valueOf();

      const mood = await db.moodModule.findOne({ where: { userId: user.id, dateStr } });
      if (!mood) {
        return { error: new Error('Mood record not found'), result: null };
      }
      await mood.update({
        mood: data.mood,
        content: data.content,
        imgs: data.imgs,
        timestamp,
      } as any);
      return { error: null, result: mood };
    } catch (error: any) {
      return { error, result: null };
    }
  }

  /**
   * 删除用户心情记录
   */
  async deleteMood(ctx: Koa.Context, data: MoodDeleteParams) {
    try {
      const { db } = ctx.state;
      const { wxInfo } = ctx.state;
      const user = await db.userModule.findOne({ where: { openid: wxInfo.openid } });
      if (!user) {
        return { error: new Error('User not found'), result: null };
      }
      const dateStr = dayjs.utc(`${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`).format('YYYY-MM-DD');

      const result = await db.moodModule.destroy({ where: { userId: user.id, dateStr } });
      return { error: null, result };
    } catch (error: any) {
      return { error, result: null };
    }
  }
}

export const moodService = new MoodService();
