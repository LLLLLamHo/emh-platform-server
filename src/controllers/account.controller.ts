import Koa from 'koa';
import Router from 'koa-router';
import { accountService } from '../services/account.service';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode } from '../constants/code';

const ROUTER_PREFIX = 'account';

export function accountRouter(router: Router) {
  // 小程序调用，获取微信 Open ID
  router.get(`/${ROUTER_PREFIX}/login`, async (ctx: Koa.Context) => {
    const { wxInfo } = ctx.state;
    if (!wxInfo.openid) {
      throw new HttpException('Missing openid', ErrorCode.MISS_OPENID);
    }

    const { error, result } = await accountService.checkUserExist(ctx, wxInfo.openid);
    if (error) {
      throw new HttpException(error.message, ErrorCode.MISS_OPENID);
    }

    // 用户不存在，进行注册流程
    if (!result) {

    }

    // 进行登录生成token

    ctx.body = wxInfo;
  });
}
