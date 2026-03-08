/**
 * Feishu Authentication Module
 * 飞书认证模块
 * 
 * 提供 OAuth2 授权、令牌管理、权限检查等功能
 */

const https = require('https');
const crypto = require('crypto');

const FEISHU_HOST = 'open.feishu.cn';

// ==================== Token Cache ====================

class TokenCache {
  constructor() {
    this.cache = new Map();
  }
  
  set(userId, tokenData) {
    this.cache.set(userId, {
      ...tokenData,
      cachedAt: Date.now(),
    });
  }
  
  get(userId) {
    return this.cache.get(userId);
  }
  
  has(userId) {
    const token = this.cache.get(userId);
    if (!token) return false;
    
    // Check if expired (with 5 min buffer)
    const expiresAt = token.cachedAt + (token.expiresIn - 300) * 1000;
    return Date.now() < expiresAt;
  }
  
  delete(userId) {
    this.cache.delete(userId);
  }
  
  clear() {
    this.cache.clear();
  }
}

const tokenCache = new TokenCache();

// ==================== Helper Functions ====================

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: options.host || FEISHU_HOST,
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
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

function generateRandomState() {
  return crypto.randomBytes(16).toString('hex');
}

// ==================== Main Functions ====================

/**
 * Generate authorization URL
 * 生成授权 URL
 */
function generateAuthorizeUrl(options) {
  const {
    appId,
    redirectUri,
    state = generateRandomState(),
    scope = 'docx:read docx:write bitable:read bitable:write sheets:read sheets:write',
  } = options;
  
  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    state: state,
    scope: scope,
  });
  
  return `https://${FEISHU_HOST}/open-apis/authen/v1/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * 使用授权码交换访问令牌
 */
async function exchangeCodeForToken(options) {
  const { appId, appSecret, code, redirectUri } = options;
  
  const postData = JSON.stringify({
    grant_type: 'authorization_code',
    client_id: appId,
    client_secret: appSecret,
    code: code,
    redirect_uri: redirectUri || '',
  });
  
  const response = await makeRequest({
    path: '/open-apis/authen/v1/oauth/access_token',
    method: 'POST',
    body: postData,
  });
  
  if (response.code === 0) {
    return {
      success: true,
      data: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        refreshExpiresIn: response.data.refresh_expires_in,
      },
    };
  } else {
    return {
      success: false,
      error: response.msg,
      errorCode: response.code,
    };
  }
}

/**
 * Refresh access token
 * 刷新访问令牌
 */
async function refreshAccessToken(options) {
  const { appId, appSecret, refreshToken } = options;
  
  const postData = JSON.stringify({
    grant_type: 'refresh_token',
    client_id: appId,
    client_secret: appSecret,
    refresh_token: refreshToken,
  });
  
  const response = await makeRequest({
    path: '/open-apis/authen/v1/oauth/refresh_access_token',
    method: 'POST',
    body: postData,
  });
  
  if (response.code === 0) {
    return {
      success: true,
      data: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        refreshExpiresIn: response.data.refresh_expires_in,
      },
    };
  } else {
    return {
      success: false,
      error: response.msg,
      errorCode: response.code,
    };
  }
}

/**
 * Get valid token for user (from cache or refresh)
 * 获取用户的有效令牌
 */
async function getValidToken(options) {
  const { appId, appSecret, userId } = options;
  
  // Check cache first
  if (tokenCache.has(userId)) {
    const cached = tokenCache.get(userId);
    return {
      success: true,
      accessToken: cached.accessToken,
      fromCache: true,
    };
  }
  
  // Need to refresh
  const cached = tokenCache.get(userId);
  if (cached && cached.refreshToken) {
    const result = await refreshAccessToken({
      appId,
      appSecret,
      refreshToken: cached.refreshToken,
    });
    
    if (result.success) {
      tokenCache.set(userId, result.data);
      return {
        success: true,
        accessToken: result.data.accessToken,
        fromCache: false,
      };
    }
  }
  
  return {
    success: false,
    error: 'No valid token available',
    needsAuthorization: true,
  };
}

/**
 * Check document/sheet/bitable permission
 * 检查文档/表格/多维表格权限
 */
async function checkDocumentPermission(options) {
  const { accessToken, docType, docToken } = options;
  
  let path = '';
  switch (docType) {
    case 'doc':
      path = `/open-apis/docx/v1/documents/${docToken}`;
      break;
    case 'sheet':
      path = `/open-apis/sheets/v3/spreadsheets/${docToken}`;
      break;
    case 'bitable':
      path = `/open-apis/bitable/v1/apps/${docToken}`;
      break;
    default:
      return { success: false, error: `Unknown doc type: ${docType}` };
  }
  
  try {
    const response = await makeRequest({
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (response.code === 0) {
      return {
        success: true,
        hasAccess: true,
        data: response.data,
      };
    } else if (response.code === 99991663) {
      // No permission
      return {
        success: true,
        hasAccess: false,
        error: 'No permission to access this resource',
      };
    } else {
      return {
        success: false,
        error: response.msg,
        errorCode: response.code,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Request user permission (trigger OAuth)
 * 请求用户授权（触发 OAuth 流程）
 */
async function requestUserPermission(options) {
  const { appId, redirectUri, docType, docToken } = options;
  
  const authUrl = generateAuthorizeUrl({
    appId,
    redirectUri,
    scope: getScopeForDocType(docType),
  });
  
  return {
    success: true,
    authorizationUrl: authUrl,
    message: 'Please authorize access to this document',
  };
}

function getScopeForDocType(docType) {
  const scopeMap = {
    doc: 'docx:read docx:write',
    sheet: 'sheets:read sheets:write',
    bitable: 'bitable:read bitable:write',
  };
  return scopeMap[docType] || 'docx:read docx:write bitable:read bitable:write sheets:read sheets:write';
}

// ==================== Config Loader ====================

/**
 * Load Feishu config from LobsterAI
 * 从 LobsterAI 加载飞书配置
 */
function loadConfigFromLobsterAI() {
  // This will be called by LobsterAI when the skill is loaded
  // The actual config will be passed by LobsterAI
  return {
    appId: process.env.FEISHU_APP_ID || '',
    appSecret: process.env.FEISHU_APP_SECRET || '',
  };
}

// ==================== Exports ====================

module.exports = {
  // OAuth
  generateAuthorizeUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  
  // Token Management
  getValidToken,
  tokenCache,
  
  // Permission
  checkDocumentPermission,
  requestUserPermission,
  
  // Config
  loadConfigFromLobsterAI,
  
  // Utils
  generateRandomState,
};