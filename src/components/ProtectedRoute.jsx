import { Navigate } from 'react-router-dom';
import { useStore } from '../store';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useStore();

  // 检查是否已登录
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 如果指定了角色要求，检查用户角色
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 通过验证，渲染子组件
  return children;
};

export default ProtectedRoute; 