import Koa from 'koa';
import { WX_APPID, WX_CLOUDBASE_ACCESS_TOKEN, WX_OPENID, WX_UNIONID } from '../constants/wx';


export async function getWxCommonHeaderMiddleware(ctx: Koa.Context, next:  Koa.Next) {
  ctx.state.wxInfo = {
    cloudbaseAccessToken: ctx.header[WX_CLOUDBASE_ACCESS_TOKEN] as string,
    openid: ctx.header[WX_OPENID] as string,
    unionid: ctx.header[WX_UNIONID] as string,
    appid: ctx.header[WX_APPID] as string,
  };
  await next();
}
