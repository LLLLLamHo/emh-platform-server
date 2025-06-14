import Koa from 'koa';
import Router from 'koa-router';

const ROUTER_PREFIX = 'account';

export function accountRouter(router: Router) {
  /**
   * 获取用户信息
   */
  router.get(`/${ROUTER_PREFIX}/user-info`, async (ctx: Koa.Context) => {
    const { user } = ctx.state;
    console.log(user);
    ctx.body = {
      data: 123,
    };
  });
}
