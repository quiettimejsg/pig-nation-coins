import React from 'react';
import './Register.css';

export default function Register() {
  return (
    <div className="register-container">
      <div className="role-selector-container">
        <div className="role-option">
          <img src="/assets/user-icon.png" className="option-icon" alt="user" />
          <span className="option-label">普通用户</span>
        </div>
        <div className="role-option">
          <img src="/assets/merchant-icon.png" className="option-icon" alt="merchant" />
          <span className="option-label">商家用户</span>
        </div>
      </div>
    </div>
  );
}