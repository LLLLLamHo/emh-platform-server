import Koa from 'koa';
import axios from 'axios';
import { Readable } from 'stream';
import { HttpException } from '../exceptions/http-exception';
import { ErrorCode, HTTP_ERROR } from '../constants/code';

class CozeService {
  private readonly baseUrl = 'https://api.coze.cn/v3';
  private readonly authToken = 'pat_0GsD8tD8u4JEf8uFj4klE7SrCfRfvMS1t95MnudjxIpVWuxvImvahyOZqobCJL7C';
  private readonly botId = '7530098047934955574';
  private readonly useId = '123456789';

  /**
   * 构建分析请求体
   */
  private buildAnalysisRequest(content: string, stream = true) {
    return {
      bot_id: this.botId,
      user_id: this.useId,
      stream,
      additional_messages: [
        {
          content,
          content_type: 'text',
          role: 'user',
          type: 'question',
        },
      ],
      parameters: {},
    };
  }

  /**
   * 流式分析心情数据（推荐方式）
   * 实时返回 AI 分析结果，类似打字机效果
   */
  async analyzeMoodStream(ctx: Koa.Context, moodData: any, year: number, month: number): Promise<Readable> {
    const analysisContent = `请分析以下${year}年${month}月的心情数据，给出详细的心情分析和建议：${JSON.stringify(moodData)}`;

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/chat`,
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        data: this.buildAnalysisRequest(analysisContent, true),
        responseType: 'stream',
      });

      if (response.status !== 200) {
        throw new HttpException('Coze stream API request failed', HTTP_ERROR, ErrorCode.SERVER_ERROR);
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(`Coze API request failed: ${error.response.status}`, HTTP_ERROR, ErrorCode.SERVER_ERROR);
      }
      throw new HttpException(`Coze API request failed: ${error.message}`, HTTP_ERROR, ErrorCode.SERVER_ERROR);
    }
  }

  /**
   * 处理流式响应并转换为可读流
   */
  async* processStreamResponse(stream: Readable): AsyncGenerator<string> {
    const allContent = await new Promise<string>((resolve, reject) => {
      const messageMap = new Map<string, string>(); // 用 Map 来存储每个消息 ID 的完整内容
      const messageOrder: string[] = []; // 记录消息 ID 的出现顺序

      stream.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        const match = text.match(/data:(\{.*\})/);
        if(match){
          try {
            const jsonData = JSON.parse(match[1]);
            
            // 只处理 answer 类型的文本消息
            if (jsonData.type === 'answer' && jsonData.content_type === 'text' && jsonData.role ==='assistant') {
              const messageId = jsonData.id;
              
              // 记录消息 ID 的首次出现顺序
              if (!messageOrder.includes(messageId)) {
                messageOrder.push(messageId);
              }
              
              if (messageMap.has(messageId)) {
                // 如果消息已存在，说明这是 delta 更新，需要累积内容
                const existingContent = messageMap.get(messageId) || '';
                messageMap.set(messageId, existingContent + jsonData.content);
              } else {
                // 新消息，直接设置内容
                messageMap.set(messageId, jsonData.content);
              }
            }
          } catch (error) {
            console.log('解析 JSON 失败:', match[1]);
          }
        }
      });

      stream.on('end', () => {
        // 按照消息出现的顺序拼接内容
        const allContent = messageOrder
          .map(id => messageMap.get(id))
          .filter(content => content) // 过滤掉 undefined
          .join('\n\n');
        
        resolve(allContent);
      });

      stream.on('error', (error: Error) => {
        reject(error);
      });
    });

    // 将收集到的所有内容作为单个 chunk 返回
    yield allContent;
  }

  // /**
  //  * 非流式分析心情数据（兼容性方法）
  //  * 一次性返回完整结果
  //  */
  // async analyzeMood(ctx: Koa.Context, moodData: any, year: number, month: number): Promise<any> {
  //   console.warn('analyzeMood method is deprecated, please use analyzeMoodStream instead');

  //   const analysisContent = `请分析以下${year}年${month}月的心情数据，给出详细的心情分析和建议：${JSON.stringify(moodData)}`;

  //   try {
  //     const response = await axios({
  //       method: 'POST',
  //       url: `${this.baseUrl}/chat`,
  //       headers: {
  //         'Authorization': `Bearer ${this.authToken}`,
  //         'Content-Type': 'application/json',
  //     },
  //       data: this.buildAnalysisRequest(analysisContent, false)
  //     });

  //     if (response.status !== 200) {
  //       throw new HttpException('Coze API request failed', HTTP_ERROR, ErrorCode.SERVER_ERROR);
  //     }

  //     return response.data;
  //   } catch (error: any) {
  //     if (error.response) {
  //       throw new HttpException(`Coze API request failed: ${error.response.status}`, HTTP_ERROR, ErrorCode.SERVER_ERROR);
  //     }
  //     throw new HttpException(`Coze API request failed: ${error.message}`, HTTP_ERROR, ErrorCode.SERVER_ERROR);
  //   }
  // }
}

export const cozeService = new CozeService();
