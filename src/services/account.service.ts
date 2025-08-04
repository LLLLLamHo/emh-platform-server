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
      if (data.currentSkin) {
        updateData.currentSkin = data.currentSkin;
      }
      if (data.birthdayMonth) {
        updateData.birthdayMonth = data.birthdayMonth;
      }

      const { db } = ctx.state;
      const res = await db.userModule.update(updateData, {
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
      const res = await db.userModule.findOne({
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
      
      // 创建用户，设置默认皮肤为 emoji1
      const res = await db.userModule.create({
        openid,
        unionid,
        username,
        nickname: username,
        gender: 0,
        freeze: 0,
        currentSkin: 'emoji1', // 设置默认皮肤
      });

      // 创建用户的皮肤数据
      if (res && res.id) {
        try {
          await db.skinModule.create({
            userId: res.id,
            skin: 'emoji1', // 默认皮肤
          });
          console.log(`用户 ${res.id} 的默认皮肤数据创建成功`);
        } catch (skinError: any) {
          console.error('创建用户皮肤数据失败:', skinError);
          // 皮肤创建失败不影响用户注册，只记录错误
        }
      }

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


