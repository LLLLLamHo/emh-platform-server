import Koa from 'koa';
import { CreateGlobalConfigDto, UpdateGlobalConfigDto } from '../dto/global-config';

class GlobalConfigService {
  /**
   * 获取所有全局配置（键值对格式）
   * @param ctx Koa.Context
   * @returns {[key: string]: boolean}
   */
  async getAllConfigs(ctx: Koa.Context) {
    try {
      const { db } = ctx.state;
      const configs: any[] = await db.globalConfigModule.findAll({
        order: [['createdAt', 'ASC']],
      });

      // 转换为键值对格式
      const configMap: {[key: string]: boolean} = {};
      configs.forEach((config: any) => {
        configMap[config.key] = config.value === 'true';
      });

      return {
        error: null,
        result: configMap,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 根据键名获取配置
   * @param ctx Koa.Context
   * @param key string
   * @returns boolean
   */
  async getConfigByKey(ctx: Koa.Context, key: string) {
    try {
      const { db } = ctx.state;
      const config: any = await db.globalConfigModule.findOne({
        where: { key },
      });

      if (!config) {
        return {
          error: null,
          result: true, // 默认值
        };
      }

      return {
        error: null,
        result: config.value === 'true',
      };
    } catch (error: any) {
      return {
        error,
        result: true, // 出错时默认值
      };
    }
  }

  /**
   * 获取所有全局配置（完整信息，用于管理）
   * @param ctx Koa.Context
   * @returns any[]
   */
  async getAllConfigsDetail(ctx: Koa.Context) {
    try {
      const { db } = ctx.state;
      const configs: any[] = await db.globalConfigModule.findAll({
        order: [['createdAt', 'ASC']],
      });

      return {
        error: null,
        result: configs,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 创建新的全局配置
   * @param ctx Koa.Context
   * @param data CreateGlobalConfigDto
   * @returns any
   */
  async createConfig(ctx: Koa.Context, data: CreateGlobalConfigDto) {
    try {
      const { db } = ctx.state;
      
      // 检查是否已存在相同键名的配置
      const existingConfig: any = await db.globalConfigModule.findOne({
        where: { key: data.key },
      });

      if (existingConfig) {
        return {
          error: new Error('配置键名已存在'),
          result: null,
        };
      }

      const config: any = await db.globalConfigModule.create(data);

      return {
        error: null,
        result: config,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 更新全局配置
   * @param ctx Koa.Context
   * @param key string
   * @param data UpdateGlobalConfigDto
   * @returns any
   */
  async updateConfig(ctx: Koa.Context, key: string, data: UpdateGlobalConfigDto) {
    try {
      const { db } = ctx.state;
      
      const updateData: {[key in string]: any} = {};
      if (data.value !== undefined) {
        updateData.value = data.value;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      const result: any = await db.globalConfigModule.update(updateData, {
        where: { key },
      });

      return {
        error: null,
        result,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 删除全局配置
   * @param ctx Koa.Context
   * @param key string
   * @returns number
   */
  async deleteConfig(ctx: Koa.Context, key: string) {
    try {
      const { db } = ctx.state;
      const result: any = await db.globalConfigModule.destroy({
        where: { key },
      });

      return {
        error: null,
        result,
      };
    } catch (error: any) {
      return {
        error,
        result: null,
      };
    }
  }

  /**
   * 获取支付模块显示状态
   * @param ctx Koa.Context
   * @returns boolean
   */
  async getPaymentModuleStatus(ctx: Koa.Context) {
    try {
      const { db } = ctx.state;
      const config: any = await db.globalConfigModule.findOne({
        where: { key: 'show_payment_module' },
      });

      if (!config) {
        return {
          error: null,
          result: true, // 默认显示
        };
      }

      return {
        error: null,
        result: config.value === 'true',
      };
    } catch (error: any) {
      return {
        error,
        result: true, // 出错时默认显示
      };
    }
  }
}

export const globalConfigService = new GlobalConfigService(); 