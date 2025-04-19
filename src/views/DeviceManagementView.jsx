import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeviceManager from '../components/DeviceManager.jsx';
import '../styles/DeviceManagementView.css';

const DeviceManagementView = () => {
  const navigate = useNavigate();
  
  const handleClose = () => {
    // 返回到用户仪表板
    navigate('/user');
  };

  return (
    <div className="device-management-view">
      <DeviceManager onClose={handleClose} />
    </div>
  );
};

export default DeviceManagementView; 