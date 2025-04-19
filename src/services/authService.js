import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'auth_token';
const DEVICE_ID_KEY = 'device_id';

// 获取或创建设备ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// 获取设备信息
const getDeviceInfo = () => {
  return {
    deviceId: getDeviceId(),
    deviceName: navigator.userAgent,
    platform: navigator.platform,
    lastLogin: new Date().toISOString()
  };
};

class AuthService {
  // 用户登录
  async login(username, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username, 
        password,
        deviceId: getDeviceId()
      });
      
      if (response.data.requireTwoFactor) {
        return { requireTwoFactor: true };
      }
      
      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: '登录失败，请稍后再试' };
    }
  }
  
  // 验证2FA代码
  async verifyTwoFactor(username, twoFactorCode) {
    try {
      const deviceInfo = getDeviceInfo();
      const response = await axios.post(`${API_URL}/auth/verify-2fa`, {
        username,
        twoFactorCode,
        deviceInfo
      });
      
      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: '验证失败，请稍后再试' };
    }
  }
  
  // 请求发送二步验证码
  async requestTwoFactorCode(username) {
    try {
      const response = await axios.post(`${API_URL}/auth/request-2fa`, { username });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: '发送验证码失败' };
    }
  }
  
  // 开始QR码登录
  async initiateQrLogin() {
    try {
      const deviceInfo = getDeviceInfo();
      const response = await axios.post(`${API_URL}/auth/qr-login/initiate`, {
        deviceInfo
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'QR码登录初始化失败' };
    }
  }
  
  // 生成QR码登录
  async generateQrLogin() {
    try {
      const deviceInfo = getDeviceInfo();
      const response = await axios.post(`${API_URL}/auth/generate-qr`, { deviceInfo });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: '生成QR码失败' };
    }
  }
  
  // 验证QR码登录
  async verifyQrLogin(qrToken) {
    try {
      const deviceInfo = getDeviceInfo();
      const response = await axios.post(`${API_URL}/auth/verify-qr`, {
        qrToken,
        deviceInfo
      });
      
      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'QR码验证失败' };
    }
  }
  
  // 检查QR码状态
  async checkQrStatus(qrToken) {
    try {
      const response = await axios.get(`${API_URL}/auth/qr-login/status/${qrToken}`);
      
      if (response.data.status === 'authenticated' && response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: '无法检查QR码状态' };
    }
  }
  
  // 退出登录
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
  }
  
  // 获取当前用户信息
  getCurrentUser() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        return jwt_decode(token);
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  // 检查是否已认证
  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    try {
      const decoded = jwt_decode(token);
      // 检查令牌是否过期
      if (decoded.exp * 1000 < Date.now()) {
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // 获取授权头部
  getAuthHeader() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
  
  // 获取用户可信设备列表
  async getTrustedDevices() {
    try {
      const response = await axios.get(`${API_URL}/user/devices`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: '获取设备列表失败' };
    }
  }
  
  // 移除可信设备
  async removeTrustedDevice(deviceId) {
    try {
      const response = await axios.delete(`${API_URL}/user/devices/${deviceId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: '移除设备失败' };
    }
  }
  
  // 移除设备（兼容另一个API端点）
  async removeDevice(deviceId) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.delete(`${API_URL}/auth/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: '移除设备失败' };
    }
  }
}

export default new AuthService(); 