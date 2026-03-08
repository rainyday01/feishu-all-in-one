# 飞书全功能技能包 (Feishu All-in-One)

[![GitHub version](https://img.shields.io/badge/version-v0.0.3-blue)](https://github.com/rainyday01/feishu-all-in-one/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

飞书全功能集成技能 - 支持文档、表格、多维表格的完整操作，基于 `@larksuiteoapi/node-sdk` 和 `@lark-base-open/node-sdk`，包含智能路由和权限申请机制。

---

## 📁 目录结构

```
feishu-all-in-one/
├── SKILL.md                          # 技能主文档 (17KB)
├── README.md                         # 本文件
├── package.json                      # 项目配置
│
├── references/                       # 参考文档
│   ├── 01-router.md                  # URL 解析与路由机制
│   ├── 02-auth.md                    # 用户权限申请机制
│   ├── 03-doc.md                     # 飞书文档接口
│   ├── 04-sheet.md                   # 飞书表格接口
│   └── 05-bitable.md                 # 飞书多维表格深度整合
│
├── scripts/                          # 工具脚本
│   └── oauth-authorize.js            # OAuth 授权脚本 ✅ 已实现
│
└── src/                              # 源代码
    ├── auth/index.js                 # 认证模块 ✅ Token管理、权限检查
    ├── router/index.js               # 路由模块 ✅ URL解析、Wiki探测
    ├── doc/index.js                  # 文档模块 ✅ 文档CRUD、Block操作
    ├── sheet/index.js                # 表格模块 ✅ 表格CRUD、数据操作
    └── bitable/index.js              # 多维表格模块 ✅ 完整CRUD
```

---

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/rainyday01/feishu-all-in-one.git

# 进入项目目录
cd feishu-all-in-one

# 安装依赖
npm install
```

### 环境配置

在项目根目录创建 `.env` 文件或设置环境变量：

```bash
# 飞书应用配置（从 LobsterAI 配置或飞书开放平台获取）
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxx

# 可选：授权回调地址
FEISHU_REDIRECT_URI=https://your-domain.com/auth/callback
```

> **关于 app_id 和 app_secret 的获取：**
> - **方式一（推荐）**: 从 LobsterAI 配置中获取（`config.feishu.appId` 和 `config.feishu.appSecret`）
> - **方式二**: 从飞书开放平台创建应用获取：https://open.feishu.cn/app
> - **方式三**: 通过环境变量 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 传入

---

## 📖 使用指南

### 1. OAuth 授权脚本使用

```bash
# 生成授权 URL
node scripts/oauth-authorize.js --action=authorize \
  --app-id=cli_xxx \
  --app-secret=xxx \
  --redirect-uri=https://your-domain.com/callback

# 使用授权码换取 Token
node scripts/oauth-authorize.js --action=token \
  --app-id=cli_xxx \
  --app-secret=xxx \
  --code=xxxxxxxx

# 刷新 Token
node scripts/oauth-authorize.js --action=refresh \
  --app-id=cli_xxx \
  --app-secret=xxx \
  --refresh-token=xxxxxxxx
```

### 2. 在代码中使用各模块

```javascript
// 认证模块
const auth = require('./src/auth');

// 生成授权 URL
const authUrl = auth.generateAuthorizeUrl({
  appId: process.env.FEISHU_APP_ID,
  redirectUri: 'https://your-domain.com/callback'
});

// 获取有效 Token（自动处理缓存和刷新）
const tokenResult = await auth.getValidToken({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  userId: 'user_xxx'
});
```

```javascript
// 路由模块 - URL 解析
const router = require('./src/router');

// 解析飞书 URL
const parsed = router.parseUrl('https://feishu.cn/docx/xxx');
// 结果: { success: true, type: 'doc', token: 'xxx', source: 'url' }

// 分析用户请求意图
const intent = router.analyzeRequest('帮我读取这个文档');
// 结果: { action: 'read', explicitType: null, rawText: '...' }
```

```javascript
// 文档模块
const doc = require('./src/doc');

// 创建文档
const createResult = await doc.create({
  accessToken: tokenResult.accessToken,
  title: '我的文档'
});

// 获取文档内容
const docContent = await doc.get({
  accessToken: tokenResult.accessToken,
  documentId: 'doc_xxx'
});

// 列出文档中的所有块
const blocks = await doc.listBlocks({
  accessToken: tokenResult.accessToken,
  documentId: 'doc_xxx'
});
```

```javascript
// 表格模块
const sheet = require('./src/sheet');

// 创建表格
const sheetResult = await sheet.create({
  accessToken: tokenResult.accessToken,
  title: '我的表格'
});

// 读取单元格数据
const values = await sheet.getValues({
  accessToken: tokenResult.accessToken,
  spreadsheetToken: 'sheet_xxx',
  range: 'Sheet1!A1:D10'
});

// 写入数据
await sheet.setValues({
  accessToken: tokenResult.accessToken,
  spreadsheetToken: 'sheet_xxx',
  range: 'Sheet1!A1:B2',
  values: [['Name', 'Age'], ['Alice', 25]]
});
```

```javascript
// 多维表格模块
const bitable = require('./src/bitable');

// 创建多维表格应用
const appResult = await bitable.createApp({
  accessToken: tokenResult.accessToken,
  name: '我的多维表格'
});

// 列出所有数据表
const tables = await bitable.listTables({
  accessToken: tokenResult.accessToken,
  appToken: 'app_xxx'
});

// 创建记录
const record = await bitable.createRecord({
  accessToken: tokenResult.accessToken,
  appToken: 'app_xxx',
  tableId: 'tbl_xxx',
  fields: {
    '姓名': '张三',
    '年龄': 25
  }
});

// 批量创建记录
const batchResult = await bitable.batchCreateRecords({
  accessToken: tokenResult.accessToken,
  appToken: 'app_xxx',
  tableId: 'tbl_xxx',
  records: [
    { '姓名': '李四', '年龄': 30 },
    { '姓名': '王五', '年龄': 35 }
  ]
});
```

---

## 🔧 API 参考

详细 API 文档请参考 `references/` 目录下的文档：

- `01-router.md` - URL 解析与路由机制
- `02-auth.md` - 用户权限申请机制
- `03-doc.md` - 飞书文档接口
- `04-sheet.md` - 飞书表格接口
- `05-bitable.md` - 飞书多维表格深度整合

---

## 📦 发布版本

### v0.0.3 (当前版本)

**新增功能：**
- ✅ 实现完整的 JavaScript 代码模块（约 1900 行）
  - `scripts/oauth-authorize.js` - OAuth 授权脚本
  - `src/auth/index.js` - 认证模块（Token 管理、权限检查）
  - `src/router/index.js` - 路由模块（URL 解析、Wiki 探测）
  - `src/doc/index.js` - 文档模块（文档 CRUD、Block 操作）
  - `src/sheet/index.js` - 表格模块（表格 CRUD、数据操作）
  - `src/bitable/index.js` - 多维表格模块（完整 CRUD、批量操作）
- ✅ 更新 README.md 完整使用文档
- ✅ 支持从环境变量读取飞书应用配置

### v0.0.2

**功能优化：**
- 优化 Wiki 链接识别流程
- 完善权限预检查机制
- 更新参考文档

### v0.0.1

**初始版本：**
- 项目基础结构搭建
- 完整 SKILL.md 定义文档
- 5 份详细参考文档
- 预留代码脚本目录结构

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE) © 2026 rainyday01

---

**GitHub 仓库：** [https://github.com/rainyday01/feishu-all-in-one](https://github.com/rainyday01/feishu-all-in-one)

**下载地址：** [v0.0.3 Release](https://github.com/rainyday01/feishu-all-in-one/releases/tag/v0.0.3)
