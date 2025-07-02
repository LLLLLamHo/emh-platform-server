import Koa from 'koa';
import Router from 'koa-router';
import { HttpException } from '../exceptions/http-exception';
import { accountService } from '../services/account.service';
import { ErrorCode, HTTP_ERROR } from '../constants/code';
import { UpdateUserInfoDto } from '../dto/account';
import { memberService } from '../services/member.service';

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
    // 查询会员信息
    const { error: memberError, result: memberResult } = await memberService.getMember(ctx, userData.id);
    let isMember = false;
    if (!memberError && memberResult) {
      const now = new Date();
      if (memberResult.membership_end_time && new Date(memberResult.membership_end_time) > now) {
        isMember = true;
      }
    }
    ctx.body = {
      userid: userData.id,
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
      isMember, // @anitatodo 返回信息不对
      currentSkin: userData.currentSkin || 'emoji1',
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
      userid: userData.id,
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
      currentSkin: userData.currentSkin,
      birthdayMonth: userData.birthdayMonth,
    };
  });


  // 新增会员保存接口
  router.post('/member/save', async (ctx: Koa.Context) => {
    const { userId, duration } = ctx.request.body as { userId: number; duration: 'half_year' | 'one_year' };
    const { error, result } = await memberService.saveMember(ctx, { userId, duration });
    if (error) {
      ctx.body = { status: 1, message: error.message };
    } else {
      ctx.body = { status: 0, data: result, message: 'success' };
    }
  });

  // 新增会员获取接口
  router.get('/member/info', async (ctx: Koa.Context) => {
    const userId = Number(ctx.query.userId);
    if (!userId) {
      ctx.body = { status: 1, message: 'Missing userId' };
      return;
    }
    const { error, result } = await memberService.getMember(ctx, userId);
    if (error) {
      ctx.body = { status: 1, message: error.message };
    } else {
      ctx.body = { status: 0, data: result, message: 'success' };
    }
  });

}
