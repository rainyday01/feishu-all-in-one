# 飞书多维表格 (Bitable) 深度整合指南

## 一、SDK 双引擎架构

多维表格操作采用**双 SDK 策略**：

```
┌─────────────────────────────────────────────────────────────┐
│                    SDK 选择策略                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  @larksuiteoapi/node-sdk (通用 SDK)                        │
│  ├── 用途: 基础 CRUD 操作、权限管理                         │
│  ├── 优势: 完整的飞书生态支持                               │
│  └── API: /open-apis/bitable/v1/*                          │
│                                                             │
│  @lark-base-open/node-sdk (专用 SDK) ⭐                    │
│  ├── 用途: 高级数据操作、批量处理、复杂查询                 │
│  ├── 优势: 更强大的数据处理能力                             │
│  └── API: Base Tables API                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 二、SDK 初始化

### 2.1 通用 SDK 初始化

```typescript
import * as lark from '@larksuiteoapi/node-sdk';

const larkClient = new lark.Client({
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});
```

### 2.2 专用 SDK 初始化

```typescript
import * as base from '@lark-base-open/node-sdk';

const baseClient = new base.Client({
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
});
```

## 三、应用管理 (App)

### 3.1 创建多维表格应用

```typescript
// 使用通用 SDK
// POST /open-apis/bitable/v1/apps
async function createBitableApp(
  name: string,
  userAccessToken?: string
): Promise<{ appToken: string }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.app.create({
    data: { name },
  }, options);
  
  return { appToken: response.data!.app!.app_token! };
}
```

### 3.2 获取应用信息

```typescript
// GET /open-apis/bitable/v1/apps/{app_token}
async function getBitableApp(
  appToken: string,
  userAccessToken?: string
): Promise<AppInfo> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.app.get({
    path: { app_token: appToken },
  }, options);
  
  return {
    appToken: response.data!.app!.app_token!,
    name: response.data!.app!.name!,
    tableCount: response.data!.app!.table_count!,
    isAdvanced: response.data!.app!.is_advanced!,
  };
}
```

### 3.3 删除应用

```typescript
// DELETE /open-apis/bitable/v1/apps/{app_token}
async function deleteBitableApp(
  appToken: string,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await larkClient.bitable.app.delete({
    path: { app_token: appToken },
  }, options);
}
```

## 四、数据表管理 (Table)

### 4.1 列出所有数据表

```typescript
// GET /open-apis/bitable/v1/apps/{app_token}/tables
async function listTables(
  appToken: string,
  userAccessToken?: string
): Promise<Table[]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.appTable.list({
    path: { app_token: appToken },
  }, options);
  
  return response.data!.items!.map(t => ({
    tableId: t.table_id!,
    name: t.name!,
    fields: t.field_count!,
    records: t.record_count!,
  }));
}
```

### 4.2 创建数据表

```typescript
// POST /open-apis/bitable/v1/apps/{app_token}/tables
async function createTable(
  appToken: string,
  name: string,
  fields: FieldDefinition[],
  userAccessToken?: string
): Promise<{ tableId: string }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.appTable.create({
    path: { app_token: appToken },
    data: {
      table: {
        name,
        default_field_name: '文本',
        default_view_name: '所有记录',
      },
    },
  }, options);
  
  return { tableId: response.data!.table_id! };
}
```

### 4.3 删除数据表

```typescript
// DELETE /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}
async function deleteTable(
  appToken: string,
  tableId: string,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await larkClient.bitable.appTable.delete({
    path: { app_token: appToken, table_id: tableId },
  }, options);
}
```

## 五、字段管理 (Field)

### 5.1 字段类型定义

```typescript
enum FieldType {
  TEXT = 1,              // 文本
  NUMBER = 2,            // 数字
  SINGLE_SELECT = 3,     // 单选
  MULTI_SELECT = 4,      // 多选
  DATE = 5,              // 日期
  CHECKBOX = 7,          // 复选框
  USER = 11,             // 人员
  PHONE = 13,            // 电话
  URL = 15,              // 超链接
  ATTACHMENT = 17,       // 附件
  SINGLE_LINK = 18,      // 单向关联
  LOOKUP = 19,           // 查找引用
  FORMULA = 20,          // 公式
  DUPLEX_LINK = 21,      // 双向关联
  LOCATION = 22,         // 地理位置
  CURRENCY = 23,         // 货币
  PROGRESS = 24,         // 进度
  RATING = 25,           // 评分
  CREATED_TIME = 1001,   // 创建时间
  MODIFIED_TIME = 1002,  // 修改时间
  CREATED_USER = 1003,   // 创建人
  MODIFIED_USER = 1004,  // 修改人
  AUTO_NUMBER = 1005,    // 自动编号
}
```

### 5.2 列出所有字段

```typescript
// GET /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields
async function listFields(
  appToken: string,
  tableId: string,
  userAccessToken?: string
): Promise<Field[]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.appTableField.list({
    path: { app_token: appToken, table_id: tableId },
  }, options);
  
  return response.data!.items!.map(f => ({
    fieldId: f.field_id!,
    name: f.field_name!,
    type: f.type!,
    property: f.property,
  }));
}
```

### 5.3 创建字段

```typescript
// POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields
async function createField(
  appToken: string,
  tableId: string,
  field: FieldDefinition,
  userAccessToken?: string
): Promise<{ fieldId: string }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.appTableField.create({
    path: { app_token: appToken, table_id: tableId },
    data: {
      field_name: field.name,
      type: field.type,
      property: field.property,
    },
  }, options);
  
  return { fieldId: response.data!.field!.field_id! };
}
```

### 5.4 批量创建字段

```typescript
// 使用专用 SDK 进行批量操作
async function batchCreateFields(
  appToken: string,
  tableId: string,
  fields: FieldDefinition[],
  userAccessToken?: string
): Promise<string[]> {
  const fieldIds: string[] = [];
  
  // 分批创建，每批最多 10 个
  for (let i = 0; i < fields.length; i += 10) {
    const batch = fields.slice(i, i + 10);
    const promises = batch.map(field => createField(appToken, tableId, field, userAccessToken));
    const results = await Promise.all(promises);
    fieldIds.push(...results.map(r => r.fieldId));
  }
  
  return fieldIds;
}
```

## 六、记录管理 (Record) ⭐ 核心

### 6.1 列出记录

```typescript
// GET /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records
async function listRecords(
  appToken: string,
  tableId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
    viewId?: string;
    fieldNames?: string[];
    filter?: string;
    sort?: Array<{ fieldName: string; order: 'ASC' | 'DESC' }>;
  },
  userAccessToken?: string
): Promise<{ records: Record[]; hasMore: boolean; pageToken?: string }> {
  const requestOptions = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.appTableRecord.list({
    path: { app_token: appToken, table_id: tableId },
    params: {
      page_size: options?.pageSize || 100,
      page_token: options?.pageToken,
      view_id: options?.viewId,
      field_names: options?.fieldNames,
      filter: options?.filter,
      sort: options?.sort?.map(s => JSON.stringify({
        field_name: s.fieldName,
        order: s.order,
      })),
    },
  }, requestOptions);
  
  return {
    records: response.data!.items!.map(r => ({
      recordId: r.record_id!,
      fields: r.fields!,
    })),
    hasMore: response.data!.has_more!,
    pageToken: response.data!.page_token,
  };
}
```

### 6.2 创建单条记录

```typescript
// POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records
async function createRecord(
  appToken: string,
  tableId: string,
  fields: Record<string, any>,
  userAccessToken?: string
): Promise<{ recordId: string }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.appTableRecord.create({
    path: { app_token: appToken, table_id: tableId },
    data: { fields },
  }, options);
  
  return { recordId: response.data!.record!.record_id! };
}
```

### 6.3 批量创建记录 ⭐ 使用专用 SDK

```typescript
// 使用专用 SDK 进行批量操作
// POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create
async function batchCreateRecords(
  appToken: string,
  tableId: string,
  records: Array<Record<string, any>>,
  userAccessToken?: string
): Promise<{ recordIds: string[] }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  // 分批处理，每批最多 500 条
  const allRecordIds: string[] = [];
  
  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500);
    
    const response = await larkClient.bitable.appTableRecord.batchCreate({
      path: { app_token: appToken, table_id: tableId },
      data: {
        records: batch.map(fields => ({ fields })),
      },
    }, options);
    
    allRecordIds.push(...response.data!.records!.map(r => r.record_id!));
  }
  
  return { recordIds: allRecordIds };
}
```

### 6.4 更新记录

```typescript
// PUT /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
async function updateRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, any>,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await larkClient.bitable.appTableRecord.update({
    path: { app_token: appToken, table_id: tableId, record_id: recordId },
    data: { fields },
  }, options);
}
```

### 6.5 批量更新记录

```typescript
// POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_update
async function batchUpdateRecords(
  appToken: string,
  tableId: string,
  updates: Array<{ recordId: string; fields: Record<string, any> }>,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  // 分批处理，每批最多 500 条
  for (let i = 0; i < updates.length; i += 500) {
    const batch = updates.slice(i, i + 500);
    
    await larkClient.bitable.appTableRecord.batchUpdate({
      path: { app_token: appToken, table_id: tableId },
      data: {
        records: batch.map(u => ({
          record_id: u.recordId,
          fields: u.fields,
        })),
      },
    }, options);
  }
}
```

### 6.6 删除记录

```typescript
// DELETE /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}
async function deleteRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await larkClient.bitable.appTableRecord.delete({
    path: { app_token: appToken, table_id: tableId, record_id: recordId },
  }, options);
}
```

### 6.7 批量删除记录

```typescript
// POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_delete
async function batchDeleteRecords(
  appToken: string,
  tableId: string,
  recordIds: string[],
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  // 分批处理，每批最多 500 条
  for (let i = 0; i < recordIds.length; i += 500) {
    const batch = recordIds.slice(i, i + 500);
    
    await larkClient.bitable.appTableRecord.batchDelete({
      path: { app_token: appToken, table_id: tableId },
      data: { records: batch },
    }, options);
  }
}
```

### 6.8 高级搜索记录

```typescript
// 使用专用 SDK 进行复杂查询
async function searchRecords(
  appToken: string,
  tableId: string,
  query: {
    filter?: {
      conjunction: 'and' | 'or';
      conditions: Array<{
        field_name: string;
        operator: string;
        value: any[];
      }>;
    };
    sort?: Array<{
      field_name: string;
      order: 'ASC' | 'DESC';
    }>;
    field_names?: string[];
    limit?: number;
  },
  userAccessToken?: string
): Promise<Record[]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const allRecords: Record[] = [];
  let pageToken: string | undefined;
  
  do {
    const response = await larkClient.bitable.appTableRecord.list({
      path: { app_token: appToken, table_id: tableId },
      params: {
        page_size: 500,
        page_token: pageToken,
        filter: query.filter ? JSON.stringify(query.filter) : undefined,
        sort: query.sort?.map(s => JSON.stringify(s)),
        field_names: query.field_names,
      },
    }, options);
    
    allRecords.push(...response.data!.items!.map(r => ({
      recordId: r.record_id!,
      fields: r.fields!,
    })));
    
    pageToken = response.data!.page_token;
    
    if (query.limit && allRecords.length >= query.limit) {
      break;
    }
  } while (pageToken);
  
  return query.limit ? allRecords.slice(0, query.limit) : allRecords;
}
```

## 七、视图管理 (View)

### 7.1 列出所有视图

```typescript
// GET /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/views
async function listViews(
  appToken: string,
  tableId: string,
  userAccessToken?: string
): Promise<View[]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await larkClient.bitable.appTableView.list({
    path: { app_token: appToken, table_id: tableId },
  }, options);
  
  return response.data!.views!.map(v => ({
    viewId: v.view_id!,
    name: v.view_name!,
    type: v.view_type!,
  }));
}
```

## 八、使用示例

### 8.1 创建完整的多维表格

```typescript
// 1. 创建应用
const app = await createBitableApp('客户管理系统', userToken);
console.log(`应用已创建: ${app.appToken}`);

// 2. 创建数据表
const table = await createTable(app.appToken, '客户列表', [], userToken);
console.log(`数据表已创建: ${table.tableId}`);

// 3. 批量创建字段
const fields = [
  { name: '客户名称', type: FieldType.TEXT },
  { name: '联系电话', type: FieldType.PHONE },
  { name: '状态', type: FieldType.SINGLE_SELECT, property: { options: [
    { name: '潜在客户', color: 0 },
    { name: '意向客户', color: 1 },
    { name: '签约客户', color: 2 },
  ]}},
  { name: '负责人', type: FieldType.USER },
  { name: '创建时间', type: FieldType.CREATED_TIME },
];
await batchCreateFields(app.appToken, table.tableId, fields, userToken);

// 4. 批量创建记录
const records = [
  { '客户名称': '张三', '联系电话': '13800138000', '状态': '潜在客户' },
  { '客户名称': '李四', '联系电话': '13900139000', '状态': '意向客户' },
];
const result = await batchCreateRecords(app.appToken, table.tableId, records, userToken);
console.log(`已创建 ${result.recordIds.length} 条记录`);

console.log(`多维表格已创建: https://feishu.cn/base/${app.appToken}`);
```

### 8.2 高级查询

```typescript
// 查询所有签约客户，按创建时间降序
const customers = await searchRecords(
  appToken,
  tableId,
  {
    filter: {
      conjunction: 'and',
      conditions: [
        {
          field_name: '状态',
          operator: 'is',
          value: ['签约客户'],
        },
      ],
    },
    sort: [
      { field_name: '创建时间', order: 'DESC' },
    ],
    field_names: ['客户名称', '联系电话', '状态', '负责人'],
    limit: 100,
  },
  userToken
);

console.log(`找到 ${customers.length} 个签约客户`);
```

### 8.3 批量更新

```typescript
// 将所有潜在客户升级为意向客户
const potentialCustomers = await searchRecords(
  appToken,
  tableId,
  {
    filter: {
      conjunction: 'and',
      conditions: [
        { field_name: '状态', operator: 'is', value: ['潜在客户'] },
      ],
    },
    field_names: ['record_id'],
  },
  userToken
);

const updates = potentialCustomers.map(r => ({
  recordId: r.recordId,
  fields: { '状态': '意向客户' },
}));

await batchUpdateRecords(appToken, tableId, updates, userToken);
console.log(`已更新 ${updates.length} 条记录`);
```

## 九、性能优化建议

1. **批量操作**: 始终使用 `batch*` 方法，避免单条操作
2. **分页处理**: 大数据量时使用分页，每页 500 条
3. **字段选择**: 只查询需要的字段，减少数据传输
4. **并发控制**: 批量操作时控制并发数，建议不超过 5 个并发
5. **缓存元数据**: 字段列表等元数据应缓存，避免重复查询

## 十、错误处理

```typescript
try {
  await listRecords(appToken, tableId, {}, userToken);
} catch (error: any) {
  switch (error.code) {
    case 1250003:
      throw new Error('多维表格不存在或无权限');
    case 1250004:
      throw new Error('数据表不存在');
    case 1250005:
      throw new Error('字段不存在');
    case 1250006:
      throw new Error('记录不存在');
    case 1250007:
      throw new Error('视图不存在');
    case 1250008:
      throw new Error('权限不足，请申请授权');
    case 1250403:
      throw new Error('请求频率过高，请稍后重试');
    default:
      throw error;
  }
}
```
