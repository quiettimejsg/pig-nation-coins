import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';
import jaTranslations from '../locales/ja.json';

// 语言变更自定义事件，用于通知自定义元素
const dispatchLanguageChangeEvent = (lng) => {
  const event = new CustomEvent('app-language-changed', { 
    detail: { language: lng },
    bubbles: true, 
    composed: true 
  });
  document.dispatchEvent(event);
};

if (!i18n.isInitialized) {
  // 获取保存的语言设置或默认为中文
  const savedLanguage = localStorage.getItem('i18nextLng') || 'zh';
  
  i18n
    .use(initReactI18next)
    .init({
      debug: process.env.NODE_ENV === 'development',
      resources: {
        en: { translation: enTranslations },
        zh: { translation: zhTranslations },
        ja: { translation: jaTranslations }
      },
      lng: savedLanguage,
      fallbackLng: 'zh',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });

  // 确保语言设置被保存
  if (!localStorage.getItem('i18nextLng')) {
    localStorage.setItem('i18nextLng', 'zh');
  }
  
  // 监听语言变更，在变更时调用自定义事件
  i18n.on('languageChanged', (lng) => {
    console.log('[i18n] 语言已切换至:', lng);
    localStorage.setItem('i18nextLng', lng);
    dispatchLanguageChangeEvent(lng);
  });
  
  console.log('[i18n] 初始化完成，当前语言:', i18n.language);
}

// 提供通知所有组件刷新的辅助方法
const refreshAllComponents = () => {
  dispatchLanguageChangeEvent(i18n.language);
};

export { i18n, refreshAllComponents };