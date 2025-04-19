import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，下次渲染时显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误到错误报告服务
    console.error('组件错误:', error, errorInfo);
    this.setState({ 
      errorInfo 
    });
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误显示
      return (
        <div className="error-boundary">
          <h2>应用程序出现问题</h2>
          <p>我们已记录此错误，请稍后再试或联系支持团队。</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>查看详细错误信息</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="reload-button"
          >
            刷新页面
          </button>
        </div>
      );
    }

    // 正常情况下渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary; 