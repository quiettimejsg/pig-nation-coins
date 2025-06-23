// 后台服务worker初始化
import ExtensionState from './extensionState.js';
import ExtensionUtils from './utils.js';

// 初始化会话密钥
async function initializeBackground() {
  await ExtensionState.initializeSession();
  ExtensionState.validateSessionKey();
  console.log('[Background] 加密会话验证通过');
}
initializeBackground().catch(e => console.error('后台初始化失败:', e));

const INSTANCE_KEY = Symbol('INSTANCE_KEY');

class SecretSession {
  constructor(key) {
    if (key !== INSTANCE_KEY) {
      throw new Error('SecretSession must be created with createInstance()');
    }
    this.sessionKey = ExtensionState.sessionKey;
  }
  
  static async createInstance() {
    if (!ExtensionState.sessionKey) {
      await ExtensionState.initializeSession();
    }
    if (!ExtensionState.sessionKey) {
      throw new Error('SecretSessionError: Session key not initialized');
    }
    return new SecretSession();
  }

  encrypt(data) {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      return crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12) },
        this.sessionKey,
        encodedData
      );
    } catch (e) {
      console.error('[SecretSession] 加密失败:', e);
      throw new Error('SecretSessionError: Encryption failed');
    }
  }
}

// 初始化扩展状态
chrome.runtime.onInstalled.addListener(async () => {
  await ExtensionState.initializeSession();
  console.log('[Background] 扩展已安装');
});

// 浏览器启动时初始化会话
chrome.runtime.onStartup.addListener(async () => {
  await ExtensionState.initializeSession();
  console.log('[Background] 扩展启动');
});

// 保持端口连接状态
let port = null;

const maintainConnection = () => {
  if (!port) {
    port = chrome.runtime.connect({ name: 'background' });
    port.onDisconnect.addListener(() => {
      console.log('[Background] 端口断开，尝试重连...');
      setTimeout(maintainConnection, 1000);
    });
  }
};

// 启动连接维护
maintainConnection();