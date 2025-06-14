import Router from 'koa-router';
import { accountRouter } from './controllers/account.controller';
import { loginRouter } from './controllers/login.controller';


export function registerRouter() {
  const router = new Router();

  loginRouter(router);
  accountRouter(router);

  return router;
}

