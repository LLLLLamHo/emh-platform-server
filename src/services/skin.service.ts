// @ts-nocheck
import Koa from 'koa';
import { SkinModel } from '../db/skin';

const allEmojis = ['emoji1', 'emoji2', 'emoji3', 'emoji4', 'emoji5', 'emoji6'];

class SkinService {
  /**
   * 购买表情（单个或全部）
   */
  async buySkin(ctx: Koa.Context, data: { userId: number; skin: any }) {
    try {
      const { db } = ctx.state;
      const { userId, skin } = data;
      if (!userId || !skin) {
        return { error: new Error('Missing userId or skin'), result: null };
      }
      let skinsToBuy: string[] = [];
      if (skin === 'all') {
        skinsToBuy = allEmojis;
      } else if (allEmojis.includes(skin)) {
        skinsToBuy = [skin];
      } else {
        return { error: new Error('Invalid skin'), result: null };
      }
      // 幂等：先查已拥有的皮肤
      const owned = await db.skinModule.findAll({ where: { userId } });
      const ownedSet = new Set(owned.map((s: SkinModel) => s.skin));
      const toCreate = skinsToBuy.filter(s => !ownedSet.has(s));
      const created = await Promise.all(toCreate.map(s => db.skinModule.create({ userId, skin })));
      return { error: null, result: created };
    } catch (error: any) {
      return { error, result: null };
    }
  }

  /**
   * 获取用户拥有的皮肤
   */
  async getUserSkins(ctx: Koa.Context, userId: number) {
    try {
      const { db } = ctx.state;
      if (!userId) {
        return { error: new Error('Missing userId'), result: null };
      }
      // 新增会员判断逻辑
      const memberRecord = await db.memberModule.findOne({ where: { userId } });
      if (memberRecord && memberRecord.expirationTime && new Date() < new Date(memberRecord.expirationTime)) {
        // 是会员且在有效期内，返回所有表情
        return { error: null, result: ['all'] };
      }
      // 非会员或会员过期，返回实际拥有的皮肤
      const skins = await db.skinModule.findAll({ where: { userId } });
      return { error: null, result: skins.map((s: SkinModel) => s.skin) };
    } catch (error: any) {
      return { error, result: null };
    }
  }
}

export const skinService = new SkinService();
