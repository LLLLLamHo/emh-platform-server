import Router from 'koa-router';
import { accountRouter } from './controllers/account.controller';
import { loginRouter } from './controllers/login.controller';
import { moodRouter } from './controllers/mood.controller';
import { skinRouter } from './controllers/skin.controller';


export function registerRouter() {
  const router = new Router();

  loginRouter(router);
  accountRouter(router);
  moodRouter(router);
  skinRouter(router);

  return router;
}

