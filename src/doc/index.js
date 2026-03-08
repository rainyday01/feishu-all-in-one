/**
 * Feishu Document Module
 * 飞书文档模块
 * 
 * 提供文档 CRUD、Block 操作、富文本处理等功能
 */

const https = require('https');

// ==================== Client Factory ====================

function createClient(accessToken) {
  return {
    accessToken,
    request(options) {
      return makeRequest({
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      });
    },
  };
}

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

// ==================== Document CRUD ====================

/**
 * Create a new document
 * 创建新文档
 */
async function create(options) {
  const { accessToken, title = 'Untitled', folderToken } = options;
  
  const postData = {
    title,
  };
  
  if (folderToken) {
    postData.parent_token = folderToken;
  }
  
  const response = await makeRequest({
    path: '/open-apis/docx/v1/documents',
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Get document content and metadata
 * 获取文档内容和元数据
 */
async function get(options) {
  const { accessToken, documentId } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Delete a document
 * 删除文档
 */
async function del(options) {
  const { accessToken, documentId } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (response.code === 0) {
    return { success: true };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Duplicate/copy a document
 * 复制文档
 */
async function duplicate(options) {
  const { accessToken, documentId, folderToken, name } = options;
  
  const postData = {};
  if (folderToken) postData.parent_token = folderToken;
  if (name) postData.name = name;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/copy`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

// ==================== Block Operations ====================

/**
 * List all blocks in a document
 * 列出文档中所有块
 */
async function listBlocks(options) {
  const { accessToken, documentId, pageSize = 500, pageToken } = options;
  
  let path = `/open-apis/docx/v1/documents/${documentId}/blocks?page_size=${pageSize}`;
  if (pageToken) path += `&page_token=${pageToken}`;
  
  const response = await makeRequest({
    path,
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (response.code === 0) {
    return {
      success: true,
      data: response.data,
      hasMore: response.data.has_more,
      nextPageToken: response.data.page_token,
    };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Get a single block
 * 获取单个块
 */
async function getBlock(options) {
  const { accessToken, documentId, blockId } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/${blockId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Insert a new block
 * 插入新块
 */
async function insertBlock(options) {
  const { accessToken, documentId, parentId, blockType, content, index } = options;
  
  const postData = {
    block_type: blockType,
    structure: content,
  };
  
  let path = `/open-apis/docx/v1/documents/${documentId}/blocks`;
  if (parentId) {
    path = `/open-apis/docx/v1/documents/${documentId}/blocks/${parentId}/children`;
    if (index !== undefined) {
      path += `?index=${index}`;
    }
  }
  
  const response = await makeRequest({
    path,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Update a block
 * 更新块内容
 */
async function updateBlock(options) {
  const { accessToken, documentId, blockId, content } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/${blockId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(content),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Delete a block
 * 删除块
 */
async function deleteBlock(options) {
  const { accessToken, documentId, blockId } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/${blockId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (response.code === 0) {
    return { success: true };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Batch update blocks
 * 批量更新块
 */
async function batchUpdateBlocks(options) {
  const { accessToken, documentId, operations } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/batch_update`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ operations }),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

// ==================== Rich Text/Table Operations ====================

/**
 * Create a table in document
 * 在文档中创建表格
 */
async function createTable(options) {
  const { accessToken, documentId, rowSize, columnSize, columnWidth } = options;
  
  const postData = {
    block_type: 2, // Table
    table_properties: {
      property: {
        rows: rowSize || 3,
        columns: columnSize || 3,
        column_width: columnWidth || [],
      },
    },
  };
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Insert table row
 * 插入表格行
 */
async function insertTableRow(options) {
  const { accessToken, documentId, tableBlockId, rowIndex, rowCount } = options;
  
  const postData = {
    block_type: 2, // Table row
    table_header_row_index: rowIndex || 0,
    row_count: rowCount || 1,
  };
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/${tableBlockId}/rows`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Insert table column
 * 插入表格列
 */
async function insertTableColumn(options) {
  const { accessToken, documentId, tableBlockId, columnIndex, columnWidth } = options;
  
  const postData = {
    column_index: columnIndex || 0,
    column_width: columnWidth || 100,
  };
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/${tableBlockId}/columns`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Delete table rows
 * 删除表格行
 */
async function deleteTableRows(options) {
  const { accessToken, documentId, tableBlockId, startIndex, endIndex } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/${tableBlockId}/rows`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ start_index: startIndex, end_index: endIndex }),
  });
  
  if (response.code === 0) {
    return { success: true };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Delete table columns
 * 删除表格列
 */
async function deleteTableColumns(options) {
  const { accessToken, documentId, tableBlockId, startIndex, endIndex } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/blocks/${tableBlockId}/columns`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ start_index: startIndex, end_index: endIndex }),
  });
  
  if (response.code === 0) {
    return { success: true };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

// ==================== Permission Management ====================

/**
 * Share document
 * 分享文档
 */
async function share(options) {
  const { accessToken, documentId, shareType = 'anyone_with_link', permission } = options;
  
  const postData = { share_type: shareType };
  if (permission) postData.permission = permission;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/share`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Get permission list
 * 获取权限列表
 */
async function getPermission(options) {
  const { accessToken, documentId } = options;
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/permissions`,
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

/**
 * Set permission
 * 设置权限
 */
async function setPermission(options) {
  const { accessToken, documentId, permission, memberType, memberId } = options;
  
  const postData = {
    permission_level: permission,
    member_type: memberType,
    member_id: memberId,
  };
  
  const response = await makeRequest({
    path: `/open-apis/docx/v1/documents/${documentId}/permissions`,
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(postData),
  });
  
  if (response.code === 0) {
    return { success: true, data: response.data };
  }
  return { success: false, error: response.msg, errorCode: response.code };
}

// ==================== Exports ====================

module.exports = {
  // CRUD
  create,
  get,
  delete: del,
  duplicate,
  
  // Blocks
  listBlocks,
  getBlock,
  insertBlock,
  updateBlock,
  deleteBlock,
  batchUpdateBlocks,
  
  // Table
  createTable,
  insertTableRow,
  insertTableColumn,
  deleteTableRows,
  deleteTableColumns,
  
  // Permission
  share,
  getPermission,
  setPermission,
};