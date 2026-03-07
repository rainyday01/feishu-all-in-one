# 飞书全功能技能包 - 文件结构

## 目录结构

```
feishu-all-in-one/
├── SKILL.md                          # 技能主文档 (17KB)
│
├── references/                        # 参考文档
│   ├── 01-router.md                  # URL 解析与路由机制 (4.5KB)
│   ├── 02-auth.md                    # 用户权限申请机制 (12KB)
│   ├── 03-doc.md                     # 飞书文档接口 (7.6KB)
│   ├── 04-sheet.md                   # 飞书表格接口 (9.5KB)
│   └── 05-bitable.md                 # 飞书多维表格深度整合 (17KB)
│
├── scripts/                           # 工具脚本 (待实现)
│   └── (预留)
│
└── README.md                          # 本文件

```

## 技能特性总结

### ✅ 已完成

1. **技能定义文档 (SKILL.md)**
   - 完整的工具列表 (60+ 个工具)
   - 智能路由设计
   - 双 SDK 整合说明
   - 权限申请机制详解
   - 使用示例

2. **路由参考 (01-router.md)**
   - URL 解析函数
   - Token 格式识别
   - 意图分析引擎
   - SDK 选择策略

3. **权限参考 (02-auth.md)**
   - OAuth2 授权流程
   - 双通道授权实现
   - 令牌管理与缓存
   - 权限检查中间件

4. **文档接口 (03-doc.md)**
   - 文档 CRUD 操作
   - Block 操作 API
   - 完整使用示例

5. **表格接口 (04-sheet.md)**
   - 表格 CRUD 操作
   - 数据读写 API
   - 格式化与合并
   - 批量操作

6. **多维表格接口 (05-bitable.md)**
   - 双 SDK 深度整合
   - 应用/表/字段/记录/视图 完整 CRUD
   - 批量操作优化
   - 高级搜索功能

## 核心设计亮点

### 1. 智能路由

```
用户输入 → URL 解析 → 类型识别 → SDK 选择 → 权限检查 → 执行操作
```

### 2. 双 SDK 策略

| SDK | 用途 | 优势 |
|-----|------|------|
| @larksuiteoapi/node-sdk | 通用操作 | 飞书生态完整支持 |
| @lark-base-open/node-sdk | 多维表格专用 | 批量操作、高级查询 |

### 3. 双通道授权

```
通道1: LobsterAI 本地弹窗 → 浏览器授权 → 回调
通道2: 飞书聊天卡片 → 卡片按钮 → 浏览器授权 → Webhook 回调
```

### 4. 统一接口设计

```
feishu.[doc|sheet|bitable].[action](params)
```

## 下一步工作

### 待实现功能

1. **TypeScript 类型定义文件**
   - 完整的类型声明
   - API 响应类型

2. **工具脚本**
   - API 测试脚本
   - 权限验证工具

3. **错误处理**
   - 统一错误码映射
   - 自动重试机制

4. **性能优化**
   - 批量操作封装
   - 缓存策略

5. **测试用例**
   - 单元测试
   - 集成测试

## 使用方法

### LobsterAI 集成

1. 将 `feishu-all-in-one` 目录复制到 LobsterAI 的 `SKILLs` 目录
2. 在 `skills.config.json` 中启用该技能
3. 配置飞书应用凭证 (App ID / App Secret)

### 环境变量

```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
```

### 快速测试

```typescript
// 1. 解析 URL
const parsed = parseFeishuUrl('https://feishu.cn/base/xxx');
// → { type: 'bitable', token: 'xxx' }

// 2. 检查权限
const permission = await checkPermission(parsed.type, parsed.token, userId);
if (!permission.hasAccess) {
  // 3. 请求授权
  await requestUserPermission(...);
}

// 4. 执行操作
const records = await listRecords(appToken, tableId);
```

## 文档总览

| 文档 | 大小 | 内容 |
|------|------|------|
| SKILL.md | 17KB | 技能定义、工具列表、使用指南 |
| 01-router.md | 4.5KB | URL 解析、意图分析、路由决策 |
| 02-auth.md | 12KB | OAuth2 流程、双通道授权、令牌管理 |
| 03-doc.md | 7.6KB | 文档 CRUD、Block 操作、示例 |
| 04-sheet.md | 9.5KB | 表格 CRUD、数据操作、格式化 |
| 05-bitable.md | 17KB | 多维表格深度整合、批量操作 |
| **总计** | **67.6KB** | **完整的飞书技能包** |

---

*创建时间: 2026-03-07*
*版本: 1.0.0*
*作者: LobsterAI Skill Generator*
