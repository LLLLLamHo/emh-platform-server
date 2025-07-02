import dayjs from 'dayjs';
import Koa from 'koa';
import { MemberDuration } from '../constants/member';

class MemberService {
  /**
   * 保存会员信息
   */
  async saveMember(ctx: Koa.Context, data: { userId: number; duration: MemberDuration }) {
    try {
      const { db } = ctx.state;
      const { userId, duration } = data;
      if (!userId || !duration) {
        return { error: new Error('Missing userId or duration'), result: null };
      }


      let expiration: dayjs.Dayjs;
      if (duration === MemberDuration.HALF_YEAR) {
        expiration = dayjs().add(6, 'month')
          .hour(23)
          .minute(59)
          .second(59)
          .millisecond(0);
      } else if (duration === MemberDuration.ONE_YEAR) {
        expiration = dayjs().add(1, 'year')
          .hour(23)
          .minute(59)
          .second(59)
          .millisecond(0);
      } else {
        return { error: new Error('Invalid duration'), result: null };
      }

      const member = await db.memberModule.create({
        userId,
        expirationTime: expiration.toDate(),
      });

      return { error: null, result: member };
    } catch (error: any) {
      console.log(error);
      return { error, result: null };
    }
  }

  /**
   * 获取会员信息
   */
  async getMember(ctx: Koa.Context, userId: number) {
    try {
      const { db } = ctx.state;
      if (!userId) {
        return { error: new Error('Missing userId'), result: null };
      }
      const member = await db.memberModule.findOne({ where: { userId } });
      return { error: null, result: member };
    } catch (error: any) {
      console.log(error);
      return { error, result: null };
    }
  }
}

export const memberService = new MemberService();
