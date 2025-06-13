import Router from 'koa-router';
import { accountRouter } from './controllers/account.controller';


export function registerRouter() {
  const router = new Router();

  accountRouter(router);

  return router;
}

