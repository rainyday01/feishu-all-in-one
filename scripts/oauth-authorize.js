/**
 * Feishu OAuth2 Authorization Script
 * 飞书 OAuth2 授权脚本
 * 
 * 用于获取用户访问令牌 (User Access Token)
 * 
 * Usage:
 *   node oauth-authorize.js --app-id=xxx --app-secret=xxx --redirect-uri=xxx
 */

const https = require('https');
const url = require('url');
const crypto = require('crypto');

// ==================== Configuration ====================

const DEFAULT_FEISHU_HOST = 'open.feishu.cn';
const DEFAULT_AUTHORIZE_PATH = '/open-apis/authen/v1/authorize';
const DEFAULT_TOKEN_PATH = '/open-apis/authen/v1/oauth/access_token';
const DEFAULT_REFRESH_PATH = '/open-apis/authen/v1/oauth/refresh_access_token';

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
  
  return `https://${DEFAULT_FEISHU_HOST}${DEFAULT_AUTHORIZE_PATH}?${params.toString()}`;
}

/**
 * Generate random state for CSRF protection
 * 生成随机 state 用于 CSRF 防护
 */
function generateRandomState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Exchange authorization code for access token
 * 使用授权码交换访问令牌
 */
async function exchangeCodeForToken(options) {
  const { appId, appSecret, code } = options;
  
  const postData = JSON.stringify({
    grant_type: 'authorization_code',
    client_id: appId,
    client_secret: appSecret,
    code: code,
    redirect_uri: options.redirectUri || '',
  });
  
  const response = await makeRequest({
    host: DEFAULT_FEISHU_HOST,
    path: DEFAULT_TOKEN_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    body: postData,
  });
  
  if (response.code === 0) {
    return {
      success: true,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenType: response.data.token_type,
      expiresIn: response.data.expires_in,
      refreshExpiresIn: response.data.refresh_expires_in,
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
    host: DEFAULT_FEISHU_HOST,
    path: DEFAULT_REFRESH_PATH,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    body: postData,
  });
  
  if (response.code === 0) {
    return {
      success: true,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenType: response.data.token_type,
      expiresIn: response.data.expires_in,
      refreshExpiresIn: response.data.refresh_expires_in,
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
 * Make HTTP request to Feishu API
 * 向飞书 API 发起 HTTP 请求
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: options.host,
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

// ==================== CLI Interface ====================

if (require.main === module) {
  const args = process.argv.slice(2);
  const params = {};
  
  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    params[key] = value;
  });
  
  const { action, 'app-id': appId, 'app-secret': appSecret, 'redirect-uri': redirectUri, code, 'refresh-token': refreshToken } = params;
  
  if (!action || !appId || !appSecret) {
    console.log(`
Feishu OAuth2 Authorization Script
飞书 OAuth2 授权脚本

Usage:
  node oauth-authorize.js --action=authorize --app-id=xxx --app-secret=xxx --redirect-uri=xxx
  node oauth-authorize.js --action=token --app-id=xxx --app-secret=xxx --code=xxx
  node oauth-authorize.js --action=refresh --app-id=xxx --app-secret=xxx --refresh-token=xxx

Options:
  --action         Action: authorize, token, refresh
  --app-id         Feishu App ID
  --app-secret     Feishu App Secret
  --redirect-uri   Redirect URI (for authorize)
  --code           Authorization code (for token)
  --refresh-token  Refresh token (for refresh)
`);
    process.exit(1);
  }
  
  (async () => {
    try {
      switch (action) {
        case 'authorize':
          const authUrl = generateAuthorizeUrl({ appId, appSecret, redirectUri });
          console.log('Authorization URL:');
          console.log(authUrl);
          break;
          
        case 'token':
          if (!code) {
            console.error('Error: --code is required for token action');
            process.exit(1);
          }
          const tokenResult = await exchangeCodeForToken({ appId, appSecret, code, redirectUri });
          console.log(JSON.stringify(tokenResult, null, 2));
          break;
          
        case 'refresh':
          if (!refreshToken) {
            console.error('Error: --refresh-token is required for refresh action');
            process.exit(1);
          }
          const refreshResult = await refreshAccessToken({ appId, appSecret, refreshToken });
          console.log(JSON.stringify(refreshResult, null, 2));
          break;
          
        default:
          console.error(`Unknown action: ${action}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}

// ==================== Exports ====================

module.exports = {
  generateAuthorizeUrl,
  generateRandomState,
  exchangeCodeForToken,
  refreshAccessToken,
  makeRequest,
};