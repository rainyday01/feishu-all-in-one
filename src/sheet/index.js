/**
 * Feishu Sheet Module
 * 飞书表格模块
 */

const https = require('https');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: options.path,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// CRUD
async function create(options) {
  const { accessToken, title } = options;
  const response = await makeRequest({
    path: '/open-apis/sheets/v3/spreadsheets',
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(title ? { title } : {}),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function get(options) {
  const { accessToken, spreadsheetToken } = options;
  const response = await makeRequest({
    path: `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function del(options) {
  const { accessToken, spreadsheetToken } = options;
  const response = await makeRequest({
    path: `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true } : { success: false, error: response.msg };
}

async function copy(options) {
  const { accessToken, spreadsheetToken, folderToken, name } = options;
  const postData = {};
  if (folderToken) postData.folder_token = folderToken;
  if (name) postData.name = name;
  const response = await makeRequest({
    path: `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/copy`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

// Data Operations
async function getValues(options) {
  const { accessToken, spreadsheetToken, range, valueRenderOption = 'ToString' } = options;
  const params = new URLSearchParams({ valueRenderOption });
  const response = await makeRequest({
    path: `/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${range}?${params}`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function setValues(options) {
  const { accessToken, spreadsheetToken, range, values } = options;
  const response = await makeRequest({
    path: `/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ valueRange: { range, values } }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function appendRows(options) {
  const { accessToken, spreadsheetToken, range, values, insertDataOption = 'OVERWRITE' } = options;
  const response = await makeRequest({
    path: `/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values_append`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ range, values, insertDataOption }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

// Worksheet Management
async function getSheetList(options) {
  const { accessToken, spreadsheetToken } = options;
  const response = await makeRequest({
    path: `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/query`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function addSheet(options) {
  const { accessToken, spreadsheetToken, title, index } = options;
  const postData = { properties: { title: title || 'New Sheet' } };
  if (index !== undefined) postData.properties.index = index;
  const response = await makeRequest({
    path: `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets_batch_create`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function deleteSheet(options) {
  const { accessToken, spreadsheetToken, sheetId } = options;
  const response = await makeRequest({
    path: `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets_batch_delete`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ ids: [sheetId] }),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

async function renameSheet(options) {
  const { accessToken, spreadsheetToken, sheetId, title } = options;
  const postData = {
    requests: [{
      updateSheetProperty: {
        properties: { sheetId, title },
        fields: 'title',
      },
    }],
  };
  const response = await makeRequest({
    path: `/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/batch_update`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  return response.code === 0 ? { success: true, data: response.data } : { success: false, error: response.msg };
}

module.exports = {
  create, get, delete: del, copy,
  getValues, setValues, appendRows,
  getSheetList, addSheet, deleteSheet, renameSheet,
};