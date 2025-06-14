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

    let userData;

    // 用户不存在，进行注册流程
    if (!result) {
      const { error: createError, result: createResult } = await accountService.registrationUser(ctx, wxInfo.openid, wxInfo.unionid);

      if (createError) {
        throw new HttpException(createError.message, ErrorCode.CREATE_USER_ERROR);
      }

      if (!createResult) {
        throw new HttpException('create user fail', ErrorCode.CREATE_USER_ERROR);
      }

      userData = createResult;
    } else {
      userData = result;
    }

    if (!process.env.SECRET) {
      throw new HttpException('SECRET not found!', ErrorCode.SECRET_NOT_FOUND);
    }
    const { error: createAsseccTokenError, result: accessToken } = await accountService.createUserAccessToken(userData, process.env.SECRET);

    if (createAsseccTokenError) {
      throw new HttpException(createAsseccTokenError.message, ErrorCode.CREATE_ACCESS_TOKEN_ERROR);
    }

    if (!accessToken) {
      throw new HttpException('create access token fail', ErrorCode.CREATE_ACCESS_TOKEN_ERROR);
    }

    ctx.body = {
      token: accessToken,
    };
  });
}
