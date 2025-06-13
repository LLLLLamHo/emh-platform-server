import Koa from 'koa';
import { HttpException } from '../exceptions/http-exception';

export async function catchMiddleware(ctx: Koa.Context, next: Koa.Next) {
  try {
    await next();
  } catch (err: any) {
    ctx.status = 200;

    if (err instanceof HttpException) {
      ctx.body = {
        data: null,
        status: err.status,
        message: err.message || 'Internal Server Error',
        // 你可以添加更多字段
      };
    } else {
      ctx.body = {
        success: false,
        message: err.message || 'Internal Server Error',
      // 你可以添加更多字段
      };
    }


    // 记录错误日志
    console.error('捕获到错误:', err);
  }
}
