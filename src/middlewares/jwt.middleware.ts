
import Koa from 'koa';

export function jwtMiddleware(): Koa.Middleware {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    await next();
  };
}
