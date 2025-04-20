# Pig Nation Coins

[English](#english) |  [日本語](README-JP.md) | [中文](README-CN.md) 

---

## English

### A Modern Cryptocurrency Management System

Pig Nation Coins is a feature-rich cryptocurrency management platform built with React, providing secure wallet management, multi-language support, and two-factor authentication.

### ✨ Features
- 💰 Multi-role wallet management (User/Merchant/Admin)
- 🌐 i18n internationalization support (CN/EN/JP)
- 🔒 TOTP two-factor authentication
- 📱 QR code login/registration
- 📊 Real-time transaction monitoring
- 🛡️ Device authorization management
- 🎨 Theme customization (Light/Dark mode)

### 🛠 Tech Stack
- Frontend: React + Vite + react-router
- State Management: Zustand
- Internationalization: i18next
- UI: CSS Modules + react-icons
- Build: Vite + Rollup

### 🚀 Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### ⚙ Configuration
1. Copy `.env.example` to `.env`
2. Configure API endpoints and auth settings
3. Add locale files in `src/locales/`

### 📦 Project Structure
```
├── src
│   ├── assets/       # Static resources
│   ├── components/    # Reusable components
│   ├── views/         # Page components
│   ├── store/         # Zustand state management
│   ├── locales/       # Multi-language files
│   ├── services/      # API services
│   ├── styles/        # Component styles
│   └── utils/         # Utility functions
```

### 🤝 Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/xxx`)
3. Commit changes (`git commit -m 'feat: add xxx'`)
4. Push to branch (`git push origin feature/xxx`)
5. Create Pull Request

### 📄 License
MIT License © 2025 Pig Nation
