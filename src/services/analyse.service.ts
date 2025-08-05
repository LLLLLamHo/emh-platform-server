import Koa from 'koa';

interface SaveAnalyseParams {
  year: number;
  month: number;
  analysisContent: string;
}

interface GetAnalyseParams {
  year: number;
  month: number;
}

class AnalyseService {
  /**
   * 保存心情分析结果
   */
  async saveAnalyse(ctx: Koa.Context, userId: number, params: SaveAnalyseParams) {
    try {
      const { db } = ctx.state;
      const { year, month, analysisContent } = params;

      // upsert 会根据唯一索引判断是插入还是更新
      const [record, created] = await db.analyseModule.upsert({
        userId,
        year,
        month,
        analysisContent,
      }, { returning: true });

      return {
        error: null,
        result: {
          id: record.id,
          year,
          month,
          analysisContent,
          updated: !created,
        },
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 获取指定年月的心情分析结果
   */
  async getAnalyse(ctx: Koa.Context, params: GetAnalyseParams) {
    try {
      const { db } = ctx.state;
      const { user } = ctx.state;
      const { year, month } = params;

      const analyse = await db.analyseModule.findOne({
        where: {
          userId: user.id,
          year,
          month,
        },
        attributes: ['id', 'year', 'month', 'analysisContent', 'createdAt', 'updatedAt'],
      });

      return {
        error: null,
        result: analyse,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 获取用户的所有分析记录
   */
  async getAllAnalyses(ctx: Koa.Context) {
    try {
      const { db } = ctx.state;
      const { user } = ctx.state;

      const analyses = await db.analyseModule.findAll({
        where: {
          userId: user.id,
        },
        attributes: ['id', 'year', 'month', 'analysisContent', 'createdAt', 'updatedAt'],
        order: [['year', 'DESC'], ['month', 'DESC']],
      });

      return {
        error: null,
        result: analyses,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 删除指定年月的心情分析结果
   */
  async deleteAnalyse(ctx: Koa.Context, params: GetAnalyseParams) {
    try {
      const { db } = ctx.state;
      const { user } = ctx.state;
      const { year, month } = params;

      const deletedCount = await db.analyseModule.destroy({
        where: {
          userId: user.id,
          year,
          month,
        },
      });

      return {
        error: null,
        result: {
          deleted: deletedCount > 0,
          count: deletedCount,
        },
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }
}

export const analyseService = new AnalyseService();
