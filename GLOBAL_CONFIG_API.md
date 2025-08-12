# 全局配置 API 文档

## 概述
全局配置表用于控制系统中各个模块的开关状态，不按用户维度区分，主要用于管理员控制功能模块的开启和关闭。

## 数据库表结构
表名：`global_config`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| key | VARCHAR(100) | 配置键名，唯一 |
| value | VARCHAR(10) | 配置值 |
| description | VARCHAR(255) | 配置描述 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

## API 接口

### 1. 获取所有全局配置（键值对格式）
```
GET /global-config/all
```

**响应示例：**
```json
{
  "status": 0,
  "data": {
    "show_payment_module": true,
    "show_analytics_module": false
  },
  "message": "success"
}
```

### 2. 获取所有全局配置（完整信息，用于管理）
```
GET /global-config/admin/all
```

**响应示例：**
```json
{
  "status": 0,
  "data": [
    {
      "id": 1,
      "key": "show_payment_module",
      "value": "true",
      "description": "是否展示支付模块",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "success"
}
```

### 3. 根据键名获取配置
```
GET /global-config/:key
```

**参数：**
- `key`: 配置键名

**响应示例：**
```json
{
  "status": 0,
  "data": {
    "show_payment_module": true
  },
  "message": "success"
}
```

### 4. 创建新的全局配置
```
POST /global-config
```

**请求体：**
```json
{
  "key": "show_analytics_module",
  "value": "false",
  "description": "是否展示分析模块"
}
```

**响应示例：**
```json
{
  "status": 0,
  "data": {
    "id": 2,
    "key": "show_analytics_module",
    "value": "false",
    "description": "是否展示分析模块",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "success"
}
```

### 5. 更新全局配置
```
PUT /global-config/:key
```

**参数：**
- `key`: 配置键名

**请求体：**
```json
{
  "value": "false",
  "description": "关闭支付模块"
}
```

**响应示例：**
```json
{
  "status": 0,
  "data": {
    "show_payment_module": false
  },
  "message": "success"
}
```

### 6. 删除全局配置
```
DELETE /global-config/:key
```

**参数：**
- `key`: 配置键名

**响应示例：**
```json
{
  "status": 0,
  "message": "删除成功"
}
```

### 7. 获取支付模块显示状态
```
GET /global-config/payment/status
```

**响应示例：**
```json
{
  "status": 0,
  "data": {
    "show_payment_module": true
  },
  "message": "success"
}
```

## 默认配置
系统初始化时会自动创建以下默认配置：

| 键名 | 默认值 | 描述 |
|------|--------|------|
| show_payment_module | true | 是否展示支付模块 |

## 使用示例

### 前端调用示例
```javascript
// 获取所有配置
const response = await fetch('/global-config/all');
const data = await response.json();
const configs = data.data; // {show_payment_module: true, show_analytics_module: false}

// 检查支付模块状态
if (configs.show_payment_module) {
  showPaymentComponent();
} else {
  hidePaymentComponent();
}

// 或者获取特定配置
const paymentResponse = await fetch('/global-config/payment/status');
const paymentData = await paymentResponse.json();
const showPayment = paymentData.data.show_payment_module;
```

### 管理员操作示例
```javascript
// 关闭支付模块
await fetch('/global-config/show_payment_module', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    value: 'false',
    description: '临时关闭支付功能'
  })
});
```

## 注意事项
1. 配置值使用字符串类型，布尔值用 "true" 或 "false" 表示
2. 键名必须唯一，创建重复键名会返回错误
3. 删除配置后无法恢复，请谨慎操作
4. 建议在更新配置前先备份重要配置
5. 获取所有配置时返回的是键值对格式，便于前端直接使用 