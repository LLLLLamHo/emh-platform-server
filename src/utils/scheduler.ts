import cron from 'node-cron';
import { dailyAnalyseScheduler, retryFailedAnalysis } from '../services/scheduler.service';
import { DB } from '../db';

// 模拟 Koa Context（用于定时任务）


/**
 * 启动定时任务
 */
export function startScheduler(db: DB) {
  const mockContext = {
    state: {
      db, // 这里需要在应用启动时注入真实的数据库实例
      user: null,
    },
  };

  cron.schedule('0 1 1 * *', () => {
    console.log('[analyse定时任务] 开始执行');
    try {
      dailyAnalyseScheduler(mockContext);
    } catch (err) {
      console.error('[analyse定时任务] 执行失败:', err);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  console.log('[analyse定时任务] 已设置：每个月1号凌晨1点检查并执行月度心情分析任务');


  cron.schedule('0 6 * * *', () => {
    console.log('[analyse result定时任务] 开始执行');
    try {
      retryFailedAnalysis(mockContext);
    } catch (err) {
      console.error('[analyse result定时任务] 执行失败:', err);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });
  console.log('[analyse result定时任务] 已设置：每天早上6点检查存在的错误分析记录，并尝试重新执行');

  setTimeout(() => {
    retryFailedAnalysis(mockContext);
  }, 6000);
}
