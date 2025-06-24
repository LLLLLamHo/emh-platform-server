import Koa from 'koa';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { getUTCTimeRange } from '../utils/get-time-range';
// import { MoodModel } from '../db/mood';

interface MoodData {
  mood: string;
  content?: string;
  dateStr: string;
  timestamp: number;
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
  async getMoodList(ctx: Koa.Context, params: GetMoodListParams) {
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
  async saveMood(ctx: Koa.Context, data: { year: number; month: number; day: number; mood: string; content?: string, imgs?: string }) {
    try {
      const { db } = ctx.state;
      const { user } = ctx.state;

      // 构建日期字符串和时间戳
      const dateStr = dayjs.utc(`${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`).format('YYYY-MM-DD');
      const timestamp = dayjs.utc(dateStr).valueOf();

      // 创建或更新心情记录
      const [mood, created] = await db.moodModule.findOrCreate({
        where: {
          userId: user.id,
          dateStr,
        },
        defaults: {
          userId: user.id,
          dateStr,
          timestamp,
          mood: data.mood,
          content: data.content,
        },
      });

      if (!created) {
        await mood.update({
          mood: data.mood,
          content: data.content,
          timestamp,
        });
      }

      return {
        error: null,
        result: mood,
      };
    } catch (error: any) {
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
      const user = await db.user.findOne({ where: { openid: wxInfo.openid } });
      if (!user) {
        return { error: new Error('User not found'), result: null };
      }
      const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
      const timestamp = new Date(dateStr).getTime();
      const mood = await db.mood.findOne({ where: { userId: user.id, dateStr } });
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
      const user = await db.user.findOne({ where: { openid: wxInfo.openid } });
      if (!user) {
        return { error: new Error('User not found'), result: null };
      }
      const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
      const result = await db.mood.destroy({ where: { userId: user.id, dateStr } });
      return { error: null, result };
    } catch (error: any) {
      return { error, result: null };
    }
  }
}

export const moodService = new MoodService();
