
import Koa from 'koa';
import jwt from 'jsonwebtoken';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode, HTTP_ERROR, HTTP_UNAUTHORIZED } from '../constants/code';
import { ACCESS_TOKEN_PREFIX } from '../constants/common';
import { JWTPayload } from '../interfaces/jwt';

export function jwtMiddleware(): Koa.Middleware {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    if (!process.env.SECRET) {
      throw new HttpException('SECRET not found!', HTTP_ERROR, ErrorCode.SECRET_NOT_FOUND);
    }

    const [path] = ctx.originalUrl.split('?');

    // 除登录接口外，所以接口都需要鉴权
    if (path !== '/login') {
      const { authorization } = ctx.header;
      if (!authorization) {
        throw new HttpException('pass login.', HTTP_UNAUTHORIZED, ErrorCode.NO_LOGIN);
      }

      // 验证jwt
      const token = authorization.replace(`${ACCESS_TOKEN_PREFIX} `, '');
      const decoded = jwt.verify(token,  process.env.SECRET) as JWTPayload;
      if (!decoded) {
        throw new HttpException('pass login again.', HTTP_UNAUTHORIZED, ErrorCode.NO_LOGIN);
      }

      if (ctx.state.wxInfo.openid !== decoded.openid) {
        throw new HttpException('The Openid of the users are inconsistent', HTTP_UNAUTHORIZED, ErrorCode.OPENID_INCONSISTENCY);
      }

      ctx.state.user = decoded as JWTPayload;
    }

    await next();
  };
}
