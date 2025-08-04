import { dailyAnalyseScheduler } from '../services/scheduler.service';

// 模拟 Koa Context（用于定时任务）
const mockContext = {
  state: {
    db: null, // 这里需要在应用启动时注入真实的数据库实例
    user: null,
  },
};

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * 启动定时任务
 */
export function startScheduler(db: any) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    console.log('清除之前的定时任务');
  }
  mockContext.state.db = db;
  console.log('定时任务启动器已启动');
  
  // 每5分钟检查一次，但只在特定条件下执行任务
  schedulerInterval = setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // 只在凌晨1点且分钟数小于5时执行（避免重复执行）
    if (hour === 1 && minute < 5) {
      console.log('检测到凌晨1点，开始执行月度analyse定时任务');
      try {
        await dailyAnalyseScheduler(mockContext as any);
        console.log('月度analyse定时任务执行完成');
      } catch (error) {
        console.error('月度analyse定时任务执行失败:', error);
      }
    }
  }, 5 * 60 * 1000); // 每5分钟检查一次
  
  console.log('定时任务已设置：每天凌晨1点检查并执行月度心情分析任务');
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('定时任务已停止');
  }
}

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在停止定时任务...');
  stopScheduler();
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在停止定时任务...');
  stopScheduler();
  process.exit(0);
});
process.on('exit', () => {
  console.log('进程退出，清理定时任务...');
  stopScheduler();
}); 
// 移除手动执行功能，只保留自动定时任务 