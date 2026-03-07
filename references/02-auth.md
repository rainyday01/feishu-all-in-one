# 飞书用户权限申请机制

## 一、权限模型概述

### 1.1 飞书权限层级

```
┌─────────────────────────────────────────────────────────────┐
│                    飞书权限层级                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  应用权限 (App Permission)                                  │
│  ├── tenant_access_token: 应用级别的访问令牌                 │
│  │   └── 只能访问应用自己创建的资源                          │
│  │                                                          │
│  └── user_access_token: 用户代理访问令牌 ⭐ 本技能重点        │
│      └── 以用户身份访问用户有权限的所有资源                   │
│                                                             │
│  文档权限 (Document Permission)                             │
│  ├── viewer: 只读                                           │
│  ├── editor: 可编辑                                         │
│  └── owner: 所有者                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 为什么需要用户权限？

**问题**: 飞书机器人默认无法访问用户创建的文档

```
用户创建文档 → 文档属于用户 → 机器人无权限访问 ❌
```

**解决方案**: 通过 OAuth2 授权，机器人以用户身份访问

```
用户授权 → 机器人获得 user_access_token → 以用户身份访问文档 ✅
```

## 二、OAuth2 授权流程

### 2.1 授权码模式 (Authorization Code)

```
┌─────────────────────────────────────────────────────────────┐
│                  OAuth2 授权流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 机器人发起授权请求                                       │
│     GET /open-apis/authen/v1/authorize                     │
│     参数:                                                   │
│       - app_id: 应用 ID                                     │
│       - redirect_uri: 回调地址                              │
│       - scope: 权限范围                                     │
│       - state: 随机状态码                                   │
│                                                             │
│  2. 用户在浏览器中确认授权                                   │
│     → 飞书跳转到 redirect_uri?code=xxx&state=yyy            │
│                                                             │
│  3. 机器人用授权码交换令牌                                   │
│     POST /open-apis/authen/v1/oauth/access_token           │
│     返回:                                                   │
│       - access_token: 访问令牌 (2小时有效)                   │
│       - refresh_token: 刷新令牌 (30天有效)                   │
│       - expires_in: 过期时间                                │
│                                                             │
│  4. 使用访问令牌调用 API                                     │
│     Header: Authorization: Bearer {user_access_token}       │
│                                                             │
│  5. 令牌过期后刷新                                           │
│     POST /open-apis/authen/v1/oauth/refresh_access_token   │
│     返回新的 access_token 和 refresh_token                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 权限范围 (Scopes)

```typescript
// 常用权限范围
const REQUIRED_SCOPES = {
  // 文档权限
  docx: ['docx:read', 'docx:write'],
  
  // 表格权限
  sheets: ['sheets:read', 'sheets:write'],
  
  // 多维表格权限
  bitable: ['bitable:read', 'bitable:write'],
  
  // 用户信息
  contact: ['contact:user.base:readonly'],
};

// 合并所有需要的权限
function buildScope(operations: string[]): string {
  const scopes = new Set<string>();
  
  for (const op of operations) {
    if (op.includes('doc')) scopes.add('docx:read').add('docx:write');
    if (op.includes('sheet')) scopes.add('sheets:read').add('sheets:write');
    if (op.includes('bitable')) scopes.add('bitable:read').add('bitable:write');
  }
  
  return Array.from(scopes).join(' ');
}
```

## 三、双通道授权实现

### 3.1 通道一: LobsterAI 本地弹窗

```typescript
// src/auth/localAuth.ts

import { BrowserWindow, ipcMain } from 'electron';

export class LocalAuthHandler {
  /**
   * 显示本地授权对话框
   */
  async showAuthDialog(request: AuthRequest): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      // 创建授权窗口
      const win = new BrowserWindow({
        width: 500,
        height: 400,
        modal: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      
      // 加载授权页面
      win.loadFile('auth-dialog.html', {
        query: {
          docName: request.docName,
          docType: request.docType,
          permissions: request.permissions.join(','),
        },
      });
      
      // 监听用户响应
      ipcMain.once('auth-response', (event, result) => {
        win.close();
        if (result.granted) {
          resolve(result);
        } else {
          reject(new Error('用户拒绝授权'));
        }
      });
    });
  }
  
  /**
   * 生成授权 URL
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      app_id: process.env.FEISHU_APP_ID!,
      redirect_uri: 'lobsterai://auth/callback',
      scope: 'docx:read docx:write bitable:read bitable:write',
      state,
    });
    
    return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params}`;
  }
}
```

### 3.2 通道二: 飞书聊天卡片授权

```typescript
// src/auth/feishuCardAuth.ts

import * as lark from '@larksuiteoapi/node-sdk';

export class FeishuCardAuthHandler {
  private client: lark.Client;
  
  constructor(client: lark.Client) {
    this.client = client;
  }
  
  /**
   * 发送授权请求卡片
   */
  async sendAuthCard(chatId: string, request: AuthRequest): Promise<void> {
    const card = {
      config: { wide_screen_mode: true },
      header: {
        template: 'blue',
        title: { content: '🔒 需要授权访问', tag: 'plain_text' },
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**文档**: ${request.docName}\n**操作**: ${request.action}`,
            tag: 'lark_md',
          },
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { content: '授权访问', tag: 'plain_text' },
              type: 'primary',
              value: {
                action: 'authorize',
                docToken: request.docToken,
                state: request.state,
              },
            },
            {
              tag: 'button',
              text: { content: '暂时不用', tag: 'plain_text' },
              type: 'default',
              value: { action: 'cancel' },
            },
          ],
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: '授权后机器人将以您的身份访问文档',
            },
          ],
        },
      ],
    };
    
    await this.client.im.message.create({
      params: { receive_id_type: 'chat_id' },
      data: {
        receive_id: chatId,
        content: JSON.stringify(card),
        msg_type: 'interactive',
      },
    });
  }
  
  /**
   * 处理卡片回调
   */
  async handleCardCallback(event: any): Promise<void> {
    const { action, docToken, state } = event.action.value;
    
    if (action === 'authorize') {
      // 生成授权链接并发送给用户
      const authUrl = this.generateAuthUrl(state);
      await this.sendMessage(event.context.open_id, 
        `请点击链接完成授权: ${authUrl}`);
    }
  }
  
  private generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      app_id: process.env.FEISHU_APP_ID!,
      redirect_uri: 'https://your-callback-url/auth',
      scope: 'docx:read docx:write bitable:read bitable:write',
      state,
    });
    
    return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params}`;
  }
}
```

## 四、令牌管理

### 4.1 令牌缓存

```typescript
// src/auth/tokenManager.ts

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  userId: string;
}

export class TokenManager {
  private cache = new Map<string, TokenCache>();
  
  /**
   * 获取有效的访问令牌
   */
  async getValidToken(userId: string): Promise<string> {
    const cached = this.cache.get(userId);
    
    if (!cached) {
      throw new Error('用户未授权，请先申请权限');
    }
    
    // 提前 5 分钟刷新
    if (cached.expiresAt - 300_000 < Date.now()) {
      return await this.refreshToken(userId);
    }
    
    return cached.accessToken;
  }
  
  /**
   * 刷新访问令牌
   */
  private async refreshToken(userId: string): Promise<string> {
    const cached = this.cache.get(userId);
    if (!cached) {
      throw new Error('用户未授权');
    }
    
    const response = await fetch(
      'https://open.feishu.cn/open-apis/authen/v1/oauth/refresh_access_token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: cached.refreshToken,
        }),
      }
    );
    
    const data = await response.json();
    
    if (data.code !== 0) {
      // 刷新失败，需要重新授权
      this.cache.delete(userId);
      throw new Error('令牌刷新失败，请重新授权');
    }
    
    // 更新缓存
    const newToken: TokenCache = {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresAt: Date.now() + data.data.expires_in * 1000,
      scope: data.data.scope,
      userId,
    };
    
    this.cache.set(userId, newToken);
    return newToken.accessToken;
  }
  
  /**
   * 存储新令牌
   */
  storeToken(userId: string, tokenData: any): void {
    this.cache.set(userId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      scope: tokenData.scope,
      userId,
    });
  }
}
```

### 4.2 权限检查中间件

```typescript
// src/auth/permissionMiddleware.ts

export async function checkPermission(
  docType: 'doc' | 'sheet' | 'bitable',
  docToken: string,
  userId: string,
  tokenManager: TokenManager
): Promise<{ hasAccess: boolean; token?: string }> {
  try {
    const token = await tokenManager.getValidToken(userId);
    
    // 尝试访问文档验证权限
    const response = await fetch(
      `https://open.feishu.cn/open-apis/${getApiPath(docType)}/${docToken}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    if (response.ok) {
      return { hasAccess: true, token };
    }
    
    if (response.status === 403) {
      return { hasAccess: false };
    }
    
    throw new Error(`权限检查失败: ${response.statusText}`);
  } catch (error) {
    return { hasAccess: false };
  }
}

function getApiPath(docType: string): string {
  const paths = {
    doc: 'docx/v1/documents',
    sheet: 'sheets/v3/spreadsheets',
    bitable: 'bitable/v1/apps',
  };
  return paths[docType];
}
```

## 五、完整授权流程示例

```typescript
// 使用示例

async function handleUserRequest(
  request: string,
  docUrl: string,
  userId: string,
  chatId: string
) {
  // 1. 解析 URL
  const parsed = parseFeishuUrl(docUrl);
  
  // 2. 检查权限
  const permission = await checkPermission(
    parsed.type,
    parsed.token,
    userId,
    tokenManager
  );
  
  if (!permission.hasAccess) {
    // 3. 请求授权
    const state = generateRandomState();
    
    // 尝试本地弹窗
    if (isDesktopMode()) {
      const localAuth = new LocalAuthHandler();
      await localAuth.showAuthDialog({
        docName: parsed.token,
        docType: parsed.type,
        permissions: ['read', 'write'],
        state,
      });
    } else {
      // 飞书卡片授权
      const cardAuth = new FeishuCardAuthHandler(client);
      await cardAuth.sendAuthCard(chatId, {
        docName: parsed.token,
        docType: parsed.type,
        docToken: parsed.token,
        action: '读取文档内容',
        state,
      });
    }
    
    return { status: 'waiting_auth' };
  }
  
  // 4. 执行操作
  const result = await executeWithToken(
    request,
    parsed,
    permission.token!
  );
  
  return result;
}
```

## 六、安全注意事项

1. **State 参数**: 每次授权请求必须使用随机 state 参数，防止 CSRF 攻击
2. **令牌存储**: 访问令牌应加密存储，不应明文保存在数据库中
3. **刷新令牌**: 刷新令牌的有效期为 30 天，需要定期刷新
4. **权限最小化**: 只申请必要的权限范围
5. **回调验证**: 回调处理时必须验证 state 参数
