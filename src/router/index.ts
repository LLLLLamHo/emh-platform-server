import Router from 'koa-router';
import { counterRouter } from './counter';
import { homeRouter } from './home';
import { accountRouter } from './account';


export function registerRouter() {
  const router = new Router();

  homeRouter(router);
  counterRouter(router);
  accountRouter(router);

  return router;
}

