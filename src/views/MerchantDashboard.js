import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

function MerchantDashboardComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    dailyTotal: 0,
    weeklyTotal: 0,
    monthlyTotal: 0,
  });
  
  useEffect(() => {
    // 检查用户是否已登录且是商家
    if (!currentUser || currentUser.role !== 'merchant') {
      navigate('/');
      return;
    }
    
    // 获取交易记录（在实际应用中会调用API）
    const allTransactions = useStore.getState().transactions || [];
    // 过滤商家相关交易（在实际环境中应使用merchantId过滤）
    const merchantTransactions = allTransactions.filter(
      tx => tx.merchantInfo?.id === currentUser.id || 
           tx.merchantInfo?.name === currentUser.username
    );
    
    setTransactions(merchantTransactions);
    
    // 计算统计数据
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const dailyTransactions = merchantTransactions.filter(
      tx => new Date(tx.timestamp) >= today
    );
    
    const weeklyTransactions = merchantTransactions.filter(
      tx => new Date(tx.timestamp) >= lastWeek
    );
    
    const monthlyTransactions = merchantTransactions.filter(
      tx => new Date(tx.timestamp) >= lastMonth
    );
    
    setStats({
      dailyTotal: dailyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      weeklyTotal: weeklyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      monthlyTotal: monthlyTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    });
  }, [currentUser, navigate]);
  
  if (!currentUser) return null;
  
  return (
    <div className="merchant-dashboard-page">
      <div className="content-with-glass">
        <h1>{t('merchant.welcome', {fallback: '欢迎'})}, {currentUser.username}!</h1>
        
        <div className="stats-cards">
          <div className="stat-card">
            <h3>{t('merchant.daily_sales', {fallback: '今日销售'})}</h3>
            <p className="stat-value">¥{stats.dailyTotal.toFixed(2)}</p>
          </div>
          
          <div className="stat-card">
            <h3>{t('merchant.weekly_sales', {fallback: '本周销售'})}</h3>
            <p className="stat-value">¥{stats.weeklyTotal.toFixed(2)}</p>
          </div>
          
          <div className="stat-card">
            <h3>{t('merchant.monthly_sales', {fallback: '本月销售'})}</h3>
            <p className="stat-value">¥{stats.monthlyTotal.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="merchant-balance">
          <h2>{t('merchant.account_balance', {fallback: '账户余额'})}</h2>
          <p className="balance-amount">¥{currentUser.balance?.toFixed(2)}</p>
        </div>
        
        <div className="section">
          <h2>{t('merchant.recent_transactions', {fallback: '最近交易'})}</h2>
          
          {transactions.length === 0 ? (
            <p className="no-transactions">{t('merchant.no_transactions', {fallback: '暂无交易记录'})}</p>
          ) : (
            <ul className="transaction-list">
              {transactions.map((tx, index) => (
                <li key={tx.id || index} className="transaction-item payment">
                  <div className="transaction-details">
                    <span className="transaction-date">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                    <span className="transaction-type">
                      {t('transaction.payment', {fallback: '收款'})}
                    </span>
                  </div>
                  <span className="transaction-amount positive">
                    + ¥{tx.amount.toFixed(2)}
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

export default MerchantDashboard;