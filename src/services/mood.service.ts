import Koa from 'koa';
import { Op } from 'sequelize';
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

class MoodService {
  /**
   * 获取用户心情记录
   */
  async getMoodList(ctx: Koa.Context, params: GetMoodListParams) {
    try {
      const { db } = ctx.state;
      const { wxInfo } = ctx.state;

      // 获取用户ID
      const user = await db.user.findOne({
        where: { openid: wxInfo.openid },
      });

      if (!user) {
        return {
          error: new Error('User not found'),
          result: null,
        };
      }

      // 计算时间戳范围
      let startTimestamp: number;
      let endTimestamp: number;

      if (params.month && params.day) {
        // 查询具体某一天
        const dateStr = `${params.year}-${String(params.month).padStart(2, '0')}-${String(params.day).padStart(2, '0')}`;
        startTimestamp = new Date(dateStr).getTime();
        endTimestamp = startTimestamp + 24 * 60 * 60 * 1000 - 1;
      } else if (params.month) {
        // 查询某个月
        const dateStr = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
        startTimestamp = new Date(dateStr).getTime();
        const lastDay = new Date(params.year, params.month, 0).getDate();
        const endDateStr = `${params.year}-${String(params.month).padStart(2, '0')}-${lastDay}`;
        endTimestamp = new Date(endDateStr).getTime() + 24 * 60 * 60 * 1000 - 1;
      } else {
        // 查询某年
        const dateStr = `${params.year}-01-01`;
        startTimestamp = new Date(dateStr).getTime();
        const endDateStr = `${params.year}-12-31`;
        endTimestamp = new Date(endDateStr).getTime() + 24 * 60 * 60 * 1000 - 1;
      }

      // 获取该时间范围内的所有心情记录
      const moods = await db.mood.findAll({
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
        const [_, month, day] = mood.dateStr.split('-').map(Number);
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
  async saveMood(ctx: Koa.Context, data: { year: number; month: number; day: number; mood: string; content?: string }) {
    try {
      const { db } = ctx.state;
      const { wxInfo } = ctx.state;

      // 获取用户ID
      const user = await db.user.findOne({
        where: { openid: wxInfo.openid },
      });

      if (!user) {
        return {
          error: new Error('User not found'),
          result: null,
        };
      }

      // 构建日期字符串和时间戳
      const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
      const timestamp = new Date(dateStr).getTime();

      // 创建或更新心情记录
      const [mood, created] = await db.mood.findOrCreate({
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
}

export const moodService = new MoodService();
