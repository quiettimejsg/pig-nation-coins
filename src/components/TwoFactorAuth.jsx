import { useState, useEffect, useRef } from 'react';
import '../styles/TwoFactorAuth.css';

const TwoFactorAuth = ({ onVerify, onCancel }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  
  // 聚焦第一个输入框
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  // 处理输入变化
  const handleChange = (index, value) => {
    // 只允许数字
    if (!/^\d*$/.test(value)) return;
    
    // 更新代码数组
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // 自动焦点到下一个输入框
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // 处理键盘事件
  const handleKeyDown = (index, e) => {
    // 处理删除键
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // 如果当前输入框为空，焦点返回上一个
        inputRefs.current[index - 1].focus();
      }
    }
    
    // 处理左右箭头导航
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // 处理粘贴事件
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // 检查是否是6位数字
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      
      // 焦点到最后一个输入框
      inputRefs.current[5].focus();
    }
  };
  
  // 处理提交
  const handleSubmit = () => {
    // 检查代码是否完整
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('请输入完整的6位验证码');
      return;
    }
    
    // 调用验证回调
    onVerify(fullCode);
  };
  
  return (
    <div className="two-factor-auth">
      <h2>两步验证</h2>
      <p className="instruction">
        请输入您的验证应用程序中显示的6位验证码
      </p>
      
      <div className="code-inputs">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : null}
            className="code-input"
            aria-label={`验证码第${index + 1}位`}
          />
        ))}
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="action-buttons">
        <button 
          onClick={handleSubmit}
          className="submit-button"
          disabled={code.join('').length !== 6}
        >
          验证
        </button>
        
        <button 
          onClick={onCancel}
          className="cancel-button"
        >
          取消
        </button>
      </div>
      
      <div className="help-text">
        <p>
          没有收到验证码？请检查您的验证器应用程序是否正确配置，
          或者联系管理员获取帮助。
        </p>
      </div>
    </div>
  );
};

export default TwoFactorAuth;