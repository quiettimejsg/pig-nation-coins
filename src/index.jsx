import { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { useStore } from './store';
import router from './router.jsx';
import { i18n } from './utils/i18n';
import { I18nextProvider } from 'react-i18next';
import './index.css';
import './styles/global.css';

// 全局异常处理
window.addEventListener('error', (event) => {
  console.error('全局错误捕获:', event.error);
  // 可以添加错误上报逻辑
});

// 初始化应用
const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // 加载store状态
        if (useStore.getState()._hasHydrated === false) {
          await useStore.getState().hydrate();
        }
        
        // 其他初始化逻辑...
        
        setIsReady(true);
      } catch (error) {
        console.error('应用初始化失败:', error);
        setIsReady(true); // 即使失败也要设置ready，让用户可以看到界面
      }
    };
    
    initApp();
  }, []);

  useEffect(() => {
    const updateMetadata = () => {
      // 动态更新文档标题和元描述
      document.title = i18n.t('html_meta.title');
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.content = i18n.t('html_meta.description');
      }
    };

    // 初始调用
    updateMetadata();

    // 订阅语言变化事件
    i18n.on('languageChanged', updateMetadata);

    // 清理函数
    return () => {
      i18n.off('languageChanged', updateMetadata);
    };
  }, [i18n]);

  if (!isReady) {
return <div className="loading">{i18n.t('common.loading')}</div>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  );
};

// 渲染应用
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    throw new Error('找不到root元素');
  }
} catch (err) {
  console.error('应用渲染失败:', err);
}