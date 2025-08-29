# 测试接口使用说明

## 新增接口：手动触发生成分析

### 接口信息
- **URL**: `POST /analyse/test-generate`
- **功能**: 手动触发生成指定月份的心情分析
- **用途**: 测试、调试、手动生成历史月份分析

### 请求参数

#### Body 参数
```json
{
  "year": 2024,        // 必填：年份
  "month": 8,          // 必填：月份 (1-12)
  "userId": 1          // 可选：用户ID，不提供则使用当前登录用户
}
```

#### 参数说明
- `year`: 年份，必须是有效数字
- `month`: 月份，范围 1-12
- `userId`: 用户ID，可选参数。如果不提供，将使用当前登录用户的ID

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "message": "用户 1 2024年8月 分析生成成功",
  "data": {
    "userId": 1,
    "year": 2024,
    "month": 8,
    "status": "success"
  }
}
```

#### 失败响应
```json
{
  "success": false,
  "message": "用户 1 2024年8月 分析生成失败",
  "data": {
    "userId": 1,
    "year": 2024,
    "month": 8,
    "status": "failed"
  }
}
```

### 使用示例

#### 1. 使用 curl 命令
```bash
# 生成2024年8月的分析
curl -X POST http://localhost:3000/analyse/test-generate \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "month": 8}'

# 为指定用户生成分析
curl -X POST http://localhost:3000/analyse/test-generate \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "month": 8, "userId": 1}'
```

#### 2. 使用 JavaScript/Node.js
```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:3000/analyse/test-generate', {
  year: 2024,
  month: 8,
  userId: 1
});

console.log(response.data);
```

#### 3. 使用 Python
```python
import requests

response = requests.post('http://localhost:3000/analyse/test-generate', json={
    'year': 2024,
    'month': 8,
    'userId': 1
})

print(response.json())
```

### 注意事项

1. **权限要求**: 需要用户登录，接口会验证用户身份
2. **数据依赖**: 生成分析需要该月份有心情记录数据
3. **性能考虑**: 分析生成过程可能需要一些时间，特别是AI分析部分
4. **重复调用**: 如果该月份已有分析结果，会返回现有结果
5. **错误处理**: 接口会记录失败的分析，可以通过重试机制重新生成

### 测试脚本

项目根目录提供了 `test-generate-analysis.js` 测试脚本，可以直接运行：

```bash
# 安装依赖
npm install axios

# 运行测试
node test-generate-analysis.js
```

### 常见错误

1. **400 Bad Request**: 参数缺失或格式错误
2. **401 Unauthorized**: 用户未登录或token无效
3. **500 Internal Server Error**: 服务器内部错误，查看日志获取详细信息

### 日志输出

接口执行过程中会在控制台输出详细日志：
```
[测试接口] 开始为用户 1 生成 2024年8月 的分析
[analyse定时任务] 用户 1 2024年8月 分析开始
[analyse定时任务] 用户 1 2024年8月 分析成功
```

这些日志可以帮助调试和监控分析生成过程。 