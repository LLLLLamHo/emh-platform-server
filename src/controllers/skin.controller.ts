import Koa from 'koa';
import Router from 'koa-router';
import { skinService } from '../services/skin.service';

export function skinRouter(router: Router) {
  // 购买表情接口
  router.post('/skin/buy', async (ctx: Koa.Context) => {
    const { userId, skin } = ctx.request.body as { userId: number; skin: string };
    const { error, result } = await skinService.buySkin(ctx, { userId, skin });
    if (error) {
      ctx.body = { status: 1, message: error.message };
    } else {
      ctx.body = { status: 0, data: result, message: 'success' };
    }
  });

  // 查看当前用户拥有的皮肤接口
  router.get('/skin/list', async (ctx: Koa.Context) => {
    const { user } = ctx.state;
    const userId = user.id;
    if (!userId) {
      ctx.body = { status: 1, message: 'Missing userId' };
      return;
    }
    const { error, result } = await skinService.getUserSkins(ctx, userId);
    if (error) {
      ctx.body = { status: 1, message: error.message };
    } else {
      //@ts-ignore
      ctx.body = result.length > 0 ? result : ['emoji1'];
    }
  });
}
