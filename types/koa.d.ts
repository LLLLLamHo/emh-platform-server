import 'koa';

declare module 'koa' {
  interface DefaultState {
    db: any;  // 或者你具体的类型
  }
}
