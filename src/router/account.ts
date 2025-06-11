import Router from 'koa-router';

const ROUTER_PREFIX = 'account';

export function accountRouter(router: Router) {
  // 小程序调用，获取微信 Open ID
  router.get(`/${ROUTER_PREFIX}/login`, async (ctx) => {
    console.log(ctx);
    ctx.body = {
      code: 0,
      data: 123,
    };
  });
}
