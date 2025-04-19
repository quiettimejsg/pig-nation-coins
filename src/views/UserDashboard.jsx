import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import '../styles/UserDashboard.css';

export default function UserDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const { currentUser } = useStore();
  
  useEffect(() => {
    // 检查用户是否已登录
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    // 获取用户交易记录（从store中）
    const userTransactions = useStore.getState().transactions || [];
    // 过滤当前用户的交易
    const filteredTransactions = userTransactions.filter(
      tx => tx.username === currentUser.username
    );
    setTransactions(filteredTransactions);
  }, [currentUser, navigate]);
  
  if (!currentUser) return null;
  
  const handleGoToDeviceManagement = () => {
    navigate('/device-management');
  };
  
  return (
    <div className="user-dashboard-page">
      <div className="content-with-glass">
        <h1>{t('user.welcome')}, {currentUser.username}!</h1>
        
        <div className="user-info-card">
          <div className="user-balance">
            <h2>{t('user.balance')}</h2>
            <p className="balance-amount">¥{currentUser.balance?.toFixed(2)}</p>
          </div>
          
          <button 
            className="device-management-button"
            onClick={handleGoToDeviceManagement}
          >
            {t('user_dashboard.deviceManagement')}
          </button>
        </div>
        
        <div className="transactions-section">
          <h2>{t('user.recent_transactions')}</h2>
          
          {transactions.length === 0 ? (
            <p className="no-transactions">{t('user.no_transactions')}</p>
          ) : (
            <ul className="transaction-list">
              {transactions.map(tx => (
                <li key={tx.id} className={`transaction-item ${tx.type}`}>
                  <div className="transaction-details">
                    <span className="transaction-date">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                    <span className="transaction-type">
                      {t(`transaction.${tx.type}`)}
                    </span>
                  </div>
                  <span className={`transaction-amount ${tx.type === 'payment' ? 'negative' : 'positive'}`}>
                    {tx.type === 'payment' ? '-' : '+'} ¥{tx.amount.toFixed(2)}
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