import Koa from 'koa';
import { HttpException } from '../exceptions/http-exception';
import { HTTP_ERROR, HTTP_OK } from '../constants/code';

export async function catchMiddleware(ctx: Koa.Context, next: Koa.Next) {
  try {
    await next();
  } catch (err: any) {
    ctx.status = HTTP_OK;

    if (err instanceof HttpException) {
      ctx.body = {
        data: null,
        code: err.code || -1,
        status: err.status || HTTP_ERROR,
        message: err.message || 'Internal Server Error',
        // 你可以添加更多字段
      };
    } else {
      ctx.body = {
        data: null,
        code: err.code || -1,
        status: err.status || HTTP_ERROR,
        message: err.message || 'Internal Server Error',
      // 你可以添加更多字段
      };
    }


    // 记录错误日志
    console.error('捕获到错误:', err);
  }
}
