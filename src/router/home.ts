import Router from 'koa-router';
import fs from 'fs';
import path from 'path';

export function homeRouter(router: Router) {
  const homePage = fs.readFileSync(path.join(process.cwd(), './public/index.html'), 'utf-8');
  // 首页
  router.get('/', async (ctx) => {
    console.log(ctx);
    ctx.body = homePage;
  });
}
