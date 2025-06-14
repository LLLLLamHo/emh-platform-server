import crypto from 'crypto';

export function generateUsernameFromId(id: string): string {
  // 1. 对 id 做哈希，得到一个固定的哈希值
  const hash = crypto.createHash('md5').update(id)
    .digest('hex');

  // 2. 取哈希的部分字符，映射成字母数字组合
  // 这里简单取前8位，转成数字，再映射成字母数字
  const base36 = parseInt(hash.slice(0, 8), 16).toString(36);

  // 3. 拼接前缀，保证用户名格式
  return `user_${base36}`;
}
