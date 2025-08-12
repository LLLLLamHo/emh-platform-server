import Koa from 'koa';
import Router from 'koa-router';
import { HttpException } from '../exceptions/http-exception';
import { globalConfigService } from '../services/global-config.service';
import { ErrorCode, HTTP_BAD_REQUEST, HTTP_ERROR, HTTP_NOT_FOUND } from '../constants/code';
import { CreateGlobalConfigDto, UpdateGlobalConfigDto } from '../dto/global-config';

const ROUTER_PREFIX = 'global-config';

export function globalConfigRouter(router: Router) {
  /**
   * 获取所有全局配置（键值对格式）
   */
  router.get(`/${ROUTER_PREFIX}/setting`, async (ctx: Koa.Context) => {
    const { error, result } = await globalConfigService.getAllConfigs(ctx);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.FIND_USER_FAIL);
    }

    ctx.body = {
      status: 0,
      data: result,
      message: 'success',
    };
  });

  /**
   * 获取所有全局配置（完整信息，用于管理）
   */
  router.get(`/${ROUTER_PREFIX}/admin/all`, async (ctx: Koa.Context) => {
    const { error, result } = await globalConfigService.getAllConfigsDetail(ctx);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.FIND_USER_FAIL);
    }

    ctx.body = {
      status: 0,
      data: result,
      message: 'success',
    };
  });

  /**
   * 根据键名获取配置
   */
  router.get(`/${ROUTER_PREFIX}/:key`, async (ctx: Koa.Context) => {
    const { key } = ctx.params;

    if (!key) {
      throw new HttpException('配置键名不能为空', HTTP_BAD_REQUEST, ErrorCode.FIND_USER_FAIL);
    }

    const { error, result } = await globalConfigService.getConfigByKey(ctx, key);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.FIND_USER_FAIL);
    }

    ctx.body = {
      status: 0,
      data: {
        [key]: result
      },
      message: 'success',
    };
  });

  /**
   * 创建新的全局配置
   */
  router.post(`/${ROUTER_PREFIX}`, async (ctx: Koa.Context) => {
    const { body } = ctx.request;
    const configData = body as CreateGlobalConfigDto;

    if (!configData.key || !configData.value) {
      throw new HttpException('配置键名和值不能为空', HTTP_BAD_REQUEST, ErrorCode.FIND_USER_FAIL);
    }

    const { error, result } = await globalConfigService.createConfig(ctx, configData);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.UPDATE_USER_ERROR);
    }

    ctx.body = {
      status: 0,
      data: result,
      message: 'success',
    };
  });

  /**
   * 更新全局配置
   */
  router.put(`/${ROUTER_PREFIX}/:key`, async (ctx: Koa.Context) => {
    const { key } = ctx.params;
    const { body } = ctx.request;
    const configData = body as UpdateGlobalConfigDto;

    if (!key) {
      throw new HttpException('配置键名不能为空', HTTP_BAD_REQUEST, ErrorCode.FIND_USER_FAIL);
    }

    if (!configData.value && configData.description === undefined) {
      throw new HttpException('至少需要提供配置值或描述', HTTP_BAD_REQUEST, ErrorCode.FIND_USER_FAIL);
    }

    const { error, result } = await globalConfigService.updateConfig(ctx, key, configData);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.UPDATE_USER_ERROR);
    }

    if (!result || result[0] !== 1) {
      throw new HttpException('更新配置失败，配置可能不存在', HTTP_ERROR, ErrorCode.UPDATE_USER_FAIL);
    }

    // 重新获取更新后的配置
    const { error: findError, result: updatedConfig } = await globalConfigService.getConfigByKey(ctx, key);

    if (findError) {
      throw new HttpException(findError.message, HTTP_ERROR, ErrorCode.FIND_USER_FAIL);
    }

    ctx.body = {
      status: 0,
      data: {
        [key]: updatedConfig
      },
      message: 'success',
    };
  });

  /**
   * 删除全局配置
   */
  router.delete(`/${ROUTER_PREFIX}/:key`, async (ctx: Koa.Context) => {
    const { key } = ctx.params;

    if (!key) {
      throw new HttpException('配置键名不能为空', HTTP_BAD_REQUEST, ErrorCode.FIND_USER_FAIL);
    }

    const { error, result } = await globalConfigService.deleteConfig(ctx, key);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.UPDATE_USER_ERROR);
    }

    if (!result || result === 0) {
      throw new HttpException('删除配置失败，配置可能不存在', HTTP_ERROR, ErrorCode.UPDATE_USER_FAIL);
    }

    ctx.body = {
      status: 0,
      message: '删除成功',
    };
  });

  /**
   * 获取支付模块显示状态
   */
  router.get(`/${ROUTER_PREFIX}/payment/status`, async (ctx: Koa.Context) => {
    const { error, result } = await globalConfigService.getPaymentModuleStatus(ctx);

    if (error) {
      throw new HttpException(error.message, HTTP_ERROR, ErrorCode.FIND_USER_FAIL);
    }

    ctx.body = {
      status: 0,
      data: {
        show_payment_module: result,
      },
      message: 'success',
    };
  });
} 