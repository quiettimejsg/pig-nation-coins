import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ErrorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="error-page">
      <div className="content-with-glass">
        <h1>{t('error_page.title', { fallback: '出错了' })}</h1>
        <p>{t('error_page.message', { fallback: '抱歉，发生了一些问题' })}</p>
        <button 
          onClick={() => navigate('/')}
          className="home-button"
        >
          {t('error_page.back_home', { fallback: '返回首页' })}
        </button>
      </div>
    </div>
  );
} 