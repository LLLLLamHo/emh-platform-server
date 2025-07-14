import Koa from 'koa';


class CosService {
  async removeObject(ctx: Koa.Context, imgs: string[]) {
    try {
      const { cos } = ctx.state;
      const cosConfig = this.generatedCosConfig();
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < imgs.length; i++) {
        const originalKey = imgs[i].replace(`cloud://${process.env.ENV_ID}.${process.env.COS_BUCKET}/`, '');

        await cos.deleteObject({
          ...cosConfig,
          Key: originalKey,
        });
      }
    } catch (error: any) {
      console.error(error);
    }
  }

  async moveObject(ctx: Koa.Context, imgs: string[]) {
    try {
      const {  cos, user } = ctx.state;
      const cosConfig = this.generatedCosConfig();
      const saveImageList = [];

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < imgs.length; i++) {
        const originalKey = imgs[i].replace(`cloud://${process.env.ENV_ID}.${process.env.COS_BUCKET}/`, '');
        const originalKeyArray = originalKey.split('/');

        // 获取url
        const copySource = await cos.getObjectUrl({
          ...cosConfig,
          Key: originalKey,
        });

        if (!copySource) {
          throw Error('get upload source url fail');
        }
        const copySourceUrl = copySource.replace('https://', '');

        const objectPath = `mood-images/${user.id}/mood/${originalKeyArray[originalKeyArray.length - 1]}`;

        // 移动图片到持久化目录
        const putRes = await cos.putObjectCopy({
          ...cosConfig,
          Key: objectPath,
          CopySource: copySourceUrl,
        });

        if (putRes.statusCode !== 200) {
          throw Error('copy upload image to target dir fail');
        }

        // 删除tmp的文件
        const delRes = await cos.deleteObject({
          ...cosConfig,
          Key: originalKey,
        });

        if (delRes.statusCode !== 204) {
          throw Error('delete upload tmp image fail');
        }

        saveImageList.push(`cloud://${process.env.ENV_ID}.${process.env.COS_BUCKET}/${objectPath}`);
      }


      return {
        result: saveImageList,
        error: null,
      };
    } catch (error: any) {
      console.error(error);
      return {
        result: [],
        error,
      };
    }
  }


  private generatedCosConfig() {
    return {
      Bucket: process.env.COS_BUCKET || '',
      Region: process.env.COS_REGION || '',
    };
  }
}

export const cosService = new CosService();
// cloud://prod-6glre6n1cad02d9f.7072-prod-6glre6n1cad02d9f-1363336642/mood-images/10001/tmp/1751722059256_0_uccxe9jht.jpg
