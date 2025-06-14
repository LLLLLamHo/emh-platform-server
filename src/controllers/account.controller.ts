import Koa from 'koa';
import Router from 'koa-router';
import { HttpException } from '../exceptions/http-exception';
import { accountService } from '../services/account.service';
import { ErrorCode, HTTP_ERROR } from '../constants/code';
import { UpdateUserInfoDto } from '../dto/account';

const ROUTER_PREFIX = 'account';

export function accountRouter(router: Router) {
  /**
   * 获取用户信息
   */
  router.get(`/${ROUTER_PREFIX}/user-info`, async (ctx: Koa.Context) => {
    const { user } = ctx.state;
    const { openid } = user;

    const { error, result } = await accountService.findUser(ctx, openid);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.FIND_USER_FAIL);
    }

    if (!result) {
      throw new HttpException('user not found', HTTP_ERROR, ErrorCode.USER_NOT_FOUND);
    }

    // 过滤一波数据
    const userData = result.dataValues;
    ctx.body = {
      username: userData.username,
      nickname: userData.nickname,
      openid: userData.openid,
      unionid: userData.unionid,
      phone: userData.phone,
      avatar: userData.avatar,
      gender: userData.gender,
      freeze: userData.freeze,
      createAt: userData.createdAt,
      updateAt: userData.updatedAt,
    };
  });

  /**
   * 更新用户信息
   */
  router.put(`/${ROUTER_PREFIX}/user-info`, async (ctx: Koa.Context) => {
    const { user } = ctx.state;
    const { openid } = user;
    const { body } = ctx.request;

    const { error, result } = await accountService.updateUser(ctx, openid, body as UpdateUserInfoDto);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.UPDATE_USER_ERROR);
    }

    if (!result || result[0] !== 1) {
      throw new HttpException('update user fail, There is no chance of update.', HTTP_ERROR, ErrorCode.UPDATE_USER_FAIL);
    }

    // 重新提供最新的用户数据
    const { error: findUserError, result: userResult } = await accountService.findUser(ctx, openid);

    if (findUserError) {
      throw new HttpException(findUserError.message, HTTP_ERROR, ErrorCode.FIND_USER_FAIL);
    }

    if (!userResult) {
      throw new HttpException('user not found', HTTP_ERROR, ErrorCode.USER_NOT_FOUND);
    }
    // 过滤一波数据
    const userData = userResult.dataValues;
    ctx.body = {
      username: userData.username,
      nickname: userData.nickname,
      openid: userData.openid,
      unionid: userData.unionid,
      phone: userData.phone,
      avatar: userData.avatar,
      gender: userData.gender,
      freeze: userData.freeze,
      createAt: userData.createdAt,
      updateAt: userData.updatedAt,
    };
  });
}
