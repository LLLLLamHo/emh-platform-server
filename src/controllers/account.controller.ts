import Koa from 'koa';
import Router from 'koa-router';
import { HttpException } from '../exceptions/http-exception';
import { accountService } from '../services/account.service';
import { ErrorCode, HTTP_BAD_REQUEST, HTTP_ERROR } from '../constants/code';
import { UpdateUserInfoDto } from '../dto/account';
import { memberService } from '../services/member.service';
import dayjs from 'dayjs';
import { MemberDuration } from '../constants/member';

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
      if (memberResult?.expirationTime && dayjs().isBefore(dayjs(memberResult.expirationTime))) {
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
    const { duration } = ctx.request.body as { userId: number; duration: MemberDuration };
    const { id } = ctx.state.user;

    if (!Object.values(MemberDuration).includes(duration)) {
      throw new HttpException('The value of duration is illegal', HTTP_BAD_REQUEST, ErrorCode.MEMBER_DURATION_ILLEGAL);
    }

    const memberRecord =  await memberService.getMember(ctx, id);
    if (memberRecord.error) {
      throw new HttpException(memberRecord.error.message, HTTP_ERROR, ErrorCode.MEMBER_ERROR);
    }
    if (memberRecord.result) {
      throw new HttpException('The current user is already a member', HTTP_ERROR, ErrorCode.MEMBER_EXIST);
    }

    const { error, result } = await memberService.saveMember(ctx, { userId: id, duration });
    if (error) {
      ctx.body = { status: 1, message: error.message };
    } else {
      ctx.body = { status: 0, data: {
        expirationTime: result?.dataValues?.expirationTime,
      }, message: 'success' };
    }
  });

  // 新增会员获取接口
  router.get('/member/info', async (ctx: Koa.Context) => {
    const { id } = ctx.state.user;
    const { error, result } = await memberService.getMember(ctx, id);
    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.MEMBER_ERROR);
    } else {
      ctx.body = { status: 0, data: {
        expirationTime: result?.dataValues?.expirationTime,
      }, message: 'success' };
    }
  });
}
