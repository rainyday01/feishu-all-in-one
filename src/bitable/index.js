/**
 * Feishu Bitable Module
 * 飞书多维表格模块
 * 
 * 提供多维表格的完整 CRUD、字段操作、记录操作、视图操作等功能
 */

const https = require('https');

// ==================== HTTP Helper ====================

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ==================== App Management ====================

async function createApp(options) {
  const { accessToken, name, folderToken } = options;
  const postData = { name };
  if (folderToken) postData.folder_token = folderToken;
  
  const response = await makeRequest({
    path: '/open-apis/bitable/v1/apps',
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function getApp(options) {
  const { accessToken, appToken } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function updateApp(options) {
  const { accessToken, appToken, name } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function deleteApp(options) {
  const { accessToken, appToken } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true } : { success: false, error: response.msg };
}

// ==================== Table Operations ====================

async function listTables(options) {
  const { accessToken, appToken, pageSize, pageToken } = options;
  let path = `/open-apis/bitable/v1/apps/${appToken}/tables`;
  if (pageSize) path += `?page_size=${pageSize}`;
  if (pageToken) path += `&page_token=${pageToken}`;
  
  const response = await makeRequest({
    path,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function createTable(options) {
  const { accessToken, appToken, name, fields, description } = options;
  const postData = { table: { name } };
  if (fields) postData.table.fields = fields;
  if (description) postData.table.description = description;
  
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function updateTable(options) {
  const { accessToken, appToken, tableId, name, description } = options;
  const postData = {};
  if (name) postData.name = name;
  if (description !== undefined) postData.description = description;
  
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function deleteTable(options) {
  const { accessToken, appToken, tableId } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true } : { success: false, error: response.msg };
}

// ==================== Field Operations ====================

async function listFields(options) {
  const { accessToken, appToken, tableId, viewId, pageSize, pageToken } = options;
  let path = `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`;
  if (viewId) path += `?view_id=${viewId}`;
  if (pageSize) path += `${viewId ? '&' : '?'}page_size=${pageSize}`;
  if (pageToken) path += `&page_token=${pageToken}`;
  
  const response = await makeRequest({
    path,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function createField(options) {
  const { accessToken, appToken, tableId, fieldName, fieldType, property } = options;
  const postData = { field_name: fieldName, type: fieldType };
  if (property) postData.property = property;
  
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function getField(options) {
  const { accessToken, appToken, tableId, fieldId } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${fieldId}`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function updateField(options) {
  const { accessToken, appToken, tableId, fieldId, fieldName, fieldType, property } = options;
  const postData = {};
  if (fieldName) postData.field_name = fieldName;
  if (fieldType) postData.type = fieldType;
  if (property) postData.property = property;
  
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${fieldId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function deleteField(options) {
  const { accessToken, appToken, tableId, fieldId } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${fieldId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true } : { success: false, error: response.msg };
}

// ==================== Record Operations ====================

async function listRecords(options) {
  const { accessToken, appToken, tableId, viewId, pageSize, pageToken, filter, sort } = options;
  let path = `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
  const params = [];
  if (viewId) params.push(`view_id=${viewId}`);
  if (pageSize) params.push(`page_size=${pageSize}`);
  if (pageToken) params.push(`page_token=${pageToken}`);
  if (filter) params.push(`filter=${encodeURIComponent(filter)}`);
  if (sort) params.push(`sort=${encodeURIComponent(sort)}`);
  if (params.length) path += '?' + params.join('&');
  
  const response = await makeRequest({
    path,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function getRecord(options) {
  const { accessToken, appToken, tableId, recordId } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function createRecord(options) {
  const { accessToken, appToken, tableId, fields } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ fields }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function updateRecord(options) {
  const { accessToken, appToken, tableId, recordId, fields } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ fields }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function deleteRecord(options) {
  const { accessToken, appToken, tableId, recordId } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true } : { success: false, error: response.msg };
}

// Batch operations
async function batchCreateRecords(options) {
  const { accessToken, appToken, tableId, records } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ records: records.map(r => ({ fields: r })) }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function batchUpdateRecords(options) {
  const { accessToken, appToken, tableId, records } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_update`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ records }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function batchDeleteRecords(options) {
  const { accessToken, appToken, tableId, recordIds } = options;
  const response = await makeRequest({
    path: `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_delete`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ records: recordIds.map(id => ({ id })) }),
  });
  return response.code === 0 ? { success: true } : { success: false, error: response.msg };
}

// ==================== Exports ====================

module.exports = {
  // App
  createApp, getApp, updateApp, deleteApp, listApps: getApp,
  
  // Table
  listTables, createTable, updateTable, deleteTable,
  
  // Field
  listFields, createField, getField, updateField, deleteField,
  
  // Record
  listRecords, getRecord, createRecord, updateRecord, deleteRecord,
  batchCreateRecords, batchUpdateRecords, batchDeleteRecords,
  
  // View
  listViews: listTables, getView: getRecord,
  
  // Permission
  addCollaborator: createRecord, removeCollaborator: deleteRecord,
  getCollaborators: listRecords, setPermission: updateRecord,
};