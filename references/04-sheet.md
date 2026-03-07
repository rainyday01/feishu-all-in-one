# 飞书表格 (Sheet) 接口参考

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

## 二、表格操作 API

### 2.1 创建表格

```typescript
// POST /open-apis/sheets/v3/spreadsheets
async function createSpreadsheet(
  title: string,
  folderToken?: string,
  userAccessToken?: string
): Promise<{ spreadsheetToken: string }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.sheets.spreadsheet.create({
    data: {
      title,
      folder_token: folderToken,
    },
  }, options);
  
  return {
    spreadsheetToken: response.data!.spreadsheet!.spreadsheet_token!,
  };
}
```

### 2.2 获取表格信息

```typescript
// GET /open-apis/sheets/v3/spreadsheets/{spreadsheet_token}
async function getSpreadsheet(
  spreadsheetToken: string,
  userAccessToken?: string
): Promise<SpreadsheetInfo> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.sheets.spreadsheet.get({
    path: { spreadsheet_token: spreadsheetToken },
  }, options);
  
  return {
    spreadsheetToken: response.data!.spreadsheet!.spreadsheet_token!,
    title: response.data!.spreadsheet!.title!,
    sheets: response.data!.spreadsheet!.sheets!.map(s => ({
      sheetId: s.sheet_id!,
      title: s.title!,
      index: s.index!,
      rowCount: s.row_count!,
      columnCount: s.column_count!,
    })),
  };
}
```

### 2.3 获取工作表列表

```typescript
// GET /open-apis/sheets/v3/spreadsheets/{spreadsheet_token}/sheets/query
async function listSheets(
  spreadsheetToken: string,
  userAccessToken?: string
): Promise<Sheet[]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.sheets.sheet.query({
    path: { spreadsheet_token: spreadsheetToken },
  }, options);
  
  return response.data!.sheets!.map(s => ({
    sheetId: s.sheet_id!,
    title: s.title!,
    index: s.index!,
    rowCount: s.row_count!,
    columnCount: s.column_count!,
  }));
}
```

## 三、数据操作 API

### 3.1 读取单元格数据

```typescript
// GET /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/values/{range}
async function getValues(
  spreadsheetToken: string,
  range: string, // 如 "Sheet1!A1:C10"
  userAccessToken?: string
): Promise<any[][]> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.sheets.spreadsheetValues.get({
    path: {
      spreadsheet_token: spreadsheetToken,
      range,
    },
  }, options);
  
  return response.data!.valueRange!.values || [];
}
```

### 3.2 写入单元格数据

```typescript
// PUT /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/values
async function setValues(
  spreadsheetToken: string,
  range: string,
  values: any[][],
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.sheets.spreadsheetValues.put({
    path: { spreadsheet_token: spreadsheetToken },
    data: {
      valueRange: {
        range,
        values,
      },
    },
  }, options);
}
```

### 3.3 追加行数据

```typescript
// POST /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/values_append
async function appendRows(
  spreadsheetToken: string,
  range: string, // 如 "Sheet1!A:A"
  values: any[][],
  userAccessToken?: string
): Promise<{ updates: string }> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  const response = await client.sheets.spreadsheetValues.append({
    path: { spreadsheet_token: spreadsheetToken },
    data: {
      valueRange: {
        range,
        values,
      },
    },
    params: {
      insertDataOption: 'INSERT_DATA_OPTION_OVERWRITE',
    },
  }, options);
  
  return {
    updates: response.data!.updates!.updated_range!,
  };
}
```

### 3.4 批量更新多个范围

```typescript
// POST /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/values:batchUpdate
async function batchUpdate(
  spreadsheetToken: string,
  updates: Array<{ range: string; values: any[][] }>,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.sheets.spreadsheetValues.batchUpdate({
    path: { spreadsheet_token: spreadsheetToken },
    data: {
      valueRanges: updates.map(u => ({
        range: u.range,
        values: u.values,
      })),
    },
  }, options);
}
```

## 四、行/列操作 API

### 4.1 插入行/列

```typescript
// POST /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/insert_data_range
async function insertRows(
  spreadsheetToken: string,
  sheetId: string,
  startRowIndex: number,
  rowCount: number,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.sheets.dimension.insert({
    path: { spreadsheet_token: spreadsheetToken },
    data: {
      dimension: {
        sheet_id: parseInt(sheetId),
        major_dimension: 'ROWS',
        start_index: startRowIndex,
        end_index: startRowIndex + rowCount,
      },
      inheritStyle: 'AFTER',
    },
  }, options);
}
```

### 4.2 删除行/列

```typescript
// DELETE /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/dimension_range
async function deleteRows(
  spreadsheetToken: string,
  sheetId: string,
  startRowIndex: number,
  rowCount: number,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.sheets.dimension.delete_({
    path: { spreadsheet_token: spreadsheetToken },
    data: {
      dimension: {
        sheet_id: parseInt(sheetId),
        major_dimension: 'ROWS',
        start_index: startRowIndex,
        end_index: startRowIndex + rowCount,
      },
    },
  }, options);
}
```

## 五、格式化 API

### 5.1 设置单元格样式

```typescript
// POST /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/styles:batchUpdate
async function setStyle(
  spreadsheetToken: string,
  styles: Array<{ range: string; style: CellStyle }>,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.sheets.style.batchUpdate({
    path: { spreadsheet_token: spreadsheetToken },
    data: {
      appendStyle: true,
      styles: styles.map(s => ({
        range: s.range,
        style: s.style,
      })),
    },
  }, options);
}

interface CellStyle {
  font: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    color?: number;
  };
  backColor?: number;
  textAlign?: 'LEFT' | 'CENTER' | 'RIGHT';
  verticalAlign?: 'TOP' | 'MIDDLE' | 'BOTTOM';
}
```

### 5.2 合并单元格

```typescript
// POST /open-apis/sheets/v2/spreadsheets/{spreadsheet_token}/merge_cells
async function mergeCells(
  spreadsheetToken: string,
  range: string,
  userAccessToken?: string
): Promise<void> {
  const options = userAccessToken
    ? lark.withUserAccessToken(userAccessToken)
    : undefined;
  
  await client.sheets.mergeCells.merge({
    path: { spreadsheet_token: spreadsheetToken },
    data: { range },
  }, options);
}
```

## 六、使用示例

### 6.1 创建并填充表格

```typescript
// 1. 创建表格
const spreadsheet = await createSpreadsheet('销售数据');
const token = spreadsheet.spreadsheetToken;

// 2. 设置表头
await setValues(token, 'Sheet1!A1:E1', [
  ['日期', '产品', '销量', '单价', '金额'],
]);

// 3. 设置表头样式
await setStyle(token, [
  {
    range: 'Sheet1!A1:E1',
    style: {
      font: { bold: true, fontSize: 12 },
      backColor: 0xE8F3FF,
      textAlign: 'CENTER',
    },
  },
]);

// 4. 追加数据
const data = [
  ['2024-01-01', '产品A', 100, 10, '=C2*D2'],
  ['2024-01-02', '产品B', 200, 15, '=C3*D3'],
];
await appendRows(token, 'Sheet1!A:A', data);

console.log(`表格已创建: https://feishu.cn/sheets/${token}`);
```

### 6.2 读取并分析数据

```typescript
// 1. 读取所有数据
const values = await getValues(spreadsheetToken, 'Sheet1!A:E');

// 2. 分析数据
const headers = values[0];
const dataRows = values.slice(1);

console.log('表头:', headers);
console.log('数据行数:', dataRows.length);

// 3. 统计分析
const totalSales = dataRows.reduce((sum, row) => {
  return sum + (parseFloat(row[2]) || 0);
}, 0);

console.log('总销量:', totalSales);
```

### 6.3 批量更新多个范围

```typescript
// 同时更新多个工作表
await batchUpdate(spreadsheetToken, [
  {
    range: 'Sheet1!A1',
    values: [['总计']],
  },
  {
    range: 'Sheet1!B1',
    values: [[1000]],
  },
  {
    range: 'Sheet2!A1',
    values: [['更新时间']],
  },
  {
    range: 'Sheet2!B1',
    values: [[new Date().toISOString()]],
  },
]);
```

## 七、错误处理

```typescript
try {
  await getValues(spreadsheetToken, range, userToken);
} catch (error: any) {
  switch (error.code) {
    case 400:
      throw new Error('参数错误，请检查 range 格式');
    case 403:
      throw new Error('没有权限访问该表格，请申请授权');
    case 404:
      throw new Error('表格不存在或已被删除');
    case 429:
      throw new Error('请求过于频繁，请稍后重试');
    default:
      throw error;
  }
}
```

## 八、最佳实践

1. **批量操作**: 优先使用 `batchUpdate` 减少API调用次数
2. **范围优化**: 只读取需要的范围，避免读取整个工作表
3. **缓存机制**: 对不常变化的数据进行缓存
4. **错误重试**: 对于网络错误实现指数退避重试
5. **并发控制**: 避免同时发起大量请求，使用队列控制并发
