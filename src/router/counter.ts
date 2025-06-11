import Router from 'koa-router';

export function counterRouter(router: Router) {
  // 更新计数
  router.post('/api/count', async (ctx) => {
    const { request } = ctx;
    // @ts-ignore
    const { action } = request.body;
    if (action === 'inc') {
      await ctx.state.db.counter.create();
    } else if (action === 'clear') {
      await ctx.state.db.counter.destroy({
        truncate: true,
      });
    }

    ctx.body = {
      code: 0,
      data: await ctx.state.db.counter.count(),
    };
  });

  // 获取计数
  router.get('/api/count', async (ctx) => {
    console.log(ctx);
    const result = await ctx.state.db.counter.count();

    ctx.body = {
      code: 0,
      data: result,
    };
  });

  // 小程序调用，获取微信 Open ID
  router.get('/api/wx_openid', async (ctx) => {
    if (ctx.request.headers['x-wx-source']) {
      ctx.body = ctx.request.headers['x-wx-openid'];
    }
  });
}
