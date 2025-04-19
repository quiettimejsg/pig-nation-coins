import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from './store'
import { FaSun, FaMoon } from 'react-icons/fa'
import './App.css'
import './theme.css'
import BottomNav from './components/BottomNav';


export default function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [defaultBackground, setDefaultBackground] = useState(null);
  const { theme, toggleTheme, currentUser, logout } = useStore(state => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    currentUser: state.currentUser,
    logout: state.logout
  }));

  // 初始化主题
  useEffect(() => {
    // 从localStorage获取主题设置或使用系统默认
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    // 设置文档主题属性
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    // 如果存储的主题与当前应用主题不一致，更新状态
    if (theme !== initialTheme && toggleTheme) {
      toggleTheme(initialTheme);
    }
    
    // 生成默认背景，以防找不到背景图片
    generateDefaultBackground();
  }, []);

  // 生成默认渐变背景作为备用
  const generateDefaultBackground = () => {
    try {
      const width = 1920;
      const height = 1080;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // 创建渐变
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#8b5e3c');   // 棕色 - 猪币主题色
      gradient.addColorStop(0.5, '#d4b483'); // 金色
      gradient.addColorStop(1, '#8b5e3c');   // 棕色
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // 添加一些装饰元素 - 类似硬币的圆形
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 20 + Math.random() * 40;
        const opacity = 0.1 + Math.random() * 0.2;
        
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
        ctx.fill();
        
        // 添加内圆 - 模拟硬币内环
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 1.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // 将canvas转换为数据URL
      const bgImage = canvas.toDataURL('image/png');
      setDefaultBackground(bgImage);
      
      // 添加到CSS变量
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --default-bg-pc: ${bgImage};
          --default-bg-phone: ${bgImage};
        }
      `;
      document.head.appendChild(style);
    } catch (err) {
      console.error('生成默认背景失败:', err);
    }
  };

  // 检查背景图片是否存在
  useEffect(() => {
    // 尝试加载实际背景图
    const bgImgLoader = new Image();
    bgImgLoader.onload = () => {
      // 图片加载成功，更新CSS变量
      document.documentElement.style.setProperty('--background-image-desktop', 'url("/images/background-pc.jpg")');
      document.documentElement.style.setProperty('--background-image-mobile', 'url("/images/background-phone.jpeg")');
    };
    bgImgLoader.onerror = () => {
      // 图片加载失败，使用默认背景
      if (defaultBackground) {
        document.documentElement.style.setProperty('--background-image-desktop', `url(${defaultBackground})`);
        document.documentElement.style.setProperty('--background-image-mobile', `url(${defaultBackground})`);
      }
    };
    bgImgLoader.src = '/images/background-pc.jpg';
  }, [defaultBackground]);

  // 监听主题变化并更新DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 调试用：在组件加载时输出当前语言和翻译状态
  useEffect(() => {
    console.log('当前语言:', i18n.language);
    console.log('翻译测试:', t('login_page.title'));
    console.log('当前用户:', currentUser);
  }, [i18n.language, t, currentUser]);

  const changeLanguage = (lng) => {
    console.log('切换语言到:', lng);
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // 渲染所有导航链接，而不是基于条件
  const renderNavLinks = () => {
    return (
      <>
        <Link to="/" className="nav-link">
          {t('nav.login')}
        </Link>
        <Link to="/user" className="nav-link">
          {t('nav.user_panel')}
        </Link>
        <Link to="/merchant" className="nav-link">
          {t('nav.merchant_panel')}
        </Link>
        <Link to="/admin" className="nav-link">
          {t('nav.admin_panel')}
        </Link>
        <Link to="/payment" className="nav-link">
          {t('nav.payment')}
        </Link>
      </>
    );
  };

  return (
    <div className="app-container" data-theme={theme}>
      <div className="page-background"></div>
      
      <nav className="main-nav">
        <div className="nav-links">
          {renderNavLinks()}
        </div>
        
        <div className="nav-controls">
          <select 
            className="language-select"
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label={t('language.select')}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
          
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={t('theme.toggle')}
          >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          
          {currentUser && (
            <button 
              className="logout-button"
              onClick={handleLogout}
              aria-label={t('common.logout')}
            >
              {t('common.logout')}
            </button>
          )}
        </div>
      </nav>
      
      <main className="main-content">
        <Outlet />
      </main>
      
    </div>
  );
}