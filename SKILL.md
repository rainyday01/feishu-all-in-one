---
name: feishu-all-in-one
description: "飞书全功能集成技能 - 支持文档、表格、多维表格的完整操作，基于 @larksuiteoapi/node-sdk 和 @lark-base-open/node-sdk，包含智能路由和权限申请机制"
license: MIT
official: true
---

# Feishu All-in-One - LobsterAI 技能

## 一、技能概述

本技能提供对飞书三大核心产品的完整 API 访问能力：

| 产品 | 类型标识 | Token 前缀 | SDK 优先级 |
|------|---------|-----------|-----------|
| 飞书文档 | `doc` | `doxc` / `doxn` | @larksuiteoapi/node-sdk |
| 飞书表格 | `sheet` | `shtc` / `shtn` | @larksuiteoapi/node-sdk |
| 飞书多维表格 | `bitable` | `basc` / `basn` | @lark-base-open/node-sdk (深度整合) |

## 二、核心设计原则

### 2.1 智能路由引擎

```
用户请求 → URL/Token 解析 → 类型识别 → 权限检查 → 执行操作
                              ↓
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
                 文档路由   表格路由   多维表路由
```

### 2.2 权限申请机制

```
┌─────────────────────────────────────────────────────────┐
│                   权限申请双通道                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  通道1: LobsterAI 本地弹窗                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │  机器人检测无权限                                     │
│  │       ↓                                              │
│  │  LobsterAI 弹出本地授权对话框                         │
│  │       ↓                                              │
│  │  用户点击"授权访问" → 跳转飞书授权页面                 │
│  │       ↓                                              │
│  │  用户在飞书确认授权 → 回调通知 LobsterAI               │
│  │       ↓                                              │
│  │  机器人获得用户代理权限 (User Access Token)            │
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  通道2: 飞书聊天卡片授权                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │  机器人检测无权限                                     │
│  │       ↓                                              │
│  │  发送交互式授权卡片到飞书聊天                          │
│  │       ↓                                              │
│  │  用户点击卡片按钮 → 打开授权确认页面                    │
│  │       ↓                                              │
│  │  用户在飞书确认授权 → 机器人通过 webhook 收到回调        │
│  │       ↓                                              │
│  │  机器人获得用户代理权限                                │
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 三、工具列表

### 3.1 路由与权限管理 (优先级最高)

| 工具名 | 功能 |
|-------|------|
| `feishu_router.parseUrl` | 解析飞书 URL，自动识别文档类型 |
| `feishu_router.analyzeRequest` | 分析用户请求意图，确定操作类型 |
| `feishu_auth.requestUserPermission` | 请求用户授权（双通道） |
| `feishu_auth.checkAndRefreshToken` | 检查并刷新访问令牌 |
| `feishu_auth.getUserAuthorizationList` | 获取用户已授权文档列表 |

### 3.2 飞书文档 (Docx) 工具

**基础操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_doc.create` | 创建新文档 |
| `feishu_doc.get` | 获取文档内容和元数据 |
| `feishu_doc.delete` | 删除文档 |
| `feishu_doc.duplicate` | 复制文档 |

**内容操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_doc.listBlocks` | 列出文档中所有块 |
| `feishu_doc.getBlock` | 获取单个块内容 |
| `feishu_doc.insertBlock` | 插入新块 |
| `feishu_doc.updateBlock` | 更新块内容 |
| `feishu_doc.deleteBlock` | 删除块 |
| `feishu_doc.batchUpdateBlocks` | 批量更新块 |

**富文本操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_doc.createTable` | 创建表格 |
| `feishu_doc.insertTableRow` | 插入表格行 |
| `feishu_doc.insertTableColumn` | 插入表格列 |
| `feishu_doc.deleteTableRows` | 删除表格行 |
| `feishu_doc.deleteTableColumns` | 删除表格列 |

**权限管理**
| 工具名 | 功能 |
|-------|------|
| `feishu_doc.share` | 分享文档 |
| `feishu_doc.setPermission` | 设置权限 |
| `feishu_doc.getPermission` | 获取权限列表 |
| `feishu_doc.revokePermission` | 撤销权限 |

### 3.3 飞书表格 (Sheet) 工具

**基础操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_sheet.create` | 创建新表格 |
| `feishu_sheet.get` | 获取表格信息 |
| `feishu_sheet.delete` | 删除表格 |
| `feishu_sheet.copy` | 复制表格 |

**数据操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_sheet.getValues` | 获取单元格范围数据 |
| `feishu_sheet.setValues` | 设置单元格范围数据 |
| `feishu_sheet.appendRows` | 追加行数据 |
| `feishu_sheet.insertRows` | 插入行 |
| `feishu_sheet.insertColumns` | 插入列 |
| `feishu_sheet.deleteRows` | 删除行 |
| `feishu_sheet.deleteColumns` | 删除列 |
| `feishu_sheet.batchUpdate` | 批量更新多个范围 |

**工作表管理**
| 工具名 | 功能 |
|-------|------|
| `feishu_sheet.getSheetList` | 获取所有工作表 |
| `feishu_sheet.addSheet` | 添加工作表 |
| `feishu_sheet.deleteSheet` | 删除工作表 |
| `feishu_sheet.renameSheet` | 重命名工作表 |

**高级功能**
| 工具名 | 功能 |
|-------|------|
| `feishu_sheet.mergeCells` | 合并单元格 |
| `feishu_sheet.unmergeCells` | 取消合并 |
| `feishu_sheet.findAndReplace` | 查找替换 |
| `feishu_sheet.setDataValidation` | 设置数据验证 |

### 3.4 飞书多维表格 (Bitable) 工具 ⭐ 深度整合

**应用管理**
| 工具名 | 功能 |
|-------|------|
| `feishu_bitable.createApp` | 创建多维表格应用 |
| `feishu_bitable.getApp` | 获取应用信息 |
| `feishu_bitable.updateApp` | 更新应用名称 |
| `feishu_bitable.deleteApp` | 删除应用 |
| `feishu_bitable.listApps` | 列出应用列表 |
| `feishu_bitable.getAppRoleMembers` | 获取应用角色成员 |

**数据表操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_bitable.listTables` | 列出所有数据表 |
| `feishu_bitable.createTable` | 创建数据表 |
| `feishu_bitable.getTableMeta` | 获取数据表元数据 |
| `feishu_bitable.updateTable` | 更新数据表 |
| `feishu_bitable.deleteTable` | 删除数据表 |

**字段操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_bitable.listFields` | 列出所有字段 |
| `feishu_bitable.createField` | 创建字段 |
| `feishu_bitable.getField` | 获取字段详情 |
| `feishu_bitable.updateField` | 更新字段配置 |
| `feishu_bitable.deleteField` | 删除字段 |
| `feishu_bitable.batchCreateFields` | 批量创建字段 |

**记录操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_bitable.listRecords` | 列出记录（支持分页、过滤、排序） |
| `feishu_bitable.getRecord` | 获取单条记录 |
| `feishu_bitable.createRecord` | 创建单条记录 |
| `feishu_bitable.updateRecord` | 更新单条记录 |
| `feishu_bitable.deleteRecord` | 删除单条记录 |
| `feishu_bitable.batchCreateRecords` | 批量创建记录 |
| `feishu_bitable.batchUpdateRecords` | 批量更新记录 |
| `feishu_bitable.batchDeleteRecords` | 批量删除记录 |
| `feishu_bitable.searchRecords` | 搜索记录 |

**视图操作**
| 工具名 | 功能 |
|-------|------|
| `feishu_bitable.listViews` | 列出所有视图 |
| `feishu_bitable.getView` | 获取视图数据 |
| `feishu_bitable.createView` | 创建视图 |
| `feishu_bitable.deleteView` | 删除视图 |

**协作与权限**
| 工具名 | 功能 |
|-------|------|
| `feishu_bitable.addCollaborator` | 添加协作者 |
| `feishu_bitable.removeCollaborator` | 移除协作者 |
| `feishu_bitable.getCollaborators` | 获取协作者列表 |
| `feishu_bitable.setPermission` | 设置权限 |

## 四、SDK 整合说明

### 4.1 @larksuiteoapi/node-sdk 适用范围

用于飞书通用 API，包括：
- 文档 (Docx)
- 表格 (Sheets)
- 消息 (IM)
- 用户 (Contact)
- 审批 (Approval)

```typescript
import * as lark from '@larksuiteoapi/node-sdk';

const client = new lark.Client({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});
```

### 4.2 @lark-base-open/node-sdk 适用范围

**仅用于飞书多维表格**，提供更高级的操作能力：

```typescript
import * as base from '@lark-base-open/node-sdk';

// 初始化
const client = new base.Client({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
});

// 批量操作优化
await client.batchUpdate({
  appToken: 'xxx',
  tableId: 'xxx',
  records: [...],
});
```

### 4.3 SDK 选择策略

```
┌────────────────────────────────────────────────────────────┐
│                    SDK 选择决策树                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  操作类型 → 多维表格?                                       │
│              ├── 是 → 使用 @lark-base-open/node-sdk        │
│              │                                              │
│              └── 否 → 使用 @larksuiteoapi/node-sdk         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 五、用户权限获取详解

### 5.1 飞书权限模型

```
┌─────────────────────────────────────────────────────────────┐
│                    飞书权限层级                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  应用权限 (App Permission)                                  │
│  ├── tenant_access_token: 应用级别的访问令牌                 │
│  └── user_access_token: 用户代理访问令牌 ⭐ 本技能重点        │
│                                                             │
│  文档权限 (Document Permission)                             │
│  ├── viewer: 只读                                           │
│  ├── editor: 可编辑                                         │
│  └── owner: 所有者                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 User Access Token 获取流程

```
┌─────────────────────────────────────────────────────────────┐
│             步骤1: OAuth2 授权码模式流程                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 机器人发起授权请求                                       │
│     POST /open-apis/authen/v1/oauth/authorize              │
│     返回: auth_code (临时授权码)                             │
│                                                             │
│  2. 交换访问令牌                                             │
│     POST /open-apis/authen/v1/oauth/access_token           │
│     返回: user_access_token, refresh_token                  │
│                                                             │
│  3. 使用访问令牌调用 API                                     │
│     Header: Authorization: Bearer {user_access_token}       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 授权参数配置

```typescript
const authConfig = {
  // 授权范围
  scope: 'bitable:read bitable:write docx:read docx:write sheet:read sheet:write',
  
  // 授权类型
  responseType: 'code',
  
  // 回调配置
  redirectUri: 'lobsterai://auth/callback',
  
  // 状态参数 (防止 CSRF)
  state: generateRandomState(),
};
```

### 5.4 本地弹窗授权流程

```
┌─────────────────────────────────────────────────────────────┐
│                    本地授权交互序列                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 用户请求访问文档                                         │
│     "帮我读取这个文档: https://..."                          │
│                                                             │
│  2. 机器人检查权限                                           │
│     feishu_auth.checkPermission(docToken, docType)          │
│                                                             │
│  3. 权限不足 → 触发授权流程                                  │
│     → 发送授权请求到 LobsterAI 主进程                        │
│     → LobsterAI 显示本地授权对话框                           │
│                                                             │
│  4. 对话框内容示例:                                          │
│     ┌─────────────────────────────────────┐                 │
│     │  需要授权访问文档                    │                 │
│     │                                     │                 │
│     │  文档: 项目计划.docx                 │                 │
│     │  操作: 读取内容                      │                 │
│     │                                     │                 │
│     │  [申请授权]  [取消]                  │                 │
│     └─────────────────────────────────────┘                 │
│                                                             │
│  5. 用户点击"申请授权"                                       │
│     → 生成授权链接:                                          │
│     https://open.feishu.cn/auth/...?                        │
│       app_id=xxx&                                           │
│       redirect_uri=lobsterai://auth&                        │
│       state=xxx                                              │
│                                                             │
│  6. 用户在浏览器完成飞书授权                                  │
│     → 飞书跳转回 LobsterAI                                  │
│     → LobsterAI 接收回调，存储 token                         │
│                                                             │
│  7. 机器人使用 user_access_token 执行原请求                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 飞书聊天卡片授权流程

```
┌─────────────────────────────────────────────────────────────┐
│                    飞书卡片授权交互序列                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 机器人检测无权限                                         │
│                                                             │
│  2. 发送交互式授权卡片                                        │
│     POST /open-apis/im/v1/messages/{id}/actions             │
│                                                             │
│  3. 卡片内容示例:                                            │
│     ┌─────────────────────────────────────┐                 │
│     │  🔒 需要授权访问                    │                 │
│     │  ─────────────────────────────      │                 │
│     │  文档: 项目计划.docx                 │                 │
│     │  需要读取权限                       │                 │
│     │                                     │                 │
│     │  [授权访问]  [暂时不用]             │                 │
│     └─────────────────────────────────────┘                 │
│                                                             │
│  4. 用户点击"授权访问"按钮                                   │
│     → 飞书打开授权页面                                       │
│                                                             │
│  5. 用户确认授权                                             │
│     → 飞书发送 webhook 回调                                  │
│                                                             │
│  6. 机器人通过 webhook 收到授权通知                          │
│                                                             │
│  7. 机器人执行原请求并回复结果                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.6 权限缓存与刷新

```typescript
interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // 过期时间戳
  scope: string;
}

async function getValidToken(userId: string): Promise<string> {
  const cached = tokenCache.get(userId);
  
  // 检查是否过期 (提前 5 分钟刷新)
  if (cached && cached.expiresAt - 300_000 > Date.now()) {
    return cached.accessToken;
  }
  
  // 刷新 token
  const newToken = await refreshAccessToken(cached.refreshToken);
  tokenCache.set(userId, newToken);
  
  return newToken.accessToken;
}
```

## 六、使用示例

### 6.1 智能路由示例

```typescript
// 用户请求
const userRequest = "帮我分析这个文档 https://feishu.cn/docx/xxx";

// 1. 解析 URL
const parsed = feishu_router.parseUrl("https://feishu.cn/docx/xxx");
// → { type: 'doc', token: 'xxx', ... }

// 2. 分析请求意图
const intent = feishu_router.analyzeRequest("帮我分析这个文档");
// → { action: 'read', type: 'doc' }

// 3. 检查权限
const permission = await feishu_auth.checkAndRefreshToken({
  docType: 'doc',
  docToken: 'xxx',
});
if (!permission.hasAccess) {
  // 4. 请求授权
  await feishu_auth.requestUserPermission({
    docType: 'doc',
    docToken: 'xxx',
    permissions: ['read'],
  });
}

// 5. 执行操作
const content = await feishu_doc.get({ docToken: 'xxx' });
```

### 6.2 多维表格深度操作示例

```typescript
// 批量创建记录
await feishu_bitable.batchCreateRecords({
  appToken: 'app_token',
  tableId: 'table_id',
  records: [
    { fields: { "姓名": "张三", "年龄": 25 } },
    { fields: { "姓名": "李四", "年龄": 30 } },
  ],
});

// 带过滤条件的查询
await feishu_bitable.listRecords({
  appToken: 'app_token',
  tableId: 'table_id',
  filter: {
    conjunction: 'and',
    conditions: [
      { fieldName: '状态', operator: 'is', value: '已完成' },
    ],
  },
  sort: [
    { fieldName: '创建时间', order: 'desc' },
  ],
  pageSize: 100,
});
```

## 七、最佳实践

### 7.1 错误处理

```typescript
// 统一错误处理
try {
  await feishu_doc.get({ docToken: 'xxx' });
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    // 触发授权流程
    await feishu_auth.requestUserPermission({...});
  } else if (error.code === 'INVALID_TOKEN') {
    // 刷新 token
    await feishu_auth.checkAndRefreshToken({...});
  } else {
    // 其他错误
    throw error;
  }
}
```

### 7.2 性能优化

- **批量操作优先**: 使用 `batchCreateRecords` 等批量 API
- **分页查询**: 大数据量时使用分页 (`pageSize`, `pageToken`)
- **缓存机制**: 对频繁访问的元数据进行缓存

## 八、配置要求

### 8.1 飞书应用权限配置

在飞书开放平台需要开启以下权限：

| 权限名称 | API 范围 | 说明 |
|---------|---------|------|
| 多维表格读写 | `bitable:read`, `bitable:write` | 多维表格操作 |
| 文档读写 | `docx:read`, `docx:write` | 文档操作 |
| 表格读写 | `sheets:read`, `sheets:write` | 表格操作 |
| 用户信息 | `contact:user.base:readonly` | 获取用户信息 |

### 8.2 环境变量

```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
# 可选: 用于本地回调
REDIRECT_URI=lobsterai://auth/callback
```

## 九、常见问题

**Q: 为什么需要用户权限？**
A: 飞书应用默认只能访问用户明确授权的文档。机器人无法自动访问所有文档。

**Q: 授权会过期吗？**
A: `user_access_token` 默认有效期 2 小时，需要 `refresh_token` 刷新。

**Q: 如何撤销授权？**
A: 用户可以在飞书设置中撤销，或使用 `feishu_auth.revokePermission` API。

---

*本技能基于 @larksuiteoapi/node-sdk 和 @lark-base-open/node-sdk 构建*
*版本: 1.0.0*
*文档更新时间: 2026-03-07*