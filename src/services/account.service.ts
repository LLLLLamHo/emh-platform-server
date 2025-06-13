import koa from 'koa';

class AccountService {
  /**
   * 检查当前openid是否存在用户绑定
   * @param ctx Koa.Context
   * @param openid string
   * @returns boolean
   */
  async checkUserExist(ctx: koa.Context, openid: string) {
    try {
      const { db } = ctx.state;
      const res = await db.user.findOne({
        where: {
          openid,
        },
      });

      return {
        error: null,
        result: !!res,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }
}

export const accountService = new AccountService();


