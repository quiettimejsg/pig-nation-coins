import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="not-found-page">
      <div className="content-with-glass">
        <h1>{t('not_found.title', { fallback: '页面未找到' })}</h1>
        <p>{t('not_found.message', { fallback: '您访问的页面不存在' })}</p>
        <button 
          onClick={() => navigate('/')}
          className="home-button"
        >
          {t('not_found.back_home', { fallback: '返回首页' })}
        </button>
      </div>
    </div>
  );
} 