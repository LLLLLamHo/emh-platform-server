export interface JWTPayload {
  id: number;
  username: string
  openid: string
  unionid: string
  createAt: Date | string
  updateAt: Date | string
}
