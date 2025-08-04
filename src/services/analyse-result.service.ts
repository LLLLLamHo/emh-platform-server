import Koa from 'koa';
import { AnalyseResultModel, AnalyseResultCreationAttributes } from '../db/analyse-result';

class AnalyseResultService {
  /**
   * 保存分析结果记录
   */
  async saveAnalyseResult(ctx: Koa.Context, params: AnalyseResultCreationAttributes) {
    try {
      const { userId, year, month, status, errorMessage, analysisContent } = params;
      
      // 检查是否已存在记录
      const existingResult = await ctx.state.db.analyseResultModule.findOne({
        where: { userId, year, month }
      });

      if (existingResult) {
        // 更新现有记录
        const result = await ctx.state.db.analyseResultModule.update(
          { status, errorMessage, analysisContent },
          { where: { userId, year, month } }
        );
        return { error: null, result: { updated: true, affectedRows: result[0] } };
      } else {
        // 创建新记录
        const result = await ctx.state.db.analyseResultModule.create({
          userId,
          year,
          month,
          status,
          errorMessage,
          analysisContent,
        });
        return { error: null, result };
      }
    } catch (error: any) {
      console.error('保存分析结果记录失败:', error);
      return { error: error.message, result: null };
    }
  }

  /**
   * 获取指定用户指定月份的分析结果记录
   */
  async getAnalyseResult(ctx: Koa.Context, params: { userId: number; year: number; month: number }) {
    try {
      const { userId, year, month } = params;
      
      const result = await ctx.state.db.analyseResultModule.findOne({
        where: { userId, year, month }
      });
      
      return { error: null, result };
    } catch (error: any) {
      console.error('获取分析结果记录失败:', error);
      return { error: error.message, result: null };
    }
  }

  /**
   * 获取指定用户指定年份的所有分析结果记录
   */
  async getAnalyseResultsByYear(ctx: Koa.Context, params: { userId: number; year: number }) {
    try {
      const { userId, year } = params;
      
      const results = await ctx.state.db.analyseResultModule.findAll({
        where: { userId, year },
        order: [['month', 'ASC']]
      });
      
      return { error: null, result: results };
    } catch (error: any) {
      console.error('获取年度分析结果记录失败:', error);
      return { error: error.message, result: null };
    }
  }

  /**
   * 获取指定月份所有用户的分析结果记录
   */
  async getAnalyseResultsByMonth(ctx: Koa.Context, params: { year: number; month: number }) {
    try {
      const { year, month } = params;
      
      const results = await ctx.state.db.analyseResultModule.findAll({
        where: { year, month },
        order: [['userId', 'ASC']]
      });
      
      return { error: null, result: results };
    } catch (error: any) {
      console.error('获取月度分析结果记录失败:', error);
      return { error: error.message, result: null };
    }
  }

  /**
   * 获取分析结果统计信息
   */
  async getAnalyseResultStats(ctx: Koa.Context, params: { year: number; month: number }) {
    try {
      const { year, month } = params;
      
      const stats = await ctx.state.db.analyseResultModule.findAll({
        where: { year, month },
        attributes: [
          'status',
          [ctx.state.db.sequelize.fn('COUNT', ctx.state.db.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      return { error: null, result: stats };
    } catch (error: any) {
      console.error('获取分析结果统计失败:', error);
      return { error: error.message, result: null };
    }
  }

  /**
   * 删除分析结果记录
   */
  async deleteAnalyseResult(ctx: Koa.Context, params: { userId: number; year: number; month: number }) {
    try {
      const { userId, year, month } = params;
      
      const result = await ctx.state.db.analyseResultModule.destroy({
        where: { userId, year, month }
      });
      
      return { error: null, result: { deleted: true, affectedRows: result } };
    } catch (error: any) {
      console.error('删除分析结果记录失败:', error);
      return { error: error.message, result: null };
    }
  }
}

export const analyseResultService = new AnalyseResultService(); 