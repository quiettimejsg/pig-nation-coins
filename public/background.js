// 后台服务worker初始化
ExtensionState.validateSessionKey();
console.log('[Background] 加密会话验证通过');
import ExtensionState from './extensionState.js';
import ExtensionUtils from './utils.js';

class SecretSession {
  constructor() {
    if (!ExtensionState.sessionKey) {
      throw new Error('SecretSessionError: Session key not initialized');
    }
    this.sessionKey = ExtensionState.sessionKey;
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
chrome.runtime.onInstalled.addListener(() => {
  ExtensionState.initializeSession();
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