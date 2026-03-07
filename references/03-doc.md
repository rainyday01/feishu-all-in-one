# 飞书文档 (Docx) 接口参考

## 一、SDK 初始化

```typescript
import * as lark from '@larksuiteoapi/node-sdk';

const client = new lark.Client({
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});
```

## 二、文档操作 API

### 2.1 创建文档

```typescript
// POST /open-apis/docx/v1/documents
async function createDocument(
  title: string,
  userAccessToken?: string
): Promise<{ documentId: string }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.docx.document.create({
    data: {
      title,
      folder_token: undefined, // 可选：指定文件夹
    },
  }, options);
  
  return {
    documentId: response.data!.document_id,
  };
}
```

### 2.2 获取文档内容

```typescript
// GET /open-apis/docx/v1/documents/{document_id}
async function getDocument(
  documentId: string,
  userAccessToken?: string
): Promise<DocumentInfo> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.docx.document.get({
    path: { document_id: documentId },
  }, options);
  
  return {
    documentId: response.data!.document_id,
    title: response.data!.title,
    revisionId: response.data!.revision_id,
  };
}
```

### 2.3 删除文档

```typescript
// DELETE /open-apis/docx/v1/documents/{document_id}
async function deleteDocument(
  documentId: string,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.docx.document.delete({
    path: { document_id: documentId },
  }, options);
}
```

## 三、Block 操作 API

### 3.1 列出所有 Block

```typescript
// GET /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}/children
async function listBlocks(
  documentId: string,
  blockId: string = 'document', // 默认从根节点开始
  userAccessToken?: string
): Promise<Block[]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const blocks: Block[] = [];
  let pageToken: string | undefined;
  
  do {
    const response = await client.docx.block.listWithIterator({
      path: {
        document_id: documentId,
        block_id: blockId,
      },
      params: {
        page_size: 50,
        page_token: pageToken,
      },
    }, options);
    
    blocks.push(...response.data!.items);
    pageToken = response.data!.page_token;
  } while (pageToken);
  
  return blocks;
}
```

### 3.2 获取单个 Block

```typescript
// GET /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}
async function getBlock(
  documentId: string,
  blockId: string,
  userAccessToken?: string
): Promise<Block> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.docx.block.get({
    path: {
      document_id: documentId,
      block_id: blockId,
    },
  }, options);
  
  return response.data!.block;
}
```

### 3.3 插入 Block

```typescript
// POST /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}/children/batch_insert
async function insertBlock(
  documentId: string,
  parentBlockId: string,
  blocks: CreateBlockRequest[],
  index: number = 0,
  userAccessToken?: string
): Promise<Block[]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.docx.blockChildren.batchInsert({
    path: {
      document_id: documentId,
      block_id: parentBlockId,
    },
    data: {
      index,
      children: blocks.map(b => ({
        block_type: b.type,
        [b.type.toLowerCase()]: b.content,
      })),
    },
  }, options);
  
  return response.data!.children;
}
```

### 3.4 更新 Block

```typescript
// PATCH /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}
async function updateBlock(
  documentId: string,
  blockId: string,
  updates: UpdateBlockRequest,
  userAccessToken?: string
): Promise<Block> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.docx.block.patch({
    path: {
      document_id: documentId,
      block_id: blockId,
    },
    data: {
      update_text_elements: updates.textElements,
      update_block: updates.block,
    },
  }, options);
  
  return response.data!.block;
}
```

### 3.5 删除 Block

```typescript
// DELETE /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}
async function deleteBlock(
  documentId: string,
  blockId: string,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.docx.block.delete({
    path: {
      document_id: documentId,
      block_id: blockId,
    },
  }, options);
}
```

## 四、Block 类型参考

```typescript
// 常用 Block 类型
enum BlockType {
  PAGE = 'page',
  TEXT = 'text',
  HEADING1 = 'heading1',
  HEADING2 = 'heading2',
  HEADING3 = 'heading3',
  HEADING4 = 'heading4',
  HEADING5 = 'heading5',
  HEADING6 = 'heading6',
  HEADING7 = 'heading7',
  HEADING8 = 'heading8',
  HEADING9 = 'heading9',
  BULLET = 'bullet',
  ORDERED = 'ordered',
  CODE = 'code',
  QUOTE = 'quote',
  EQUATION = 'equation',
  TODO = 'todo',
  BITABLE = 'bitable',      // 表格
  CALLOUT = 'callout',
  CHAT_CARD = 'chat_card',
  DIAGRAM = 'diagram',
  DIVIDER = 'divider',
  FILE = 'file',
  GRID = 'grid',
  GRID_COLUMN = 'grid_column',
  IFRAME = 'iframe',
  IMAGE = 'image',
  ISV = 'isv',
  MINDNOTE = 'mindnote',
  SHEET = 'sheet',
  TABLE = 'table',
  TABLE_CELL = 'table_cell',
  TABLE_OF_CONTENTS = 'table_of_contents',
  VIEW = 'view',
  COMMENT = 'comment',
  LINK_PREVIEW = 'link_preview',
}
```

## 五、使用示例

### 5.1 创建带标题和段落的文档

```typescript
// 1. 创建文档
const doc = await createDocument('项目计划');

// 2. 插入标题
await insertBlock(doc.documentId, 'document', [
  {
    type: 'HEADING1',
    content: {
      elements: [{ text_run: { content: '项目概述' } }],
    },
  },
]);

// 3. 插入段落
await insertBlock(doc.documentId, 'document', [
  {
    type: 'TEXT',
    content: {
      elements: [
        { text_run: { content: '这是一个关于' } },
        { text_run: { content: 'AI 项目', text_element_style: { bold: true } } },
        { text_run: { content: '的计划文档。' } },
      ],
      style: {},
    },
  },
]);

console.log(`文档已创建: https://feishu.cn/docx/${doc.documentId}`);
```

### 5.2 读取文档内容

```typescript
// 1. 获取文档信息
const docInfo = await getDocument(documentId);

// 2. 获取所有块
const blocks = await listBlocks(documentId);

// 3. 提取文本内容
function extractText(block: Block): string {
  if (block.block_type === 'text') {
    return block.text.elements
      .map(e => e.text_run?.content || '')
      .join('');
  }
  return '';
}

const content = blocks.map(extractText).join('\n');
console.log(`文档 "${docInfo.title}" 的内容:\n${content}`);
```

### 5.3 更新文档内容

```typescript
// 找到需要更新的块
const blocks = await listBlocks(documentId);
const targetBlock = blocks.find(b => 
  extractText(b).includes('旧内容')
);

if (targetBlock) {
  // 更新块内容
  await updateBlock(documentId, targetBlock.block_id, {
    textElements: {
      elements: [
        { text_run: { content: '新内容' } },
      ],
    },
  });
}
```

## 六、错误处理

```typescript
try {
  await getDocument(documentId, userToken);
} catch (error: any) {
  switch (error.code) {
    case 230001:
      // 权限不足
      throw new Error('没有权限访问该文档，请申请授权');
    case 230002:
      // 文档不存在
      throw new Error('文档不存在或已被删除');
    case 230003:
      // Token 无效
      throw new Error('访问令牌已过期，请重新授权');
    default:
      throw error;
  }
}
```
