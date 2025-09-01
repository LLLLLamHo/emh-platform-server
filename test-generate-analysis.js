const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000'; // 根据你的服务器端口调整
const API_ENDPOINT = '/analyse/test-generate';

// 测试数据
const testData = {
  year: 2024,
  month: 8, // 8月
  userId: 1 // 可选，如果不提供则使用当前登录用户
};

// 测试函数
async function testGenerateAnalysis() {
  try {
    console.log('🚀 开始测试生成分析接口...');
    console.log(`📅 目标: ${testData.year}年${testData.month}月`);
    console.log(`👤 用户ID: ${testData.userId || '当前登录用户'}`);
    console.log('─'.repeat(50));

    const response = await axios.post(`${BASE_URL}${API_ENDPOINT}`, testData, {
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，在这里添加token
        // 'Authorization': 'Bearer your-jwt-token'
      }
    });

    console.log('✅ 请求成功!');
    console.log('📊 响应数据:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ 请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

// 运行测试
testGenerateAnalysis(); 