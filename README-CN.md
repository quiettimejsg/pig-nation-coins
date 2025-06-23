# Pig Nation Coins

## 中文 {#chinese}

### 现代化加密货币管理系统

Pig Nation Coins 是基于React构建的全功能加密货币管理平台，提供安全的钱包管理、多语言支持和双重认证功能。

### ✨ 功能特性
- 💰 多角色钱包管理（用户/商户/管理员）
- 🌐 多语言支持（中/英/日）
- 🔒 TOTP双重认证
- 📱 二维码登录/注册
- 📊 实时交易监控
- 🛡️ 设备授权管理
- 🎨 主题定制（亮/暗模式）

### 🛠 技术栈
- 前端: React + Vite + react-router
- 状态管理: Zustand
- 国际化: i18next
- 界面: CSS Modules + react-icons
- 构建: Vite + Rollup

### 🚀 快速开始
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产环境构建
npm run build
```

### ⚙ 配置说明
1. 复制 `.env.example` 为 `.env`
2. 配置API端点和认证参数
3. 在 `src/locales/` 中添加语言文件

### 📦 项目结构
```
├── src
│   ├── assets/       # 静态资源
│   ├── components/    # 可复用组件
│   ├── views/         # 页面组件
│   ├── store/         # Zustand状态管理
│   ├── locales/       # 多语言文件
│   ├── services/      # API服务
│   ├── styles/        # 组件样式
│   └── utils/         # 工具函数
```

### 🤝 参与贡献
1. Fork 本仓库
2. 新建功能分支 (`git checkout -b feature/xxx`)
3. 提交代码变更 (`git commit -m 'feat: 添加xxx功能'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 新建Pull Request

### 📄 开源协议
AGPL-3.0 License © 2025 Pig Nation
