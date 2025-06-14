import Koa from 'koa';
import Router from 'koa-router';
import { accountService } from '../services/account.service';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode, HTTP_BAD_REQUEST, HTTP_ERROR } from '../constants/code';
import { ACCESS_TOKEN_PREFIX } from '../constants/common';


export function loginRouter(router: Router) {
  /**
   * 小程序登录
   */
  router.get('/login', async (ctx: Koa.Context) => {
    const { wxInfo } = ctx.state;
    if (!wxInfo.openid) {
      throw new HttpException('Missing openid', HTTP_BAD_REQUEST, ErrorCode.MISS_OPENID);
    }

    const { error, result } = await accountService.findUser(ctx, wxInfo.openid);
    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.MISS_OPENID);
    }

    let userData;

    // 用户不存在，进行注册流程
    if (!result) {
      const { error: createError, result: createResult } = await accountService.registrationUser(ctx, wxInfo.openid, wxInfo.unionid);

      if (createError) {
        throw new HttpException(createError.message, HTTP_ERROR, ErrorCode.CREATE_USER_ERROR);
      }

      if (!createResult) {
        throw new HttpException('create user fail', HTTP_ERROR, ErrorCode.CREATE_USER_ERROR);
      }

      userData = createResult;
    } else {
      userData = result;
    }

    if (!process.env.SECRET) {
      throw new HttpException('SECRET not found!', HTTP_ERROR, ErrorCode.SECRET_NOT_FOUND);
    }
    const { error: createAsseccTokenError, result: accessToken } = await accountService.createUserAccessToken(userData, process.env.SECRET);

    if (createAsseccTokenError) {
      throw new HttpException(createAsseccTokenError.message, HTTP_ERROR, ErrorCode.CREATE_ACCESS_TOKEN_ERROR);
    }

    if (!accessToken) {
      throw new HttpException('create access token fail', HTTP_ERROR, ErrorCode.CREATE_ACCESS_TOKEN_ERROR);
    }

    ctx.body = {
      token: `${ACCESS_TOKEN_PREFIX} ${accessToken}`,
    };
  });
}
