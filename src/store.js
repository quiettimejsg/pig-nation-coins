import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { i18n } from './utils/i18n'

// 自定义存储函数，排除循环引用
const customStorage = {
  getItem: (name) => {
    try {
      const value = localStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('读取存储数据失败:', error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      // 使用更安全的方法处理循环引用和DOM元素
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          // 排除DOM元素和React相关属性
          if (typeof value === 'object' && value !== null) {
            // 排除DOM元素
            if (value instanceof Element || 
                value instanceof HTMLElement ||
                value instanceof Node) {
              return undefined;
            }
            
            // 排除React内部属性和其他可能造成问题的属性
            if (key.startsWith('__') || 
                key.startsWith('_react') || 
                key === 'dom' || 
                key === 'parent' ||
                key === 'element' ||
                key === 'ref') {
              return undefined;
            }
            
            // 检测循环引用
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          
          // 对Date对象特殊处理
          if (value instanceof Date) {
            return value.toISOString();
          }
          
          return value;
        };
      };
      
      const sanitizedValue = JSON.stringify(value, getCircularReplacer());
      localStorage.setItem(name, sanitizedValue);
    } catch (error) {
      console.error('存储数据失败:', error);
      // 备用方案：尝试存储更简单的数据
      try {
        const simplifiedValue = {
          theme: value.theme,
          currentLanguage: value.currentLanguage,
          // 只保留用户的基本信息
          users: value.users ? Object.entries(value.users).reduce((acc, [key, user]) => {
            acc[key] = {
              id: user.id,
              username: user.username,
              role: user.role,
              balance: user.balance
            };
            return acc;
          }, {}) : {},
          // 简化交易数据
          transactions: (value.transactions || []).map(tx => ({
            id: tx.id,
            timestamp: tx.timestamp,
            type: tx.type,
            username: tx.username,
            amount: tx.amount
          }))
        };
        localStorage.setItem(name, JSON.stringify(simplifiedValue));
      } catch (backupError) {
        console.error('备用存储也失败:', backupError);
      }
    }
  },
  removeItem: (name) => localStorage.removeItem(name)
};

export const useStore = create(
  persist(
    (set, get) => ({
      currentUser: null,

      // 状态水合方法
      _hasHydrated: false,
      hydrate: async () => {
        try {
          const savedState = localStorage.getItem('app-storage');
          if (savedState) {
            set(JSON.parse(savedState));
          }
        } catch (error) {
          console.error('状态恢复失败:', error);
        }
        useStore.setState({ _hasHydrated: true });
      },
      theme: 'light',
      currentLanguage: 'zh',
      setLanguage: (lang) => set({ currentLanguage: lang }),
      toggleTheme: (newTheme) => {
        // 如果传入了明确的主题值，使用该值；否则切换主题
        const updatedTheme = newTheme || (get().theme === 'light' ? 'dark' : 'light');
        set({ theme: updatedTheme });
        // 更新HTML元素的data-theme属性
        document.documentElement.setAttribute('data-theme', updatedTheme);
        return updatedTheme;
      },
      
      // 验证用户是否存在
      verifyUser: async (username) => {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 在实际应用中，这里应该调用API检查用户是否存在
        const users = get().users;
        
        // 测试模式：任何用户名都可以通过
        if (process.env.NODE_ENV === 'development') {
          return true;
        }
        
        return users && Object.values(users).some(u => u.username === username);
      },
      
      // 验证TOTP代码
      verifyTotp: async (username, totpCode) => {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // 测试模式：任何6位数字都可以通过
        if (process.env.NODE_ENV === 'development') {
          return /^\d{6}$/.test(totpCode);
        }
        
        // 实际应用中，这里应该调用后端API验证TOTP代码
        return true;
      },
      
      // 注册新用户
      register: async (userData) => {
        set({ loading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 700));
          
          // 验证用户名是否已存在
          const users = get().users;
          const exists = users && Object.values(users).some(u => u.username === userData.username);
          
          if (exists) {
            throw new Error('用户名已存在，请选择其他用户名');
          }
          
          // 创建新用户
          const newUser = {
            id: Date.now(),
            username: userData.username,
            password: userData.password,
            role: userData.role || 'user',
            balance: userData.balance || 0
          };
          
          // 添加用户到用户列表
          set(state => ({
            users: {
              ...state.users,
              [userData.username]: newUser
            }
          }));
          
          console.log('用户注册成功:', newUser);
          return newUser;
        } catch (error) {
          console.error('注册错误:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      // 初始化二维码登录
      initiateQrLogin: async () => {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 生成随机二维码token
        const qrCode = `qr-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        
        return { qrCode };
      },
      
      // 检查二维码状态
      checkQrLoginStatus: async (qrCode) => {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 在真实应用中，这应该从后端获取二维码的当前状态
        // 模拟随机状态变化：10%的概率为扫描状态，5%的概率为成功状态
        const random = Math.random();
        if (random < 0.05) {
          // 模拟登录成功
          const testUser = {
            id: 888,
            username: 'qr-user',
            role: 'user',
            balance: 500
          };
          
          // 添加到用户列表并设置为当前用户
          set(state => ({
            users: {
              ...state.users,
              'qr-user': testUser
            },
            currentUser: testUser
          }));
          
          return { 
            status: 'success',
            deviceId: `device-${Date.now()}`,
            role: 'user'
          };
        } else if (random < 0.15) {
          return { status: 'scanned' };
        } else {
          return { status: 'pending' };
        }
      },
      
      // 登录功能
      login: async (credentials) => {
        set({ loading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const users = get().users;
          
          // 检查是否使用TOTP登录
          if (credentials.totpCode) {
            // 在实际应用中，应该调用API验证用户名和TOTP
            // 测试模式：允许任何用户名和6位TOTP通过
            if (process.env.NODE_ENV === 'development' && /^\d{6}$/.test(credentials.totpCode)) {
              // 创建测试用户
              const testUser = {
                id: 777,
                username: credentials.username,
                role: 'user',
                balance: 1000
              };
              
              // 添加测试用户到列表并设置为当前用户
              set(state => ({
                users: {
                  ...state.users,
                  [credentials.username]: testUser
                },
                currentUser: testUser
              }));
              
              return testUser;
            }
            
            // 实际环境下的TOTP验证逻辑
            const user = users && Object.values(users).find(u => u.username === credentials.username);
            if (user) {
              set({ currentUser: user });
              return user;
            }
          } else {
            // 传统密码登录
            const user = users && Object.values(users).find(u => 
              u.username === credentials.username && 
              u.password === credentials.password
            );
            
            if (user) {
              set({ currentUser: user });
              return user;
            }
          }
          
          throw new Error('登录失败，用户名或验证码无效');
        } catch (error) {
          console.error('登录错误:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      logout: () => set({ currentUser: null }),
      loading: false,
      users: {
        'user': { id: 1, username: 'user', password: 'pass', role: 'user', balance: 1000 },
        'merchant': { id: 2, username: 'merchant', password: 'pass', role: 'merchant', balance: 5000 },
        'admin': { id: 3, username: 'admin', password: 'pass', role: 'admin', balance: 10000 }
      },
      transactions: [],
      exchangeRate: 1.0,
      fetchExchangeRate: async () => {
        set({ loading: true });
        console.log('Starting exchange rate fetch');
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ exchangeRate: 6.8 }); // 模拟汇率
        } catch (error) {
          console.error('获取汇率失败:', error);
        } finally {
          set({ loading: false });
        }
      },
      fetchTransactions: async () => {
        set({ loading: true });
        try {
          // 模拟API调用获取交易记录
          await new Promise(resolve => setTimeout(resolve, 300));
          // 不做任何处理，因为交易记录已经在状态中了
        } catch (error) {
          console.error('获取交易记录失败:', error);
        } finally {
          set({ loading: false });
        }
      },
      updateUserBalance: async (payload) => {
        try {
          set({ loading: true });
          
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => {
            // 深度复制用户对象
            const users = JSON.parse(JSON.stringify(state.users));
            const user = users[payload.username];
            
            if (!user) {
              throw new Error('用户不存在');
            }
            
            if (isNaN(payload.amount)) {
              throw new Error('无效的金额');
            }
            
            const oldBalance = user.balance || 0;
            user.balance = Number(payload.amount);
            
            // 如果当前用户正好是被修改的用户，也更新currentUser
            let currentUser = state.currentUser;
            if (currentUser && currentUser.username === payload.username) {
              currentUser = { ...currentUser, balance: user.balance };
            }
            
            // 创建交易记录
            const newTransaction = {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              type: payload.transactionType || '余额调整',
              operator: state.currentUser?.username || 'system',
              username: payload.username,
              amount: user.balance - oldBalance,
              balanceAfter: user.balance,
              // 添加商家信息，如果提供了的话
              merchant: payload.merchantInfo ? {
                id: payload.merchantInfo.id || 'unknown',
                name: payload.merchantInfo.name || 'unknown'
              } : undefined
            };
            
            return {
              users,
              currentUser,
              transactions: [...state.transactions, newTransaction]
            };
          });
          
          return true;
        } catch (error) {
          console.error(error);
          throw error;
        } finally {
          set({ loading: false });
        }
      }
    }),
    {
      name: 'app-storage',
      storage: customStorage,
      partialize: (state) => ({ 
        users: state.users, 
        currentLanguage: state.currentLanguage,
        theme: state.theme,
        transactions: state.transactions
      })
    }
  )
);