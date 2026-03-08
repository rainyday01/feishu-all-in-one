/**
 * Feishu Router Module
 * 飞书路由模块
 * 
 * 提供 URL 解析、类型识别、Wiki 探测等功能
 */

// ==================== URL Patterns ====================

const URL_PATTERNS = {
  // Docx patterns
  docx: [
    /feishu\.cn\/docx\/([a-zA-Z0-9]+)/,
    /lark\.cn\/docx\/([a-zA-Z0-9]+)/,
  ],
  // Sheet patterns
  sheet: [
    /feishu\.cn\/sheets\/([a-zA-Z0-9]+)/,
    /lark\.cn\/sheets\/([a-zA-Z0-9]+)/,
  ],
  // Bitable patterns
  bitable: [
    /feishu\.cn\/base\/([a-zA-Z0-9]+)/,
    /lark\.cn\/base\/([a-zA-Z0-9]+)/,
  ],
  // Wiki patterns
  wiki: [
    /feishu\.cn\/wiki\/([a-zA-Z0-9]+)/,
    /lark\.cn\/wiki\/([a-zA-Z0-9]+)/,
  ],
};

// ==================== Token Patterns ====================

const TOKEN_PATTERNS = {
  docx: /^(docx|doxn)[a-zA-Z0-9]+$/,
  sheet: /^(shtc|shtn)[a-zA-Z0-9]+$/,
  bitable: /^(basc|basn)[a-zA-Z0-9]+$/,
};

// ==================== Main Functions ====================

/**
 * Parse Feishu URL and extract type and token
 * 解析飞书 URL，提取类型和 token
 */
function parseUrl(input) {
  // First try to extract URL from input (in case it's a message)
  const url = extractUrl(input);
  
  if (!url) {
    // Check if input is directly a token
    const token = extractToken(input);
    if (token) {
      return identifyTokenType(token);
    }
    return {
      success: false,
      error: 'Invalid Feishu URL or token',
    };
  }
  
  // Try each pattern
  for (const [type, patterns] of Object.entries(URL_PATTERNS)) {
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          success: true,
          type,
          token: match[1],
          source: 'url',
          url,
        };
      }
    }
  }
  
  // Not matched any known pattern
  return {
    success: false,
    error: 'Unknown Feishu URL format',
    input: url,
  };
}

/**
 * Extract URL from text (handles various formats)
 * 从文本中提取 URL
 */
function extractUrl(text) {
  if (!text) return null;
  
  // Direct URL match
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Check if text itself is a URL
  if (text.startsWith('http://') || text.startsWith('https://')) {
    return text;
  }
  
  return null;
}

/**
 * Extract token from URL or text
 * 从 URL 或文本中提取 token
 */
function extractToken(input) {
  if (!input) return null;
  
  // If it's already a token (no slashes, just alphanumeric)
  if (/^[a-zA-Z0-9]+$/.test(input)) {
    return input;
  }
  
  // Extract from URL
  const url = extractUrl(input);
  if (url) {
    // Try to get the last segment
    const segments = url.split('/').filter(s => s);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      // Remove query params
      return lastSegment.split('?')[0].split('#')[0];
    }
  }
  
  return null;
}

/**
 * Identify token type by its format
 * 根据 token 格式识别类型
 */
function identifyTokenType(token) {
  if (!token) {
    return {
      success: false,
      error: 'No token provided',
    };
  }
  
  // Check token patterns
  for (const [type, pattern] of Object.entries(TOKEN_PATTERNS)) {
    if (pattern.test(token)) {
      return {
        success: true,
        type,
        token,
        source: 'token',
      };
    }
  }
  
  // Unknown token type
  return {
    success: false,
    error: 'Unknown token format',
    token,
  };
}

/**
 * Analyze user request intent
 * 分析用户请求意图
 */
function analyzeRequest(text) {
  const lowerText = text.toLowerCase();
  
  // Action detection
  let action = 'read';
  if (lowerText.includes('创建') || lowerText.includes('create') || lowerText.includes('新建')) {
    action = 'create';
  } else if (lowerText.includes('删除') || lowerText.includes('delete') || lowerText.includes('移除')) {
    action = 'delete';
  } else if (lowerText.includes('更新') || lowerText.includes('update') || lowerText.includes('修改')) {
    action = 'update';
  } else if (lowerText.includes('写入') || lowerText.includes('write') || lowerText.includes('添加数据')) {
    action = 'write';
  } else if (lowerText.includes('分析') || lowerText.includes('analyze') || lowerText.includes('总结')) {
    action = 'analyze';
  }
  
  // Type detection (if explicitly mentioned)
  let explicitType = null;
  if (lowerText.includes('文档') || lowerText.includes('doc')) {
    explicitType = 'doc';
  } else if (lowerText.includes('表格') || lowerText.includes('sheet')) {
    explicitType = 'sheet';
  } else if (lowerText.includes('多维表格') || lowerText.includes('bitable') || lowerText.includes('base')) {
    explicitType = 'bitable';
  }
  
  return {
    action,
    explicitType,
    rawText: text,
  };
}

/**
 * Resolve Wiki type via API (when URL contains /wiki/)
 * 通过 API 探测 Wiki 类型
 */
async function resolveWikiType(token, accessToken) {
  const https = require('https');
  
  // Try to detect by trying each API
  const endpoints = [
    { type: 'sheet', path: `/open-apis/sheets/v3/spreadsheets/${token}` },
    { type: 'bitable', path: `/open-apis/bitable/v1/apps/${token}` },
    { type: 'doc', path: `/open-apis/docx/v1/documents/${token}` },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest({
        path: endpoint.path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (response.code === 0) {
        return {
          success: true,
          type: endpoint.type,
          token,
          source: 'wiki',
        };
      }
    } catch (e) {
      // Try next
    }
  }
  
  return {
    success: false,
    error: 'Failed to resolve Wiki type',
    token,
  };
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Determine which SDK to use
 * 确定使用哪个 SDK
 */
function getSDK(type) {
  const sdkMap = {
    doc: '@larksuiteoapi/node-sdk',
    sheet: '@larksuiteoapi/node-sdk',
    bitable: '@lark-base-open/node-sdk',
  };
  
  return sdkMap[type] || null;
}

// ==================== Exports ====================

module.exports = {
  parseUrl,
  extractUrl,
  extractToken,
  identifyTokenType,
  analyzeRequest,
  resolveWikiType,
  getSDK,
  URL_PATTERNS,
  TOKEN_PATTERNS,
};