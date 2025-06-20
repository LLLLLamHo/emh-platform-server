import Router from 'koa-router';
import { accountRouter } from './controllers/account.controller';
import { loginRouter } from './controllers/login.controller';
import { moodRouter } from './controllers/mood.controller';


export function registerRouter() {
  const router = new Router();

  loginRouter(router);
  accountRouter(router);
  moodRouter(router);

  return router;
}

