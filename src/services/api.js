// API服务基础配置
const API_BASE_URL = 'https://api.example.com';

// 简单封装fetch API
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });
    
    // 如果响应不成功，抛出错误
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败: ${response.status}`);
    }
    
    // 如果响应是204 No Content，直接返回true
    if (response.status === 204) {
      return true;
    }
    
    // 尝试解析JSON响应
    return await response.json();
  } catch (error) {
    console.error('API 请求错误:', error);
    throw error;
  }
};

// API方法
export const api = {
  // 用户认证相关
  auth: {
    login: (credentials) => 
      fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    
    verifyTwoFactor: (code) => 
      fetchWithAuth('/auth/two-factor', {
        method: 'POST',
        body: JSON.stringify({ code })
      }),
    
    logout: () => 
      fetchWithAuth('/auth/logout', {
        method: 'POST'
      }),
    
    refreshToken: () => 
      fetchWithAuth('/auth/refresh', {
        method: 'POST'
      })
  },
  
  // 用户设备管理
  devices: {
    getAll: () => 
      fetchWithAuth('/devices'),
    
    update: (deviceId, data) => 
      fetchWithAuth(`/devices/${deviceId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    
    remove: (deviceId) => 
      fetchWithAuth(`/devices/${deviceId}`, {
        method: 'DELETE'
      })
  },
  
  // 二维码登录
  qrLogin: {
    generate: () => 
      fetchWithAuth('/auth/qr/generate', {
        method: 'POST'
      }),
    
    check: (token) => 
      fetchWithAuth('/auth/qr/check', {
        method: 'POST',
        body: JSON.stringify({ token })
      })
  }
};

// 拦截器函数 - 可以在实际项目中扩展
export const setupInterceptors = (onUnauthorized) => {
  // 实现请求拦截器等功能
  console.log('API 拦截器已设置');
}; 