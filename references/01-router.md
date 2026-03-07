# 飞书 URL 解析与路由机制

## 一、URL Token 格式解析

### 1.1 文档类型识别

| 文档类型 | Token 前缀 | URL 模式 | 示例 |
|---------|-----------|---------|------|
| 旧版文档 | `doccn` / `doxcn` | `feishu.cn/docx/{token}` | `feishu.cn/docx/doccnxxxx` |
| 新版文档 | `doxcn` | `feishu.cn/docx/{token}` | `feishu.cn/docx/doxcnyyyy` |
| 表格 | `shtcn` / `shtxn` | `feishu.cn/sheets/{token}` | `feishu.cn/sheets/shtcnxxxx` |
| 多维表格 | `bascn` / `basxn` | `feishu.cn/base/{token}` | `feishu.cn/base/bascnxxxx` |

### 1.2 Token 解析函数

```typescript
// src/router/parser.ts

export interface ParsedUrl {
  type: 'doc' | 'sheet' | 'bitable';
  token: string;
  rawUrl: string;
  tableId?: string;  // 多维表格可能包含 tableId
  viewId?: string;   // 视图 ID
}

/**
 * 解析飞书 URL，自动识别文档类型
 */
export function parseFeishuUrl(url: string): ParsedUrl {
  const cleanUrl = url.split('?')[0];
  
  // 文档
  const docMatch = cleanUrl.match(/feishu\.cn\/docx\/([a-zA-Z0-9]+)/);
  if (docMatch) {
    return { type: 'doc', token: docMatch[1], rawUrl: url };
  }
  
  // 表格
  const sheetMatch = cleanUrl.match(/feishu\.cn\/sheets\/([a-zA-Z0-9]+)/);
  if (sheetMatch) {
    return { type: 'sheet', token: sheetMatch[1], rawUrl: url };
  }
  
  // 多维表格
  const bitableMatch = cleanUrl.match(/feishu\.cn\/base\/([a-zA-Z0-9]+)/);
  if (bitableMatch) {
    const parsed: ParsedUrl = {
      type: 'bitable',
      token: bitableMatch[1],
      rawUrl: url,
    };
    
    const tableMatch = url.match(/[?&]table=([a-zA-Z0-9]+)/);
    if (tableMatch) parsed.tableId = tableMatch[1];
    
    const viewMatch = url.match(/[?&]view=([a-zA-Z0-9]+)/);
    if (viewMatch) parsed.viewId = viewMatch[1];
    
    return parsed;
  }
  
  throw new Error(`无法识别的飞书 URL 格式: ${url}`);
}

/**
 * 从 Token 前缀判断类型
 */
export function getTypeFromToken(token: string): 'doc' | 'sheet' | 'bitable' {
  if (token.startsWith('doc') || token.startsWith('dox')) return 'doc';
  if (token.startsWith('sht')) return 'sheet';
  if (token.startsWith('bas')) return 'bitable';
  throw new Error(`无法识别的 Token 格式: ${token}`);
}
```

## 二、用户意图分析

```typescript
export type ActionType = 
  | 'create' | 'read' | 'update' | 'delete' 
  | 'list' | 'search' | 'share' | 'permission' 
  | 'batch' | 'export' | 'import';

export interface RequestIntent {
  action: ActionType;
  targetType: 'doc' | 'sheet' | 'bitable';
  targetSpec?: string;
  filter?: string;
  sort?: string;
  fields?: string[];
}

/**
 * 分析用户请求，识别意图
 */
export function analyzeRequest(userText: string, parsedUrl?: ParsedUrl): RequestIntent {
  const text = userText.toLowerCase();
  
  if (parsedUrl) {
    return {
      action: determineAction(text),
      targetType: parsedUrl.type,
      targetSpec: parsedUrl.tableId,
    };
  }
  
  return {
    action: determineAction(text),
    targetType: inferTargetType(text),
    ...extractDetails(text),
  };
}

function inferTargetType(text: string): 'doc' | 'sheet' | 'bitable' {
  const bitableKeywords = ['多维表格', '数据库', 'base', 'bitable', '数据表'];
  if (bitableKeywords.some(kw => text.includes(kw))) return 'bitable';
  
  const sheetKeywords = ['表格', 'sheet', '电子表格', '单元格'];
  if (sheetKeywords.some(kw => text.includes(kw))) return 'sheet';
  
  return 'doc';
}

function determineAction(text: string): ActionType {
  const patterns: Record<ActionType, RegExp[]> = {
    create: [/创建/i, /新建/i, /新增/i, /添加/i, /生成/i, /写一个/i, /做一个/i],
    read: [/读取/i, /查看/i, /看(一下)?/i, /打开/i, /获取/i, /分析/i, /总结/i],
    update: [/更新/i, /修改/i, /编辑/i, /改/i, /添加内容/i, /补充/i],
    delete: [/删除/i, /移除/i, /清空/i, /去掉/i],
    list: [/列出/i, /展示/i, /显示/i, /获取列表/i],
    search: [/搜索/i, /查找/i, /找/i, /筛选/i, /过滤/i, /查询/i],
    share: [/分享/i, /转发/i, /共享/i],
    permission: [/权限/i, /授权/i, /设置访问/i],
    batch: [/批量/i],
    export: [/导出/i, /下载/i],
    import: [/导入/i, /上传/i],
  };
  
  for (const [action, pats] of Object.entries(patterns)) {
    if (pats.some(p => p.test(text))) return action as ActionType;
  }
  
  return 'read';
}
```

## 三、路由决策流程

```
用户请求 → URL解析/意图分析 → 确定文档类型 → 权限检查 → 执行操作
                ↓
         ┌──────┼──────┐
         ↓      ↓      ↓
       doc   sheet  bitable
```

## 四、SDK 选择策略

```typescript
export function selectSDK(type: 'doc' | 'sheet' | 'bitable') {
  // 多维表格优先使用 @lark-base-open/node-sdk
  if (type === 'bitable') {
    return {
      sdk: '@lark-base-open/node-sdk',
      reason: '多维表格专用SDK，提供更高级的批量操作能力',
    };
  }
  
  // 文档和表格使用通用 SDK
  return {
    sdk: '@larksuiteoapi/node-sdk',
    reason: '通用SDK，支持文档和表格的所有操作',
  };
}
```
