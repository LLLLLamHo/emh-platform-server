import 'koa';

import type { DB } from '../src/db';
import { JWTPayload } from '../src/interfaces/jwt';
import COS from 'cos-nodejs-sdk-v5';

type WxInfo = {
  cloudbaseAccessToken: string;
  openid: string;
  unionid: string;
  appid: string;
};


declare module 'koa' {
  interface DefaultState {
    db: DB;  // 或者你具体的类型
    wxInfo: WxInfo
    user: JWTPayload
    cos: COS
  }
}


