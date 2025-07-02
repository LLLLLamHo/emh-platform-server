import Koa from 'koa';

class MemberService {
  /**
   * 保存会员信息
   */
  async saveMember(ctx: Koa.Context, data: { userId: number; duration: 'half_year' | 'one_year' }) {
    try {
      const { db } = ctx.state;
      const { userId, duration } = data;
      if (!userId || !duration) {
        return { error: new Error('Missing userId or duration'), result: null };
      }
      const now = new Date();
      let end: Date;
      if (duration === 'half_year') {
        end = new Date(now.getTime());
        end.setMonth(end.getMonth() + 6);
      } else if (duration === 'one_year') {
        end = new Date(now.getTime());
        end.setFullYear(end.getFullYear() + 1);
      } else {
        return { error: new Error('Invalid duration'), result: null };
      }
      const renew = end;
      const member = await db.memberModule.create({
        user_id: userId,
        membership_start_time: now,
        membership_end_time: end,
        membership_renew_time: renew,
      });
      return { error: null, result: member };
    } catch (error: any) {
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
      console.log('getMember 查询会员表', userId);
      const member = await db.memberModule.findOne({ where: { user_id: userId } });
      console.log('会员表查到的结果:日志打印不出来', member);
      return { error: null, result: member };
    } catch (error: any) {
      return { error, result: null };
    }
  }
}

export const memberService = new MemberService();
