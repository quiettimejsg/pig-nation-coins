// 扩展状态管理
class ExtensionState {
  static sessionKey = (() => {
    try {
      const key = crypto.getRandomValues(new Uint8Array(32));
      console.log('[Extension] 自动生成会话密钥');
      return key;
    } catch (e) {
      console.error('[Extension] 密钥生成失败:', e);
      throw new Error('SESSION_KEY_INIT_FAILED');
    }
  })();

  static validateSessionKey() {
    if (!this.sessionKey || this.sessionKey.length !== 32) {
      throw new Error('INVALID_SESSION_KEY');
    }
  }
}

export default ExtensionState;