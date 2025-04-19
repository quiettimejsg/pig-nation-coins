import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

function AdminDashboardComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalVolume: 0
  });
  
  useEffect(() => {
    // 检查用户是否已登录且是管理员
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
      return;
    }
    
    // 获取用户列表和交易记录（在实际应用中会调用API）
    const storeUsers = useStore.getState().users;
    const allUsers = storeUsers 
      ? Object.values(storeUsers) 
      : [];
    
    const allTransactions = useStore.getState().transactions || [];
    
    setUsers(allUsers);
    setTransactions(allTransactions);
    
    // 统计数据
    setStats({
      totalUsers: allUsers.length,
      totalTransactions: allTransactions.length,
      totalVolume: allTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    });
  }, [currentUser, navigate]);
  
  if (!currentUser) return null;
  
  return (
    <div className="admin-dashboard-page">
      <div className="content-with-glass">
        <h1>{t('admin.welcome', {fallback: '管理员控制台'})}</h1>
        
        <div className="stats-cards">
          <div className="stat-card">
            <h3>{t('admin.total_users', {fallback: '总用户数'})}</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          
          <div className="stat-card">
            <h3>{t('admin.total_transactions', {fallback: '总交易数'})}</h3>
            <p className="stat-value">{stats.totalTransactions}</p>
          </div>
          
          <div className="stat-card">
            <h3>{t('admin.total_volume', {fallback: '总交易额'})}</h3>
            <p className="stat-value">¥{stats.totalVolume.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="section">
          <h2>{t('admin.recent_users', {fallback: '最近用户'})}</h2>
          
          {users.length === 0 ? (
            <p className="no-data">{t('admin.no_users', {fallback: '暂无用户数据'})}</p>
          ) : (
            <ul className="user-list">
              {users.slice(0, 5).map((user, index) => (
                <li key={user.id || index} className="user-item">
                  <div className="user-info">
                    <span className="username">{user.username}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                  <span className="user-balance">¥{user.balance?.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="section">
          <h2>{t('admin.recent_transactions', {fallback: '最近交易'})}</h2>
          
          {transactions.length === 0 ? (
            <p className="no-data">{t('admin.no_transactions', {fallback: '暂无交易数据'})}</p>
          ) : (
            <ul className="transaction-list">
              {transactions.slice(0, 5).map((tx, index) => (
                <li key={tx.id || index} className="transaction-item">
                  <div className="transaction-details">
                    <span className="transaction-date">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                    <span className="transaction-user">
                      {tx.username}
                    </span>
                    <span className="transaction-type">
                      {t(`transaction.${tx.type}`, {fallback: tx.type})}
                    </span>
                  </div>
                  <span className="transaction-amount">
                    ¥{tx.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// 注册为自定义元素
class AdminDashboard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    
    // 创建一个div作为React的挂载点
    const mountPoint = document.createElement('div');
    this.shadowRoot.appendChild(mountPoint);
    
    // 导入React和ReactDOM
    import('react').then((React) => {
      import('react-dom/client').then((ReactDOM) => {
        // 创建React根并渲染组件
        const root = ReactDOM.createRoot(mountPoint);
        root.render(React.createElement(AdminDashboardComponent));
      });
    });
  }
  
  disconnectedCallback() {
    // 清理
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
    }
  }
}

// 注册自定义元素
if (!customElements.get('admin-dashboard')) {
  customElements.define('admin-dashboard', AdminDashboard);
}

export default AdminDashboardComponent;