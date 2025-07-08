
import COS from 'cos-nodejs-sdk-v5';
import Koa from 'koa';

export function cosMiddleware(cos: COS): Koa.Middleware {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    ctx.state.cos = cos;
    await next();
  };
}
