import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('accessToken');
  let currentUser = {};
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData && userData !== 'undefined') {
      currentUser = JSON.parse(userData);
    }
  } catch (e) {
    currentUser = {};
  }
  const userRoles = currentUser.roles || [];

  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có yêu cầu vai trò cụ thể
  if (requiredRole) {
    const hasRequiredRole = userRoles.some(role => role.name === requiredRole);

    // Nếu không đủ quyền
    if (!hasRequiredRole) {
      // Nếu user có vai trò admin thì về admin, còn lại về dashboard user
      const isAdmin = userRoles.some(role =>
        role.name === "Quản trị viên" ||
        role.name === "Admin" ||
        role.name?.toLowerCase().includes("admin")
      );
      if (isAdmin) {
        return <Navigate to="/admin" replace />;
      }
      // Nếu là user thường hoặc không có role, về dashboard user
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  // Trường hợp có token và đủ quyền (hoặc không yêu cầu quyền)
  return children;
};

export default ProtectedRoute;