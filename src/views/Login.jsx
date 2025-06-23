import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { FaKey, FaUser, FaQrcode, FaArrowRight, FaArrowLeft, FaRedo, FaSun, FaMoon, FaUserPlus } from 'react-icons/fa';
import LoadingOverlay from '../components/LoadingOverlay.jsx';

// 登录步骤
const LOGIN_STEPS = {
  USERNAME: 'username',
  TOTP_VERIFY: 'totp_verify',
  QR_LOGIN: 'qr_login',
  REGISTER: 'register'
};

export default function Login() {
  const [formData, setFormData] = useState({ 
    username: '', 
    totpCode: '', 
    password: '',
    confirmPassword: '',
    role: 'user' 
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(LOGIN_STEPS.USERNAME);
  const [qrLoginUrl, setQrLoginUrl] = useState('');
  const [showQrLogin, setShowQrLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrStatus, setQrStatus] = useState('pending'); // pending, scanned, success
  const qrCodePollingRef = useRef(null);
  
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const { login, register, verifyUser, verifyTotp, initiateQrLogin, checkQrLoginStatus, theme, toggleTheme } = useStore(state => ({
    login: state.login,
    register: state.register || ((userData) => Promise.resolve({...userData, id: Date.now()})),
    verifyUser: state.verifyUser || (() => Promise.resolve(true)),
    verifyTotp: state.verifyTotp || (() => Promise.resolve(true)),
    initiateQrLogin: state.initiateQrLogin || (() => Promise.resolve({ qrCode: 'demo-code' })),
    checkQrLoginStatus: state.checkQrLoginStatus || (() => Promise.resolve({ status: 'pending' })),
    theme: state.theme,
    toggleTheme: state.toggleTheme,
  }));
  
  // 当前步骤标题
  const stepTitles = {
    [LOGIN_STEPS.USERNAME]: t('login.title_username'), 
    [LOGIN_STEPS.TOTP_VERIFY]: t('login.title_verification'),
    [LOGIN_STEPS.QR_LOGIN]: t('login.title_qr_login'),
    [LOGIN_STEPS.REGISTER]: t('login.title_register')
  };
  
  // 使用全局状态中的主题切换
  const handleThemeToggle = () => {
    toggleTheme();
  };

  // 初始化QR登录
  useEffect(() => {
    if (step === LOGIN_STEPS.QR_LOGIN) {
      initQrLogin();
    } else {
      // 清除轮询
      if (qrCodePollingRef.current) {
        clearInterval(qrCodePollingRef.current);
        qrCodePollingRef.current = null;
      }
    }
    
    return () => {
      if (qrCodePollingRef.current) {
        clearInterval(qrCodePollingRef.current);
        qrCodePollingRef.current = null;
      }
    };
  }, [step]);
  
  // 初始化二维码登录
  const initQrLogin = async () => {
    try {
      setLoading(true);
      setQrStatus('pending');
      
      // 获取二维码
      const result = await initiateQrLogin();
      setQrLoginUrl(`pigcoin://qr-login/${result.qrCode}`);
      
      // 开始轮询状态
      startQrStatusPolling(result.qrCode);
    } catch (error) {
      console.error('QR码初始化失败:', error);
      setErrors({ submit: t('login.qr_init_failed') });
    } finally {
      setLoading(false);
    }
  };
  
  // 轮询二维码状态
  const startQrStatusPolling = (qrCode) => {
    if (qrCodePollingRef.current) {
      clearInterval(qrCodePollingRef.current);
    }
    
    qrCodePollingRef.current = setInterval(async () => {
      try {
        const result = await checkQrLoginStatus(qrCode);
        setQrStatus(result.status);
        
        if (result.status === 'success') {
          clearInterval(qrCodePollingRef.current);
          qrCodePollingRef.current = null;
          
          // 记录设备信息 - 只存储必要的简单数据结构
          const deviceInfo = {
            deviceId: result.deviceId || 'current-device',
            lastLogin: new Date().toISOString()
          };
          
          // 使用try-catch包裹JSON序列化以防止错误
          try {
            localStorage.setItem('trusted_device', JSON.stringify(deviceInfo));
          } catch (error) {
            console.error('存储设备信息失败:', error);
            // 失败时使用备选方案存储最小必要信息
            localStorage.setItem('trusted_device_id', result.deviceId || 'current-device');
            localStorage.setItem('trusted_device_last_login', new Date().toISOString());
          }
          
          // 模拟成功登录后的导航
          setTimeout(() => {
            navigate(result.role ? `/${result.role}` : '/user');
          }, 1000);
        }
      } catch (error) {
        console.error('检查QR状态失败:', error);
      }
    }, 2000);
  };
  
  // 处理QR登录成功
  const handleQrLoginSuccess = () => {
    // 记录设备信息 - 只存储必要的简单数据结构
    const deviceInfo = {
      deviceId: 'current-device',
      lastLogin: new Date().toISOString()
    };
    
    // 使用try-catch包裹JSON序列化以防止错误
    try {
      localStorage.setItem('trusted_device', JSON.stringify(deviceInfo));
    } catch (error) {
      console.error('存储设备信息失败:', error);
      // 失败时使用备选方案存储最小必要信息
      localStorage.setItem('trusted_device_id', 'current-device');
      localStorage.setItem('trusted_device_last_login', new Date().toISOString());
    }
    
    // 导航到用户主页
    setTimeout(() => {
      navigate('/user');
    }, 1000);
  };
  
  const updateForm = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  // 验证表单字段
  const validateForm = () => {
    const newErrors = {};
    
    switch(step) {
      case LOGIN_STEPS.USERNAME:
        if (!formData.username) newErrors.username = t('login.username_required');
        break;
      case LOGIN_STEPS.TOTP_VERIFY:
        if (!formData.totpCode) newErrors.totpCode = t('login.totp_required');
        else if (formData.totpCode.length !== 6) newErrors.totpCode = t('login.totp_length_error');
        break;
      case LOGIN_STEPS.REGISTER:
        if (!formData.username) newErrors.username = t('login.username_required');
        if (!formData.password) newErrors.password = t('login.password_required');
        if (!formData.confirmPassword) newErrors.confirmPassword = t('login.confirm_password_required');
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = t('login.passwords_not_match');
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 处理下一步或提交
  const handleNextStep = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      switch(step) {
        case LOGIN_STEPS.USERNAME:
          // 验证用户名存在 - 实际应用中应调用API
          const exists = await verifyUser(formData.username);
          if (exists) {
            setStep(LOGIN_STEPS.TOTP_VERIFY);
          } else {
            throw new Error(t('login.user_not_found'));
          }
          break;
          
        case LOGIN_STEPS.TOTP_VERIFY:
          // 验证TOTP并完成登录
          const isValid = await verifyTotp(formData.username, formData.totpCode);
          
          if (!isValid) {
            throw new Error(t('login.totp_invalid'));
          }
          
          // 登录成功
          const user = await login({
            username: formData.username,
            totpCode: formData.totpCode
          });
          
          // 记录设备信息 - 只存储必要的简单数据结构
          const deviceInfo = {
            deviceId: 'current-device',
            lastLogin: new Date().toISOString()
          };
          
          // 使用try-catch包裹JSON序列化以防止错误
          try {
            localStorage.setItem('trusted_device', JSON.stringify(deviceInfo));
          } catch (error) {
            console.error('存储设备信息失败:', error);
            // 失败时使用备选方案存储最小必要信息
            localStorage.setItem('trusted_device_id', 'current-device');
            localStorage.setItem('trusted_device_last_login', new Date().toISOString());
          }
          
          // 导航到相应页面
          navigate(user?.role ? `/${user.role}` : '/user');
          break;
          
        case LOGIN_STEPS.REGISTER:
          // 注册新用户
          const newUser = await register({
            username: formData.username,
            password: formData.password,
            role: formData.role || 'user',
            balance: 0
          });
          
          // 注册成功后自动登录
          if (newUser) {
            alert(t('login.register_success'));
            // 重置表单并返回登录
            setFormData({...formData, password: '', confirmPassword: ''});
            setStep(LOGIN_STEPS.USERNAME);
          } else {
            throw new Error(t('login.register_failed'));
          }
          break;
      }
    } catch (error) {
      setErrors({ 
        submit: error.message || t('login.login_failed')
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 切换到QR码登录
  const toggleQrLogin = () => {
    if (showQrLogin) {
      setStep(LOGIN_STEPS.USERNAME);
      setShowQrLogin(false);
    } else {
      setStep(LOGIN_STEPS.QR_LOGIN);
      setShowQrLogin(true);
    }
  };
  
  // 切换到注册页面
  const toggleRegister = () => {
    if (step === LOGIN_STEPS.REGISTER) {
      setStep(LOGIN_STEPS.USERNAME);
    } else {
      setStep(LOGIN_STEPS.REGISTER);
      setShowQrLogin(false);
    }
  };
  
  // 渲染当前步骤的内容
  const renderStepContent = () => {
    switch (step) {
      case LOGIN_STEPS.USERNAME:
        return (
          <div className="login-step username-step slide-in-up">
            <div className="input-container">
              <div className="input-group centered-input">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={e => updateForm('username', e.target.value)}
                  placeholder={t('login.username_placeholder')}
                  className={errors.username ? 'error' : ''}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="next-button inline-button"
                  disabled={loading}
                >
                  {loading ? <LoadingOverlay visible={true} /> : <FaArrowRight />}
                </button>
              </div>
              {errors.username && <div className="field-error">{errors.username}</div>}
            </div>
          </div>
        );
      
      case LOGIN_STEPS.TOTP_VERIFY:
        return (
          <div className="login-step totp-step slide-in-up">
            <div className="user-info">
              <button type="button" className="back-button arrow-button" onClick={() => setStep(LOGIN_STEPS.USERNAME)}>
                <FaArrowLeft />
              </button>
              <span className="username">{formData.username}</span>
            </div>
            
            <div className="input-container">
              <div className="input-group centered-input">
                <FaKey className="input-icon" />
                <input
                  type="text"
                  name="totpCode"
                  value={formData.totpCode}
                  onChange={e => updateForm('totpCode', e.target.value.replace(/\D/g, ''))}
                  placeholder={t('login.totp_placeholder')}
                  className={errors.totpCode ? 'error' : ''}
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="next-button inline-button"
                  disabled={loading}
                >
                  {loading ? <LoadingOverlay visible={true} /> : <FaArrowRight />}
                </button>
              </div>
              {errors.totpCode && <div className="field-error">{errors.totpCode}</div>}
            </div>
          </div>
        );
        
      case LOGIN_STEPS.QR_LOGIN:
        return (
          <div className="qr-login-container stagger-item">
            <div className={`qr-code-wrapper ${qrStatus === 'scanned' ? 'scanned' : ''}`}>
              {loading ? (
                <LoadingOverlay visible={true} />
              ) : (
                <>
                  <QRCode 
                    value={qrLoginUrl || 'https://example.com'} 
                    size={200} 
                    level="H"
                    includeMargin={true}
                    renderas="svg"
                    className="qr-code"
                  />
                  {qrStatus === 'scanned' && (
                    <div className="qr-scanned-overlay">
                      <p>{t('login.qr_scanned')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="qr-login-hint stagger-item">
              {t('login.qr_scan_hint')}
            </p>
            <button 
              type="button" 
              className="refresh-qr-btn stagger-item" 
              onClick={initQrLogin}
              disabled={loading || qrStatus === 'success'}
            >
              <FaRedo /> {t('login.refresh_qr')}
            </button>
          </div>
        );

      case LOGIN_STEPS.REGISTER:
        return (
          <div className="login-step register-step slide-in-up">
            <div className="input-container register-input-container">
              <div className="input-group">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={e => updateForm('username', e.target.value)}
                  placeholder={t('login.username_placeholder')}
                  className={errors.username ? 'error' : ''}
                  autoFocus
                />
              </div>
              {errors.username && <div className="field-error">{errors.username}</div>}
              
              <div className="input-group">
                <FaKey className="input-icon" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={e => updateForm('password', e.target.value)}
                  placeholder={t('login.password_placeholder')}
                  className={errors.password ? 'error' : ''}
                />
              </div>
              {errors.password && <div className="field-error">{errors.password}</div>}
              
              <div className="input-group">
                <FaKey className="input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={e => updateForm('confirmPassword', e.target.value)}
                  placeholder={t('login.confirm_password_placeholder')}
                  className={errors.confirmPassword ? 'error' : ''}
                />
              </div>
              {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
              
              <div className="role-selection">
                <label>{t('login.select_role')}</label>
                <select 
                  name="role" 
                  value={formData.role}
                  onChange={e => updateForm('role', e.target.value)}
                >
                  <option value="user">{t('login.role_user')}</option>
                  <option value="merchant">{t('login.role_merchant')}</option>
                </select>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="register-button"
              disabled={loading}
            >
              {loading ? t('login.processing') : t('login.register_button')}
            </button>
          </div>
        );
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <div className="login-card fade-in">
        <h2 className="slide-in-up">{stepTitles[step]}</h2>
        
        {errors.submit && <div className="error-message slide-in-up">{errors.submit}</div>}
        
        <form onSubmit={handleNextStep} className="login-form">
          {renderStepContent()}
        </form>
        
        <div className="login-options slide-in-up">
          {step !== LOGIN_STEPS.REGISTER && (
            <button 
              type="button" 
              className="toggle-qr-login"
              onClick={toggleQrLogin}
            >
              {showQrLogin 
                ? t('login.use_totp_login') 
                : <><FaQrcode style={{marginRight: '8px'}} /> {t('login.use_qr_login')}</>}
            </button>
          )}
          
          <button 
            type="button" 
            className={step === LOGIN_STEPS.REGISTER ? "toggle-login" : "toggle-register"}
            onClick={toggleRegister}
          >
            {step === LOGIN_STEPS.REGISTER 
              ? t('login.already_have_account') 
              : <><FaUserPlus style={{marginRight: '8px'}} /> {t('login.no_account_register')}</>}
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .register-step {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-left: 20px;
        }
        
        .register-input-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
          width: 100%;
          max-width: 320px;
        }
        
        .register-button {
          width: 100%;
          max-width: 320px;
          padding: 12px;
          background-color: var(--primary-color, #8b5e3c);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 10px;
        }
        
        .register-button:hover:not(:disabled) {
          background-color: var(--primary-color-dark, #6b4e2c);
        }
        
        .register-button:disabled {
          background-color: var(--disabled-color, #cccccc);
          cursor: not-allowed;
        }
        
        .role-selection {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        
        .role-selection label {
          font-size: 14px;
          color: var(--text-secondary, #666666);
        }
        
        .role-selection select {
          padding: 10px;
          border-radius: 4px;
          border: 1px solid var(--border-color, #ccc);
          background-color: var(--input-bg, #ffffff);
          color: var(--text-primary, #333333);
          width: 100%;
        }
        
        .toggle-register, .toggle-login {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
          border-radius: 20px;
          color: var(--primary-color, #8b5e3c);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 15px;
          transition: all 0.2s ease;
          background-color: var(--button-bg, rgba(255, 255, 255, 0.9));
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .toggle-register:hover, .toggle-login:hover {
          color: var(--primary-color-dark, #6b4e2c);
          background-color: var(--button-bg-hover, rgba(255, 255, 255, 1));
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
        }
        
        .login-options {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          gap: 15px;
        }
        
        /* 美化输入框和提示文字样式 */
        .input-group {
          position: relative;
          margin-bottom: 5px;
          transition: all 0.3s ease;
        }
        
        .input-group input {
          width: 100%;
          padding: 12px 15px 12px 40px;
          padding-right: 50px;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
          border-radius: 8px;
          background-color: var(--input-bg, rgba(255, 255, 255, 0.8));
          color: var(--text-primary, #333);
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .input-group input:focus {
          outline: none;
          border-color: var(--primary-color, #8b5e3c);
          box-shadow: 0 0 0 2px rgba(139, 94, 60, 0.2);
          background-color: var(--input-bg-focus, #fff);
        }
        
        /* 占位符文本样式 */
        .input-group input::placeholder {
          color: var(--placeholder-color, #aaa);
          font-style: italic;
          transition: all 0.3s ease;
          opacity: 0.7;
        }
        
        .input-group input:focus::placeholder {
          opacity: 0.5;
          transform: translateY(-2px);
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--icon-color, #999);
          font-size: 18px;
          transition: all 0.3s ease;
        }
        
        .input-group input:focus + .input-icon,
        .input-group:hover .input-icon {
          color: var(--primary-color, #8b5e3c);
        }
        
        .input-group.centered-input {
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        
        /* 错误状态 */
        .input-group input.error {
          border-color: var(--error-color, #e53935);
          background-color: rgba(229, 57, 53, 0.05);
        }
        
        .field-error {
          font-size: 13px;
          color: var(--error-color, #e53935);
          margin-top: 5px;
          padding-left: 5px;
          animation: errorShake 0.4s ease;
        }
        
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        
        /* 下拉框样式 */
        .role-selection select {
          padding: 12px 15px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238b5e3c'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 20px;
          padding-right: 40px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .role-selection select:focus {
          outline: none;
          border-color: var(--primary-color, #8b5e3c);
          box-shadow: 0 0 0 2px rgba(139, 94, 60, 0.2);
        }
        
        /* 修改按钮优化 */
        .back-button {
          background: none;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
          border-radius: 15px;
          color: var(--primary-color, #8b5e3c);
          padding: 5px 10px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          background-color: var(--button-bg, rgba(255, 255, 255, 0.8));
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .back-button.arrow-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          padding: 0;
          color: white;
          background-color: var(--primary-color, #8b5e3c);
          box-shadow: 0 2px 6px rgba(139, 94, 60, 0.2);
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 0;
          z-index: 2;
        }
        
        .back-button.arrow-button:hover {
          background-color: var(--primary-color-light, #a17649);
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 2px 8px rgba(139, 94, 60, 0.3);
        }
        
        .back-button:hover {
          background-color: var(--button-bg-hover, rgba(255, 255, 255, 1));
          color: var(--primary-color-dark, #6b4e2c);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }
        
        .back-button:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .back-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(139, 94, 60, 0.3);
        }
        
        /* 下一步按钮优化 */
        .next-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--primary-color, #8b5e3c);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
          margin-top: 15px;
          box-shadow: 0 3px 10px rgba(139, 94, 60, 0.3);
          will-change: transform;
          -webkit-tap-highlight-color: transparent;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        
        .next-button.inline-button {
          width: 36px;
          height: 36px;
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%) translateZ(0);
          margin-top: 0;
          box-shadow: 0 2px 6px rgba(139, 94, 60, 0.2);
          z-index: 2;
        }
        
        .next-button:hover:not(:disabled),
        .back-button.arrow-button:hover {
          background-color: var(--primary-color-light, #a17649);
          box-shadow: 0 3px 12px rgba(139, 94, 60, 0.4);
        }
        
        .next-button:hover:not(:disabled) {
          animation: none;
        }
        
        .next-button.inline-button:hover:not(:disabled) {
          transform: translateY(-50%) translateZ(0);
        }
        
        .next-button:active:not(:disabled),
        .back-button.arrow-button:active {
          background-color: var(--primary-color, #8b5e3c);
          box-shadow: 0 2px 5px rgba(139, 94, 60, 0.3);
        }
        
        .next-button:active:not(:disabled) {
          animation: button-press-scale-only 0.4s ease forwards;
        }
        
        .next-button.inline-button:active:not(:disabled) {
          animation: button-press-scale-only 0.4s ease forwards;
        }
        
        /* 用户名步骤下的下一步按钮不使用任何动画或过渡 */
        .username-step .next-button:active:not(:disabled) {
          animation: none !important;
          transition: none !important;
          transform: none !important;
        }
        
        /* 用户名步骤下的内联下一步按钮不使用任何动画或过渡 */
        .username-step .next-button.inline-button:active:not(:disabled) {
          animation: none !important;
          transition: none !important;
          transform: none !important;
        }
        
        .back-button.arrow-button:active {
          animation: button-press-scale-only 0.4s ease forwards;
          transform: translateY(-50%);
        }
        
        @keyframes button-press {
          0% { transform: scale(1) translateZ(0); }
          25% { transform: scale(0.85) translateZ(0); }
          75% { transform: scale(1.08) translateZ(0); }
          100% { transform: scale(1) translateZ(0); }
        }
        
        /* 仅缩放的按压动画，用于所有按钮 */
        @keyframes button-press-scale-only {
          0% { transform: translateY(-50%) scale(1) translateZ(0); }
          25% { transform: translateY(-50%) scale(0.85) translateZ(0); }
          75% { transform: translateY(-50%) scale(1.08) translateZ(0); }
          100% { transform: translateY(-50%) scale(1) translateZ(0); }
        }
        
        /* 用户名和修改按钮调整 */
        .user-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          margin-top: 10px;
          position: relative;
          width: 100%;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
          padding: 0 36px;
        }
        
        .username {
          font-weight: 500;
          color: var(--text-primary, #333);
          background-color: var(--highlight-bg, rgba(139, 94, 60, 0.1));
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 14px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
  .refresh-qr-btn.stagger-item {
    padding: 10px 20px;
    background-color: var(--primary-color, #8b5e3c);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 15px;
  }

  .refresh-qr-btn.stagger-item:hover:not(:disabled) {
    background-color: var(--primary-color-dark, #6b4e2c);
  }

  .refresh-qr-btn.stagger-item:disabled {
    background-color: var(--disabled-color, #cccccc);
    cursor: not-allowed;
  }

  /* 暗黑模式适配 */
  [data-theme="dark"] .refresh-qr-btn.stagger-item {
    background-color: var(--primary-color, #8b5e3c);
  }

  [data-theme="dark"] .refresh-qr-btn.stagger-item:hover:not(:disabled) {
    background-color: var(--primary-color-dark, #6b4e2c);
  }

  [data-theme="dark"] .refresh-qr-btn.stagger-item:disabled {
    background-color: var(--disabled-color-dark, #555555);
  }
        
        /* 暗黑模式适配 */
        [data-theme="dark"] .back-button {
          background-color: var(--button-bg-dark, rgba(30, 30, 30, 0.6));
          border-color: var(--border-color-dark, rgba(255, 255, 255, 0.1));
          color: var(--primary-color-light, #c9a87c);
        }
        
        [data-theme="dark"] .back-button.arrow-button {
          background-color: var(--primary-color, #8b5e3c);
          color: white;
        }
        
        [data-theme="dark"] .back-button.arrow-button:hover {
          background-color: var(--primary-color-light, #c9a87c);
        }
        
        [data-theme="dark"] .back-button:hover {
          background-color: var(--button-bg-dark-hover, rgba(50, 50, 50, 0.8));
          color: var(--primary-color-lighter, #e5d3b5);
        }
        
        [data-theme="dark"] .next-button {
          background-color: var(--primary-color, #8b5e3c);
        }
        
        [data-theme="dark"] .next-button:hover:not(:disabled) {
          background-color: var(--primary-color-dark, #6b4e2c);
        }
        
        [data-theme="dark"] .username {
          color: var(--text-primary-dark, #e0e0e0);
          background-color: var(--highlight-bg-dark, rgba(201, 168, 124, 0.15));
        }

        [data-theme="dark"] .toggle-register, [data-theme="dark"] .toggle-login {
          color: var(--primary-color-light, #c9a87c);
          background-color: var(--button-bg-dark, rgba(30, 30, 30, 0.6));
          border-color: var(--border-color-dark, rgba(255, 255, 255, 0.1));
        }
        
        [data-theme="dark"] .toggle-register:hover, [data-theme="dark"] .toggle-login:hover {
          color: var(--primary-color-lighter, #e5d3b5);
          background-color: var(--button-bg-dark-hover, rgba(50, 50, 50, 0.8));
        }
         
        [data-theme="dark"] .input-group input {
          background-color: var(--input-bg-dark, rgba(30, 30, 30, 0.6));
          border-color: var(--border-color-dark, rgba(255, 255, 255, 0.1));
          color: var(--text-primary-dark, #e0e0e0);
        }
        
        [data-theme="dark"] .input-group input:focus {
          background-color: var(--input-bg-dark-focus, rgba(40, 40, 40, 0.8));
          border-color: var(--primary-color-light, #c9a87c);
          box-shadow: 0 0 0 2px rgba(201, 168, 124, 0.2);
        }
        
        [data-theme="dark"] .input-group input::placeholder {
          color: var(--placeholder-color-dark, #888);
        }
        
        [data-theme="dark"] .input-icon {
          color: var(--icon-color-dark, #888);
        }
        
        [data-theme="dark"] .input-group input:focus + .input-icon,
        [data-theme="dark"] .input-group:hover .input-icon {
          color: var(--primary-color-light, #c9a87c);
        }
        
        [data-theme="dark"] .role-selection select {
          background-color: var(--input-bg-dark, rgba(30, 30, 30, 0.6));
          border-color: var(--border-color-dark, rgba(255, 255, 255, 0.1));
          color: var(--text-primary-dark, #e0e0e0);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c9a87c'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        }
        
        [data-theme="dark"] .role-selection select:focus {
          border-color: var(--primary-color-light, #c9a87c);
          box-shadow: 0 0 0 2px rgba(201, 168, 124, 0.2);
        }

        /* 加载动画 */
        .loading-dot {
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}