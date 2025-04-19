import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import '../styles/NavBar.css';
import { FaSun, FaMoon } from 'react-icons/fa';

const NavBar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout, theme, toggleTheme } = useStore(state => ({
    currentUser: state.currentUser,
    logout: state.logout,
    theme: state.theme,
    toggleTheme: state.toggleTheme
  }));
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleThemeToggle = () => {
    toggleTheme();
  };
  
  return (
    <nav className="nav-bar">
      <div className="nav-brand">
        <img src="/logo.png" alt="Logo" className="brand-logo" />
        <h1>{t('app_name')}</h1>
      </div>
      
      <div className="nav-bottom">
        <div className="nav-links">
          <button className="nav-link" onClick={() => navigate('/payment')}>
            {t('nav.payment')}
          </button>
          <button className="nav-link" onClick={() => navigate('/merchant')}>
            {t('nav.merchant')}
          </button>
          <button className="nav-link" onClick={() => navigate('/admin')}>
            {t('nav.admin')}
          </button>
        </div>
      </div>
      
      <div className="nav-actions">
          <div className="language-selector-container">
            <div className="language-option selected-language">中文</div>
            <div className="language-option">English</div>
          </div>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>
        
        {currentUser ? (
          <div className="user-menu">
            <span className="username">{currentUser.username}</span>
            <button className="logout-button" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          </div>
        ) : (
          <button className="login-button" onClick={() => navigate('/login')}>
            {t('nav.login')}
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;