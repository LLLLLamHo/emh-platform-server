
import Koa from 'koa';
import { DB } from '../db';

export function dbMiddleware(models: DB): Koa.Middleware {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    ctx.state.db = models;
    await next();
  };
}
