import Koa from 'koa';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { getUTCTimeRange } from '../utils/get-time-range';
import { cosService } from './cos.service';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode, HTTP_ERROR } from '../constants/code';
import { MoodImageModel } from '../db/mood_images';

interface MoodData {
  id: string;
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

class MoodService {
  async userMoodExist(ctx: Koa.Context, year: number, month: number, day: number) {
    try {
      const { user, db } = ctx.state;
      // 构建日期字符串和时间戳
      const dateStr = dayjs.utc(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`).format('YYYY-MM-DD');
      const timestamp = dayjs.utc(dateStr).valueOf();

      const result = await db.moodModule.findOne({
        where: {
          userId: user.id,
          timestamp,
          dateStr,
        },
      });


      return {
        error: null,
        result,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 获取用户指定心情记录
   */
  async getMood(ctx: Koa.Context, id: string) {
    try {
      const { db } = ctx.state;
      const { user } = ctx.state;

      // 获取该时间范围内的所有心情记录
      const moods = await db.moodModule.findOne({
        where: {
          userId: user.id,
          id,
        },
        include: {
          model: MoodImageModel,
          attributes: ['imageUrl'],
          as: 'moodImages',
        },
      });

      return {
        error: null,
        result: moods,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 获取用户心情记录
   */
  async getMoodList(ctx: Koa.Context, userId: number,  params: GetMoodListParams, getImages = false) {
    try {
      const { db } = ctx.state;

      // 计算时间戳范围
      const { startTimestamp, endTimestamp } = getUTCTimeRange(params.year, params.month, params.day);

      // 获取该时间范围内的所有心情记录
      const moods = await db.moodModule.findAll({
        where: {
          userId,
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
          id: mood.id,
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
    let moodImages: string[] = [];

    try {
      const { user } = ctx.state;

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
          status: 0,
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
      cosService.removeObject(ctx, moodImages);
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 更新用户心情记录
   */
  async updateMood(ctx: Koa.Context, id: string, data: MoodUpdateParams) {
    const { db, user } = ctx.state;
    const t = await db.sequelize.transaction();

    let moveMoodImages: string[] = [];
    let addMoodImages: string[] = [];
    let deleteImages: MoodImageModel[] = [];
    try {
      // 构建日期字符串和时间戳
      const dateStr = dayjs.utc(`${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`).format('YYYY-MM-DD');
      const timestamp = dayjs.utc(dateStr).valueOf();

      // 找出当前记录的图片信息
      const mood = await db.moodModule.findOne({
        where: {
          id,
        },
        include: {
          model: MoodImageModel,
          attributes: ['imageUrl', 'id'],
          as: 'moodImages',
        },
      });

      if (!mood) {
        throw new HttpException('mood record not found', HTTP_ERROR, ErrorCode.MOOD_RECORD_NOT_FOUND);
      }

      // @ts-ignore
      const { moodImages = [] } = mood;
      const oldImages = moodImages.map((image: any) => image.imageUrl);
      // 找出交集
      const currImages = data.imgs ? data.imgs.split(',') : [];
      deleteImages = moodImages.filter((moodImage: MoodImageModel) => !currImages.includes(moodImage.imageUrl));

      moveMoodImages = currImages.filter((image: string) => !oldImages.includes(image));

      const { result, error } = await cosService.moveObject(ctx, moveMoodImages);
      if (error as unknown as Error) {
        throw new HttpException(error?.message || 'UNKNOW ERROR', HTTP_ERROR, ErrorCode.MOOD_TRANSFER_SAVE_FAIL);
      }
      addMoodImages = result;

      const updateRes = await db.moodModule.update({
        content: data.content,
        mood: data.mood,
      }, {
        where: {
          id,
        },
        transaction: t,
      });

      if (!updateRes) {
        throw new HttpException('create mood record fail', HTTP_ERROR, ErrorCode.MOOD_UPDATE_RECORED_FAIL);
      }


      await db.moodImageModule.destroy({
        where: {
          id: {
            [Op.in]: deleteImages.map(item => item.id),
          },
        },
        transaction: t,
      });

      if (addMoodImages && addMoodImages.length > 0) {
        const insetData = addMoodImages.map((item: string) => ({
          userId: user.id,
          moodId: +id,
          imageUrl: item,
          status: 0,
          timestamp,
        }));

        const createMoodImages = await db.moodImageModule.bulkCreate(insetData, { transaction: t });
        if (!createMoodImages) {
          throw new HttpException('create mood image record fail', HTTP_ERROR, ErrorCode.MOOD_UPDATE_IMAGE_RECORED_FAIL);
        }
      }

      await t.commit();

      const updatedRecord = await db.moodModule.findOne({
        where: { id },
      });

      cosService.removeObject(ctx, deleteImages.map(item => item.imageUrl));
      return { error: null, result: updatedRecord };
    } catch (error: any) {
      await t.rollback();
      cosService.removeObject(ctx, [...addMoodImages, ...moveMoodImages]);
      return { error, result: null };
    }
  }

  /**
   * 删除用户心情记录
   */
  async deleteMood(ctx: Koa.Context, id: string) {
    const { db } = ctx.state;
    const t = await db.sequelize.transaction();
    try {
      const { db, user } = ctx.state;

      const moodRecord = await db.moodModule.findOne({ where: { id }, include: {
        model: MoodImageModel,
        attributes: ['imageUrl', 'id'],
        as: 'moodImages',
      }, transaction: t });

      if (!moodRecord) {
        throw new HttpException('mood record not found', HTTP_ERROR, ErrorCode.MOOD_RECORD_NOT_FOUND);
      }

      await db.moodModule.destroy({ where: { id, userId: user.id }, transaction: t });
      await db.moodImageModule.destroy({ where: { moodId: moodRecord.id, userId: user.id }, transaction: t });

      // @ts-ignore
      await cosService.removeObject(ctx, moodRecord.moodImages.map(item => item.imageUrl));

      await t.commit();
      return { error: null, result: true };
    } catch (error: any) {
      await t.rollback();
      return { error, result: false };
    }
  }
}

export const moodService = new MoodService();
