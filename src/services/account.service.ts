import Koa from 'koa';
import { generateUsernameFromId } from '../utils/generate-username-from-openid';
import { UserModel } from '../db/user';
import { JWTPayload } from '../interfaces/jwt';
import { generateJWT } from '../utils/generate-jwt';
import { UpdateUserInfoDto } from '../dto/account';

class AccountService {
  /**
   * 更新用户信息
   * @param ctx Koa.Context
   * @param openid string
   * @param data UpdateUserInfoDto
   * @returns UserModel
   */
  async updateUser(ctx: Koa.Context, openid: string, data: UpdateUserInfoDto) {
    try {
      // 按需更新
      const updateData: {[key in string]: any} = {};
      if (data.nickname) {
        updateData.nickname = data.nickname;
      }
      if (data.phone) {
        updateData.phone = data.phone;
      }
      if (data.avatar) {
        updateData.avatar = data.avatar;
      }
      if (data.gender) {
        updateData.gender = data.gender;
      }

      const { db } = ctx.state;
      const res = await db.user.update(updateData, {
        where: {
          openid,
        },
      });

      console.log(res);

      return {
        error: null,
        result: res,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }


  /**
   * 检查当前openid是否存在用户绑定
   * @param ctx Koa.Context
   * @param openid string
   * @returns UserModel
   */
  async findUser(ctx: Koa.Context, openid: string) {
    try {
      const { db } = ctx.state;
      const res = await db.user.findOne({
        where: {
          openid,
        },
      });

      return {
        error: null,
        result: res,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 创建用户
   * @param ctx Koa.Context
   * @param openid string
   * @param unionid string
   * @returns UserModel
   */
  async registrationUser(ctx: Koa.Context, openid: string, unionid: string) {
    try {
      const { db } = ctx.state;
      const username = generateUsernameFromId(openid);
      const res = await db.user.create({
        openid,
        unionid,
        username,
        nickname: username,
        gender: 0,
        freeze: 0,
      });
      return {
        error: null,
        result: res,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 生产access token
   * @param user UserModel
   * @param token string
   * @returns string
   */
  async createUserAccessToken(user: UserModel, token: string) {
    try {
      const { dataValues } = user;

      const jwtPayload: JWTPayload = {
        id: user.id,
        username: dataValues.username,
        openid: dataValues.openid,
        unionid: dataValues.unionid || '',
        createAt: dataValues.createdAt || '',
        updateAt: dataValues.updatedAt || '',
      };
      return {
        error: null,
        result: generateJWT(jwtPayload, token),
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


