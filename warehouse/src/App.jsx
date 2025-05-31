import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout/index.tsx';
import AdminLayout from './layouts/AdminLayout/AdminLayout.tsx';
import UserLayout from './layouts/UserLayout/UserLayout';

// Features
import Login from './features/auth/Login/Login';
import Register from './features/auth/Register/Register';
import AdminDashboard from './features/admin/AdminDashboard';
import UserDashboard from './features/user/Dashboard';
import RoleManager from './features/admin/RoleManager';
import TestAdminLayout from './features/admin/TestAdminLayout';
import UserInfo from './features/user/UserInfo';

// Global styles
import "./assets/css/styles.css";  // Đảm bảo đường dẫn đúng

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'role-manager', element: <RoleManager /> },
      { path: 'test', element: <TestAdminLayout /> },
    ],
  },
  {
    path: '/user',
    element: <UserLayout />,
    children: [
      { path: 'dashboard', element: <UserDashboard /> },
    ],
  },
  {
    path: '/user-info',
    element: <UserInfo />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
