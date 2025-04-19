import '../styles/BottomNav.css';

export default function BottomNav() {
  return (
    <nav className="nav-bottom">
      <div className="nav-links">
        <a href="/login" className="nav-link">登录</a>
        <a href="/dashboard" className="nav-link">用户面板</a>
        <a href="/merchant" className="nav-link">商户管理界面</a>
        <a href="/admin" className="nav-link">管理界面</a>
        <a href="/payment" className="nav-link">支付</a>
      </div>
    </nav>
  );
}