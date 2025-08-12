import Router from 'koa-router';
import { accountRouter } from './controllers/account.controller';
import { loginRouter } from './controllers/login.controller';
import { moodRouter } from './controllers/mood.controller';
import { analyseRouter } from './controllers/analyse.controller';
import { skinRouter } from './controllers/skin.controller';
import { globalConfigRouter } from './controllers/global-config.controller';


export function registerRouter() {
  const router = new Router();

  loginRouter(router);
  accountRouter(router);
  moodRouter(router);
  analyseRouter(router);
  skinRouter(router);
  globalConfigRouter(router);

  return router;
}

