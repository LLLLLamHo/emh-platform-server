import COS from 'cos-nodejs-sdk-v5';
import axios from 'axios';
export async function initCOS() {
  const res = await axios.get('http://api.weixin.qq.com/_/cos/getauth');

  const { data } = res;
  const auth = {
    TmpSecretId: data.TmpSecretId,
    TmpSecretKey: data.TmpSecretKey,
    SecurityToken: data.Token,
    ExpiredTime: data.ExpiredTime,
  };
  const cos = new COS({
    async getAuthorization(options, callback) {
      callback(auth as any);
    },
  });

  console.log('COS初始化成功');
  return cos;
}

