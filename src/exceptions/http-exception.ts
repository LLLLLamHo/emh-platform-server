import { ErrorCode } from '../constants/code';

export class HttpException extends Error {
  public status: number;
  public code?: ErrorCode;

  constructor(message: string, status = 500, code?: ErrorCode) {
    super(message);
    this.status = status;
    this.code = code;

    // 修正原型链，确保 instanceof 正常工作
    Object.setPrototypeOf(this, HttpException.prototype);

    // 可选：捕获堆栈信息
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
