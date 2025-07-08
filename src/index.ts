import './utils/init-dayjs';
import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import { initDB } from './db';
import { registerRouter } from './router';
import dotenv from 'dotenv';
import { catchMiddleware } from './middlewares/catch.middleware';
import { getWxCommonHeaderMiddleware } from './middlewares/get-wx-common-header.middleware';
import { dbMiddleware } from './middlewares/db.middleware';
import { jwtMiddleware } from './middlewares/jwt.middleware';
import { initCOS } from './utils/init-cos';
import { cosMiddleware } from './middlewares/cos.middleware';

const envPaths = ['.env', '.env.local'];
dotenv.config({ path: envPaths, override: true });
const port = process.env.PORT || 80;

async function bootstrap() {
  const app = new Koa();

  const models = await initDB();
  const cos = await initCOS();

  if (!models) {
    throw Error('init db fail!');
  }

  const router = registerRouter();
  app
    .use(logger())
    .use(catchMiddleware)
    .use(getWxCommonHeaderMiddleware)
    .use(jwtMiddleware())
    .use(bodyParser())
    .use(cosMiddleware(cos))
    .use(dbMiddleware(models))
    .use(router.routes())
    .use(router.allowedMethods());

  app.listen(port, () => {
    console.log('启动成功', port);
  });
}

bootstrap();
