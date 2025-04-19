// 基础工具函数
class ExtensionUtils {
  static async loadResource(path) {
    try {
      return await import(chrome.runtime.getURL(path));
    } catch (e) {
      console.error(`[Extension] 资源加载失败: ${path}`, e);
      return null;
    }
  }
}

export default ExtensionUtils;