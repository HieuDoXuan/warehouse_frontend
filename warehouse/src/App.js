import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout/index.jsx';
import AdminLayout from './layouts/AdminLayout/AdminLayout.tsx';
import UserLayout from './layouts/UserLayout/UserLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';


// Features
import Login from './features/auth/Login/Login';
import Register from './features/auth/Register/Register';
import AdminDashboard from './features/admin/AdminDashboard';
import UserDashboard from './features/user/UserDashboard.jsx';
import RoleManager from './features/admin/roles/RoleManager.jsx';
import TestAdminLayout from './features/admin/TestAdminLayout';
import UserInfo from './features/user/UserInfo';
import UserProfile from './features/user/UserProfile';
import DepartmentManager from './features/admin/department/DepartmentManager.jsx'; // Import component quản lý phòng ban
import UserRoleManager from './features/admin/roles/UserRoleManager.jsx'; // Import component quản lý vai trò người dùng
import PermissionManager from './features/admin/permissions/PermissionManager.jsx';
import BasicPermissionManager from "./features/admin/permissions/BasicPermissionManager.jsx";
import WarehouseManager from "./features/admin/warehouse/WarehouseManager.jsx";
import ProductCategoryManager from './features/admin/category/ProductCategoryManager.jsx';
import ApprovalFlowManager from './features/admin/approval/ApprovalFlowManager.jsx';
import OrderApprovalAdd from './features/admin/approval/OrderApprovalAdd.jsx';
import OrderApprovalManager from './features/admin/approval/OrderApprovalManager.jsx';
import OrderLogList from "./features/admin/order/OrderLogList";
import UnitManager from './features/admin/unit/UnitManager.jsx';




// Global styles
import "./assets/scss/styles.scss";  // Đảm bảo đường dẫn đúng

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
    element: (
      <ProtectedRoute requiredRole="Quản trị viên">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'user-roles', element: <UserRoleManager /> },
      { path: 'test', element: <TestAdminLayout /> },
      { path: 'users', element: <UserInfo /> },
      { path: 'profile', element: <UserProfile /> },
      { path: 'departments', element: <DepartmentManager /> }, // Đường dẫn mới cho quản lý phòng ban
      { path: 'roles', element: <RoleManager /> },
      { path: 'permissions', element: <PermissionManager /> },
      { path: 'basic-permissions', element: <BasicPermissionManager /> },
      { path: 'warehouses', element: <WarehouseManager /> },
      { path: 'product-categories', element: <ProductCategoryManager /> },
      { path: 'approvals', element: <ApprovalFlowManager /> },
      { path: 'order-approvals', element: <OrderApprovalManager /> },
      { path: 'order-approvals/add', element: <OrderApprovalAdd /> },
      { path: 'order-logs', element: <OrderLogList /> },
      { path: 'uoms', element: <UnitManager /> },
      
    ],
  },
  {
    path: '/user',
    element: (
      <ProtectedRoute>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <UserDashboard /> },
      { path: 'profile', element: <UserProfile /> },
    ],
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <UserProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: <h1>Không có quyền truy cập</h1>,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
