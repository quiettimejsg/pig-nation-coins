import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BrowserQRCodeReader } from '@zxing/browser';
import { useStore } from '../store';
import { i18n } from '../utils/i18n';
import { ref } from 'lit/directives/ref.js';

@customElement('payment-view')
export class Payment extends LitElement {
  @state()
  qrData;

  @state()
  scanResult;

  @state()
  errorMessage;

  @state()
  successMessage;

  @state()
  processing;
  
  @state()
  currentLanguage;
  
  @state()
  currentTheme;

  videoRef = null;
  qrCodeCanvasRef = null;
  codeReader = null;
  scannerActive = false;

  constructor() {
    super();
    this.qrData = '';
    this.scanResult = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.processing = false;
    this.currentLanguage = i18n.language;
    this.currentTheme = useStore.getState().theme || 'light';
    
    // 创建默认背景图数据
    this.createDefaultBackgroundImages();
    
    // 监听语言变化
    this._onLanguageChanged = this._onLanguageChanged.bind(this);
    document.addEventListener('app-language-changed', this._onLanguageChanged);
    
    // 监听主题变化
    this._onThemeChanged = this._onThemeChanged.bind(this);
    document.addEventListener('app-theme-changed', this._onThemeChanged);
    
    // 直接从store中订阅主题变化
    this._unsubscribeTheme = useStore.subscribe(
      (state) => state.theme,
      (theme) => {
        this.currentTheme = theme || 'light';
        this.requestUpdate();
        if (this.qrCodeCanvasRef && this.qrData) {
          this.generateQrCode();
        }
      }
    );
  }
  
  // 创建默认背景图
  createDefaultBackgroundImages() {
    // 检查背景图是否存在，如果不存在则使用默认生成的背景
    this.defaultBackgroundPC = this.generateDefaultBackground(1920, 1080);
    this.defaultBackgroundPhone = this.generateDefaultBackground(640, 1136);
    
    // 将默认背景添加到document中以供CSS引用
    if (!document.getElementById('default-bg-pc')) {
      const style = document.createElement('style');
      style.id = 'default-bg-pc';
      style.textContent = `
        :root {
          --default-bg-pc: ${this.defaultBackgroundPC};
          --default-bg-phone: ${this.defaultBackgroundPhone};
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // 生成默认渐变背景
  generateDefaultBackground(width, height) {
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
    return canvas.toDataURL('image/png');
  }
  
  _onLanguageChanged(event) {
    this.currentLanguage = event.detail.language;
    this.requestUpdate();
  }
  
  _onThemeChanged(event) {
    this.currentTheme = event.detail.theme;
    this.requestUpdate();
    if (this.qrCodeCanvasRef && this.qrData) {
      this.generateQrCode();
    }
  }

  firstUpdated() {
    try {
      // 延迟初始化扫描器，确保DOM已完全加载
      setTimeout(() => {
        this.initQrScanner();
      }, 1000);
    } catch (error) {
      console.error('初始化QR组件失败:', error);
    }
  }

  disconnectedCallback() {
    try {
      super.disconnectedCallback();
      // 释放扫描器资源
      this.stopQrScanner();
      // 移除语言变更监听
      document.removeEventListener('app-language-changed', this._onLanguageChanged);
      // 移除主题变更监听
      document.removeEventListener('app-theme-changed', this._onThemeChanged);
      // 取消store订阅
      if (this._unsubscribeTheme) {
        this._unsubscribeTheme();
      }
    } catch (error) {
      console.error('组件卸载时清理失败:', error);
    }
  }

  // 停止QR码扫描
  stopQrScanner() {
    try {
      if (this.codeReader && this.scannerActive) {
        this.codeReader.reset();
        this.scannerActive = false;
      }
    } catch (error) {
      console.error('停止扫描器失败:', error);
    }
  }

  async initQrScanner() {
    try {
      // 检查是否已经有活跃的扫描器
      if (this.scannerActive) {
        console.log('扫描器已经处于活跃状态');
        return;
      }
      
      if (!this.videoRef) {
        console.warn('视频元素未初始化，等待重新渲染');
        // 等待下一帧再尝试
        setTimeout(() => this.initQrScanner(), 1000);
        return;
      }
      
      console.log('初始化QR扫描器...');
      this.codeReader = new BrowserQRCodeReader();
      
      // 检查用户权限状态
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permError) {
        console.error('没有摄像头权限:', permError);
        this.setError('需要摄像头权限才能扫描二维码');
        return;
      }
      
      try {
        await this.codeReader.decodeFromVideoDevice(
          undefined, 
          this.videoRef, 
          (result) => {
            if (result && !this.processing) {
              this.scanResult = result.getText();
              console.log('扫描到QR码结果:', this.scanResult);
              this.processQrCodeResult(this.scanResult);
            }
          }
        );
        this.scannerActive = true;
        console.log('QR扫描器初始化成功');
      } catch (scanError) {
        console.error('初始化扫描器失败:', scanError);
        this.handleError(scanError);
      }
    } catch (error) {
      console.error('QR扫描器初始化时发生错误:', error);
      this.handleError(error);
    }
  }

  async processQrCodeResult(result) {
    try {
      this.processing = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      this.scanResult = result;
      if (!result) {
        this.setError('无效的二维码数据');
        return;
      }

      console.log('正在处理二维码数据:', result);
      
      // 解析扫描结果
      let qrData;
      try {
        qrData = JSON.parse(result);
      } catch (parseError) {
        console.error('二维码数据解析失败:', parseError);
        this.setError('无效的二维码格式');
        return;
      }
      
      if (!qrData.amount || !qrData.merchant) {
        this.setError('无效的付款信息');
        return;
      }

      // 获取当前用户信息
      const store = useStore.getState();
      const currentUser = store.currentUser;
      
      if (!currentUser) {
        this.setError('用户未登录');
        return;
      }

      // 检查余额是否足够
      const amount = parseFloat(qrData.amount);
      if (isNaN(amount) || amount <= 0) {
        this.setError('无效的支付金额');
        return;
      }
      
      if (currentUser.balance < amount) {
        this.setError('余额不足');
        return;
      }

      // 计算支付后的新余额
      const newBalance = currentUser.balance - amount;
      
      // 执行付款逻辑
      try {
        // 调用store中的方法来更新用户余额和添加交易记录
        await store.updateUserBalance({
          username: currentUser.username,
          amount: newBalance,
          transactionType: 'payment',
          merchantInfo: qrData.merchant
        });
        
        // 支付成功，显示成功消息
        this.handlePaymentSuccess(amount, qrData.merchant);
      } catch (error) {
        console.error('支付过程出错:', error);
        this.setError(error.message || '支付处理过程中出错');
        this.processing = false;
      }
    } catch (error) {
      console.error('处理二维码结果时出错:', error);
      this.setError('二维码处理错误');
      this.processing = false;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('qrData') && this.qrData && this.qrCodeCanvasRef) {
      this.generateQrCode();
    }
  }

  generateQrCode() {
    if (!this.qrCodeCanvasRef) {
      console.error('找不到QR码画布元素');
      return;
    }
    
    // 获取当前主题状态
    const isDarkMode = this.currentTheme === 'dark';
    
    // 清理画布，根据主题设置背景色
    const ctx = this.qrCodeCanvasRef.getContext('2d');
    ctx.clearRect(0, 0, this.qrCodeCanvasRef.width, this.qrCodeCanvasRef.height);
    
    // 暗色模式下使用深色背景，亮色模式使用白色背景
    ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, this.qrCodeCanvasRef.width, this.qrCodeCanvasRef.height);
    
    // 文本颜色根据主题改变
    ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
    ctx.font = '14px Arial';
    
    try {
      // 验证金额
      const amount = parseFloat(this.qrData);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('无效金额');
      }
      
      // 获取当前商家信息
      const merchantInfo = {
        id: this.currentUser?.id || 'unknown',
        name: this.currentUser?.username || 'unknown'
      };
      
      // 创建完整的支付数据结构
      const paymentData = {
        amount: amount,
        timestamp: new Date().toISOString(),
        type: 'payment',
        transactionId: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        merchant: merchantInfo
      };
      
      const paymentDataString = JSON.stringify(paymentData);
      
      // 在画布上显示支付信息标题
      ctx.fillText(`${i18n.t('payment.generate_code')}：¥${amount.toFixed(2)}`, 10, 30);
      
      // 在画布上显示二维码数据（分行显示）
      const textLines = this.wrapText(paymentDataString, 180);
      textLines.forEach((line, index) => {
        ctx.fillText(line, 10, 50 + (index * 20));
      });
      
      // 在实际应用中，这里应该使用真正的QR码库生成QR码
      // 例如使用qrcode.react的toCanvas方法
      
      console.log('QR码数据生成成功:', paymentData);
    } catch (error) {
      ctx.fillText(`错误: ${error.message}`, 10, 50);
      console.error('QR码生成错误:', error);
      this.setError(`QR码生成失败: ${error.message}`);
    }
  }

  // 辅助函数：文本换行处理
  wrapText(text, maxWidth) {
    if (!this.qrCodeCanvasRef) {
      return [text];
    }
    
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    words.forEach(char => {
      const testLine = currentLine + char;
      const ctx = this.qrCodeCanvasRef.getContext('2d');
      if (!ctx) {
        return;
      }
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine !== '') {
      lines.push(currentLine);
    }
    
    return lines;
  }

  handleError(err) {
    console.error('支付组件错误:', err);
    this.errorMessage = i18n.t('common.error') + ': ' + (err.message || '未知错误');
    this.requestUpdate();
  }

  get currentUser() {
    try {
      return useStore.getState().currentUser;
    } catch (e) {
      console.error('获取当前用户失败:', e);
      return null;
    }
  }

  async handlePaymentSuccess(amount, merchant = {}) {
    try {
      // 显示成功消息
      this.errorMessage = '';
      this.successMessage = i18n.t('payment.payment_success') + `: ¥${amount.toFixed(2)}`;
      this.requestUpdate();
      
      // 3秒后重置
      setTimeout(() => {
        this.successMessage = '';
        this.scanResult = '';
        this.processing = false;
        this.requestUpdate();
        
        // 重新初始化扫描器，准备下一次扫描
        if (!this.scannerActive) {
          this.initQrScanner();
        }
      }, 3000);
    } catch (error) {
      console.error('支付处理失败:', error);
      this.setError(error.message);
      this.processing = false;
    }
  }

  setError(message) {
    this.errorMessage = message;
    this.requestUpdate();
    
    // 3秒后清除错误
    setTimeout(() => {
      this.errorMessage = '';
      this.requestUpdate();
    }, 3000);
  }

  createRenderRoot() {
    // 返回this而不是创建Shadow DOM
    // 这样组件可以直接使用全局CSS变量和主题设置
    return this;
  }

  render() {
    // 设置data-theme属性以匹配全局主题
    document.documentElement.hasAttribute('data-theme') && 
      this.setAttribute('data-theme', document.documentElement.getAttribute('data-theme'));
    
    // 使用CSS变量设置背景图路径，优先使用实际文件，备用使用生成的默认背景
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --background-image-desktop: var(--default-bg-pc);
        --background-image-mobile: var(--default-bg-phone);
      }
    `;
    
    // 尝试加载实际背景图
    const bgImgLoader = new Image();
    bgImgLoader.onload = () => {
      // 图片加载成功，使用实际图片
      style.textContent = `
        :host {
          --background-image-desktop: url('/images/background-pc.jpg');
          --background-image-mobile: url('/images/background-phone.jpeg');
        }
      `;
      this.requestUpdate();
    };
    bgImgLoader.onerror = () => {
      // 图片加载失败，继续使用默认背景
      console.log('使用默认生成的背景图');
    };
    bgImgLoader.src = '/images/background-pc.jpg';
    
    // 动态添加样式
    if (this.shadowRoot) {
      this.shadowRoot.appendChild(style);
    } else {
      this.appendChild(style);
    }
    
    return html`
      <div class="payment-container">
        <div class="payment-background"></div>
        
        <!-- 添加功能栏 -->
        <div class="function-tab-bar">
          <div class="tab active">${i18n.t('payment.scan_pay')}</div>
          <div class="tab">${i18n.t('payment.transfer')}</div>
          <div class="tab">${i18n.t('payment.history')}</div>
        </div>
        
        <div class="payment-content">
          ${!this.currentUser ? html`
            <div class="error-message">${i18n.t('payment.login_required')}</div>
          ` : html`
            <div class="welcome-message">
              <h1>${i18n.t('user.welcome')}, ${this.currentUser.username}!</h1>
            </div>
            
            <div class="user-balance">
              <p>${i18n.t('user.balance')}: ¥${this.currentUser.balance?.toFixed(2) || '0.00'}</p>
            </div>
            
        <section class="qr-generator">
              <h2>${i18n.t('payment.generate_code')}</h2>
              <div class="input-group">
          <input
                  type="number"
                  min="0.01"
                  step="0.01"
            @change=${(e) => this.qrData = e.target.value}
                  placeholder=${i18n.t('payment.enter_amount')}
                />
                <button 
                  @click=${() => this.qrData && this.generateQrCode()}
                  ?disabled=${!this.qrData}
                >
                  ${i18n.t('common.generate')}
                </button>
              </div>
              ${this.qrData ? html`
                <div class="qr-canvas-container">
                  <canvas 
                    ${ref(el => this.qrCodeCanvasRef = el)}
                    width="200" 
                    height="200">
                  </canvas>
                </div>
              ` : ''}
        </section>

        <section class="qr-scanner">
              <h2>${i18n.t('payment.scan_code')}</h2>
          <video
            ${ref((el) => this.videoRef = el)}
                style="width: 100%; max-width: 300px; border: 2px solid var(--primary-color, #8b5e3c)"
          ></video>
              ${this.scanResult ? html`
                <div class="scan-result">
                  <p>${i18n.t('payment.scan_result')}: ${this.scanResult}</p>
                </div>
              ` : ''}
              
              <div class="transaction-section">
                <h3>${i18n.t('user.recent_transactions')}</h3>
                ${this.getRecentTransactions().length > 0 ? html`
                  <ul class="transaction-list">
                    ${this.getRecentTransactions().map(tx => html`
                      <li class="transaction-item">
                        <div class="transaction-details">
                          <span class="transaction-date">${new Date(tx.timestamp).toLocaleString()}</span>
                          <span class="transaction-type">${tx.type}</span>
                        </div>
                        <span class="transaction-amount ${tx.amount >= 0 ? 'positive' : 'negative'}">
                          ${tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                        </span>
                      </li>
                    `)}
                  </ul>
                ` : html`
                  <div class="no-transactions">${i18n.t('user.no_transactions')}</div>
                `}
              </div>
        </section>
          `}
          
          ${this.errorMessage ? html`
            <div class="error-message">${this.errorMessage}</div>
          ` : ''}
          
          ${this.successMessage ? html`
            <div class="success-message">${this.successMessage}</div>
          ` : ''}
        </div>

        <style>
          .payment-container {
            position: relative;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 20px;
          }
          
          .payment-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: var(--background-image-desktop, url('/images/background-pc.jpg'));
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: -2;
            opacity: var(--background-opacity, 0.8);
            transition: opacity 0.3s ease;
          }
          
          /* 新增功能栏样式，带毛玻璃效果 */
          .function-tab-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 10;
          }
          
          [data-theme="dark"] .function-tab-bar {
            background: rgba(30, 30, 30, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          
          .tab {
            padding: 10px 20px;
            margin: 0 5px;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            color: var(--text-primary, #333333);
          }
          
          .tab.active {
            background-color: var(--primary-color, #8b5e3c);
            color: white;
            box-shadow: 0 2px 8px rgba(139, 94, 60, 0.3);
          }
          
          .tab:hover:not(.active) {
            background-color: rgba(139, 94, 60, 0.1);
          }
          
          .welcome-message {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .welcome-message h1 {
            margin: 0;
            font-size: 1.8rem;
            background: linear-gradient(to right, var(--cinnabar-red), var(--golden-amber));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .payment-content {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-width: 800px;
            width: 100%;
            margin: 0 auto;
            padding: 30px;
            color: var(--text-primary, #333333);
            background-color: var(--content-bg-color, rgba(255, 255, 255, 0.7));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s ease;
          }
          
          /* 对那些不支持backdrop-filter的浏览器提供更强的背景色 */
          @supports not (backdrop-filter: blur(10px)) {
            .payment-content {
              background-color: var(--content-bg-fallback, rgba(255, 255, 255, 0.9));
            }
          }
          
          h2 {
            color: var(--text-primary, #333333);
            margin-top: 0;
          }
          
          .user-balance {
            background-color: var(--background-secondary, #f5f5f5);
            color: var(--text-primary, #333333);
            border-radius: 8px;
            padding: 10px 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-weight: bold;
          }
          
          .transaction-section {
            margin-top: 20px;
            padding: 15px;
            background-color: var(--background-secondary, #f5f5f5);
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .qr-generator, .qr-scanner {
            padding: 20px;
            border-radius: 8px;
            background-color: var(--background-secondary, #f5f5f5);
            color: var(--text-primary, #333333);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          input {
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid var(--border-color, #ccc);
            background-color: var(--input-bg, #ffffff);
            color: var(--text-primary, #333333);
            flex: 1;
          }
          
          input::placeholder {
            color: var(--text-secondary, #666666);
          }
          
          button {
            padding: 8px 16px;
            background-color: var(--primary-color, #8b5e3c);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          
          button:disabled {
            background-color: var(--disabled-color, #cccccc);
            cursor: not-allowed;
          }
          
          button:hover:not(:disabled) {
            background-color: var(--primary-color-dark, #6b4e2c);
          }
          
          .transaction-section h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1.2rem;
            color: var(--text-primary, #333333);
          }
          
          .transaction-list {
            list-style: none;
            padding: 0;
            margin: 0;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          
          .transaction-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid var(--border-color, #ddd);
            background-color: rgba(255, 255, 255, 0.5);
          }
          
          .transaction-item:last-child {
            border-bottom: none;
          }
          
          .transaction-details {
            display: flex;
            flex-direction: column;
          }
          
          .transaction-date {
            font-size: 0.8rem;
            color: var(--text-secondary, #666);
          }
          
          .transaction-type {
            font-size: 0.9rem;
            color: var(--text-primary, #333);
          }
          
          .transaction-amount {
            font-weight: bold;
          }
          
          .transaction-amount.positive {
            color: #4caf50;
          }
          
          .transaction-amount.negative {
            color: #f44336;
          }
          
          .no-transactions {
            text-align: center;
            padding: 15px;
            color: var(--text-secondary, #666);
            font-style: italic;
          }
          
          .qr-canvas-container {
            display: flex;
            justify-content: center;
            margin-top: 15px;
            background-color: var(--background-primary, #ffffff);
            border-radius: 4px;
            padding: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .error-message {
            background-color: var(--error-bg, #f8d7da);
            color: var(--error-text, #721c24);
            padding: 10px;
            border-radius: 4px;
            margin-top: 15px;
          }
          
          .success-message {
            background-color: var(--success-bg, #d4edda);
            color: var(--success-text, #155724);
            padding: 10px;
            border-radius: 4px;
            margin-top: 15px;
          }
          
          .scan-result {
            margin-top: 10px;
            padding: 10px;
            background-color: var(--background-tertiary, rgba(0,0,0,0.05));
            color: var(--text-primary, #333333);
            border-radius: 4px;
          }
          
          /* 对窄屏设备使用不同的背景图片 */
          @media (max-width: 768px) {
            .payment-background {
              background-image: var(--background-image-mobile, url('/images/background-phone.jpeg'));
            }
            
            .payment-content {
              padding: 20px;
            }
          }
          
          /* 根据data-theme属性设置CSS变量 */
          :host {
            --text-primary: #333333;
            --text-secondary: #666666;
            --background-primary: #ffffff;
            --background-secondary: #f5f5f5;
            --background-tertiary: rgba(0,0,0,0.05);
            --border-color: #cccccc;
            --input-bg: #ffffff;
            --error-bg: #f8d7da;
            --error-text: #721c24;
            --success-bg: #d4edda;
            --success-text: #155724;
            --disabled-color: #cccccc;
            --primary-color: #8b5e3c;
            --primary-color-dark: #6b4e2c;
            --content-bg-color: rgba(255, 255, 255, 0.7);
            --content-bg-fallback: rgba(255, 255, 255, 0.9);
            --background-opacity: 0.8;
          }
          
          /* 暗色模式变量 */
          :host([data-theme="dark"]), [data-theme="dark"] {
            --text-primary: #e0e0e0;
            --text-secondary: #a0a0a0;
            --background-primary: #121212;
            --background-secondary: #1e1e1e;
            --background-tertiary: rgba(255,255,255,0.05);
            --border-color: #444444;
            --input-bg: #2c2c2c;
            --error-bg: #330a0a;
            --error-text: #f5a9a9;
            --success-bg: #0a330a;
            --success-text: #a9f5a9;
            --disabled-color: #555555;
            --content-bg-color: rgba(18, 18, 18, 0.7);
            --content-bg-fallback: rgba(18, 18, 18, 0.9);
            --background-opacity: 0.6;
          }
          
          /* 系统暗色模式偏好 - 仅在未设置明确主题时生效 */
          @media (prefers-color-scheme: dark) {
            :host(:not([data-theme])) {
              --text-primary: #e0e0e0;
              --text-secondary: #a0a0a0;
              --background-primary: #121212;
              --background-secondary: #1e1e1e;
              --background-tertiary: rgba(255,255,255,0.05);
              --border-color: #444444;
              --input-bg: #2c2c2c;
              --error-bg: #330a0a;
              --error-text: #f5a9a9;
              --success-bg: #0a330a;
              --success-text: #a9f5a9;
              --disabled-color: #555555;
              --content-bg-color: rgba(18, 18, 18, 0.7);
              --content-bg-fallback: rgba(18, 18, 18, 0.9);
              --background-opacity: 0.6;
            }
          }
        </style>
      </div>
    `;
  }
  
  // 新增方法：获取最近交易记录
  getRecentTransactions() {
    try {
      const store = useStore.getState();
      const currentUser = store.currentUser;
      
      if (!currentUser || !store.transactions) {
        return [];
      }
      
      return store.transactions
        .filter(tx => tx.username === currentUser.username)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5); // 只显示最近5条
    } catch (error) {
      console.error('获取交易记录失败:', error);
      return [];
    }
  }
}

// 确保Payment组件正确注册为Web组件
if (!customElements.get('payment-view')) {
  customElements.define('payment-view', Payment);
}

export default Payment;