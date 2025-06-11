import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import { initDB } from './db';
import { registerRouter } from './router';
import dotenv from 'dotenv';

const envPaths = ['.env', '.env.local'];
dotenv.config({ path: envPaths, override: true });
const port = process.env.PORT || 80;

async function bootstrap() {
  const app = new Koa();

  const models = await initDB();

  const router = registerRouter();

  app
    .use(logger())
    .use(bodyParser())
    .use(async (ctx, next) => {
      ctx.state.db = { ...models };
      await next();
    })
    .use(router.routes())
    .use(router.allowedMethods());

  app.listen(port, () => {
    console.log('启动成功', port);
  });
}

bootstrap();
