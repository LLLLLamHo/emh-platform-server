import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import { initDB } from './db';
import { registerRouter } from './router';
import dotenv from 'dotenv';
import { catchMiddleware } from './middlewares/catch.middleware';
import { getWxCommonHeaderMiddleware } from './middlewares/get-wx-common-header.middleware';
import { dbMiddleware } from './middlewares/db.middleware';

const envPaths = ['.env', '.env.local'];
dotenv.config({ path: envPaths, override: true });
const port = process.env.PORT || 80;

async function bootstrap() {
  const app = new Koa();

  const models = await initDB();

  if (!models) {
    throw Error('init db fail!');
  }

  const router = registerRouter();

  app
    .use(logger())
    .use(catchMiddleware)
    .use(bodyParser())
    .use(dbMiddleware(models))
    .use(getWxCommonHeaderMiddleware)
    .use(router.routes())
    .use(router.allowedMethods());

  app.listen(port, () => {
    console.log('启动成功', port);
  });
}

bootstrap();
