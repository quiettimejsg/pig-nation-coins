// 扩展状态管理
class ExtensionState {
  static sessionKey = null;

  static async initializeSession() {
    if (!this.sessionKey) {
      try {
        // 生成AES-GCM CryptoKey而非原始字节数组
        this.sessionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true, // 可提取
          ['encrypt', 'decrypt'] // 用途
        );
        console.log('[Extension] 自动生成会话密钥');
      } catch (e) {
        console.error('[Extension] 密钥生成失败:', e);
        throw new Error('SESSION_KEY_INIT_FAILED');
      }
    }
  }

  static validateSessionKey() {
    if (!this.sessionKey || !(this.sessionKey instanceof CryptoKey)) {
      throw new Error('INVALID_SESSION_KEY');
    }
  }
}

export default ExtensionState;