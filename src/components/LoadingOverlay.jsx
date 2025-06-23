import { useTranslation } from 'react-i18next';
  // 为了解决无效钩子调用的问题，将 useTranslation 的调用移到函数组件内部
  const LoadingOverlay = () => {
  const { t } = useTranslation();
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p>{t('common.loading')}</p>
      <style jsx="true">{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .spinner {
          width: 40px;
          height: 40px;
          margin-bottom: 10px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;