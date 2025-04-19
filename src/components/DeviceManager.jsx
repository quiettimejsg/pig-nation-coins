import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/DeviceManager.css';
import { FaDesktop, FaMobile, FaTablet, FaLaptop, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const DeviceManager = ({ onClose }) => {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingDevice, setConfirmingDevice] = useState(null);
  const { t } = useTranslation();

  // 加载设备列表
  useEffect(() => {
    fetchDevices();
  }, []);

  // 模拟获取设备数据
  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // 实际应用中，这里应该从API获取数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟设备数据
      const mockDevices = [
        {
          id: '1',
          name: 'Windows PC - Chrome',
          type: 'desktop',
          browser: 'Chrome',
          os: 'Windows 10',
          lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5分钟前
          isCurrent: true,
          ipAddress: '192.168.1.1',
          location: '北京, 中国',
          trusted: true
        }
      ];
      
      setDevices(mockDevices);
    } catch (err) {
      setError(t('device_management.error'));
      console.error('获取设备失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化最后活跃时间
  const formatLastActive = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffMin < 1) {
      return t('device_management.just_now');
    } else if (diffMin < 60) {
      return `${diffMin}${t('device_management.minutes_ago')}`;
    } else if (diffHour < 24) {
      return `${diffHour}${t('device_management.hours_ago')}`;
    } else {
      return `${diffDay}${t('device_management.days_ago')}`;
    }
  };

  // 获取设备图标
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'desktop':
        return <FaDesktop />;
      case 'mobile':
        return <FaMobile />;
      case 'tablet':
        return <FaTablet />;
      case 'laptop':
        return <FaLaptop />;
      default:
        return <FaDesktop />;
    }
  };

  // 移除设备
  const removeDevice = async (deviceId) => {
    try {
      // 实际应用中应该调用API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 更新本地状态
      setDevices(devices.filter(device => device.id !== deviceId));
      setConfirmingDevice(null);
    } catch (err) {
      setError(t('device_management.remove_failed'));
      console.error('移除设备失败:', err);
    }
  };

  // 信任或取消信任设备
  const toggleTrustDevice = async (deviceId) => {
    try {
      // 实际应用中应该调用API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 更新本地状态
      setDevices(devices.map(device => 
        device.id === deviceId 
          ? { ...device, trusted: !device.trusted } 
          : device
      ));
    } catch (err) {
      setError(t('device_management.trust_failed'));
      console.error('更新设备状态失败:', err);
    }
  };

  return (
    <div className="device-manager">
      <div className="device-manager-header">
        <h2>{t('device_management.title')}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      <div className="device-info-header">
        <p>
          {t('device_management.description')}
        </p>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('device_management.loading')}</p>
        </div>
      ) : (
        <div className="device-list">
          {devices.length === 0 ? (
            <div className="no-devices">
              <p>{t('device_management.no_devices')}</p>
            </div>
          ) : (
            devices.map(device => (
              <div key={device.id} className={`device-item ${device.isCurrent ? 'current-device' : ''}`}>
                <div className="device-icon">
                  {getDeviceIcon(device.type)}
                </div>
                
                <div className="device-details">
                  <div className="device-name">
                    {device.name}
                    {device.isCurrent && <span className="current-tag">{t('device_management.current_device')}</span>}
                  </div>
                  
                  <div className="device-meta">
                    <span className="device-os">{device.os}</span>
                    <span className="dot-separator">•</span>
                    <span className="last-active">{t('device_management.last_active')} {formatLastActive(device.lastActive)}</span>
                  </div>
                  
                  <div className="device-location">
                    <span className="ip-address">IP: {device.ipAddress}</span>
                    <span className="dot-separator">•</span>
                    <span className="location">{device.location}</span>
                  </div>
                </div>
                
                <div className="device-actions">
                  {confirmingDevice === device.id ? (
                    <div className="confirm-actions">
                      <button 
                        className="confirm-remove" 
                        onClick={() => removeDevice(device.id)}
                      >
                        {t('device_management.confirm_remove')}
                      </button>
                      <button 
                        className="cancel-remove"
                        onClick={() => setConfirmingDevice(null)}
                      >
                        {t('device_management.cancel')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        className={`trust-button ${device.trusted ? 'trusted' : ''}`}
                        onClick={() => toggleTrustDevice(device.id)}
                        title={device.trusted ? t('device_management.untrust_device') : t('device_management.trust_device')}
                      >
                        <FaCheck /> {device.trusted ? t('device_management.trusted') : t('device_management.trust_device')}
                      </button>
                      
                      {!device.isCurrent && (
                        <button 
                          className="remove-button"
                          onClick={() => setConfirmingDevice(device.id)}
                          title={t('device_management.remove_tooltip')}
                        >
                          <FaTrash /> {t('device_management.remove')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      <div className="device-manager-footer">
        <button 
          className="sign-out-all-button"
          onClick={() => {
            // 实际应用中应该调用登出所有设备的API
            // 并且可能需要二次确认
            setDevices(devices.filter(device => device.isCurrent));
          }}
          disabled={devices.filter(d => !d.isCurrent).length === 0}
        >
          {t('device_management.sign_out_all')}
        </button>
      </div>
    </div>
  );
};

export default DeviceManager; 