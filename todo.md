filePath: pig-nation-coins\src\store.js
          
当前`store.js`文件存在较多模拟实现和功能缺失，需要从以下几个方面进行真实实现改进：

### 一、核心问题分析
1. **模拟数据与API调用**：所有接口（登录/注册/验证等）均使用`setTimeout`模拟，无真实后端交互
2. **状态管理臃肿**：412行代码包含用户/交易/汇率/主题等多模块功能，违反300行拆分原则
3. **安全隐患**：密码明文存储在前端状态中，如`<mcsymbol name="users" filename="store.js" path="pig-nation-coins\src\store.js" startline="342" type="object"></mcsymbol>`
4. **数据持久化风险**：自定义存储函数存在循环引用处理不完善问题
5. **功能实现简陋**：二维码登录等功能依赖随机数模拟状态变化

### 二、重构与实现方案
#### 1. 模块化拆分（按功能域）
```
src/store/
├── index.js          # 组合模块出口
├── authStore.js      # 认证相关状态
├── userStore.js      # 用户信息管理
├── transactionStore.js # 交易记录管理
├── systemStore.js    # 主题/语言等系统设置
└── api/              # API服务层
    ├── auth.js       # 认证相关接口
    ├── user.js       # 用户相关接口
    └── transaction.js # 交易相关接口
```

#### 2. 真实API交互实现
- 创建API服务层封装后端请求：
```javascript
// src/store/api/auth.js
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const login = async (credentials) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  return response.data;
};

export const verifyTotp = async (username, totpCode) => {
  const response = await axios.post(`${API_BASE_URL}/auth/verify-totp`, {
    username, totpCode
  });
  return response.data;
};
```

#### 3. 安全改进
- 移除前端密码存储，仅保留认证令牌
- 实现JWT令牌管理：
```javascript
// authStore.js
const login = async (credentials) => {
  set({ loading: true });
  try {
    const { token, user } = await authApi.login(credentials);
    localStorage.setItem('auth_token', token);
    set({ currentUser: user, token });
    return user;
  } finally { ... }
};
```

#### 4. 二维码登录真实实现
- 使用WebSocket建立实时连接：
```javascript
// authStore.js
initiateQrLogin: async () => {
  const { qrId, qrUrl } = await authApi.initQrLogin();
  const socket = new WebSocket(`${WS_BASE_URL}/qr-login/${qrId}`);
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.status === 'success') {
      set({ currentUser: data.user });
    }
  };
  return { qrUrl };
};
```

#### 5. 数据持久化优化
- 使用zustand-persist官方推荐配置：
```javascript
// 移除自定义存储函数，使用内置持久化
persist(
  (set, get) => ({ ... }),
  {
    name: 'app-storage',
    partialize: (state) => ({ ...state, users: undefined }), // 不持久化敏感数据
  }
)
```

### 三、实施步骤
1. 按功能模块拆分store
2. 实现API服务层对接后端
3. 重构认证流程与安全存储
4. 实现真实业务逻辑（交易/汇率等）
5. 添加完善的错误处理与日志
6. 引入TypeScript类型定义确保类型安全

建议优先处理认证模块和安全问题，再逐步实现其他业务功能。
        