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
import UnitConversionManager from './features/admin/unit/UnitConversionManager.jsx';
import SupplierManager from './features/user/suppliers/SupplierManager.jsx';
import CustomerManager from './features/user/customers/CustomerManager.jsx';
import ProductManager from './features/user/products/ProductManager.jsx';
import ProductBatchManager from './features/user/products/ProductBatchManager.jsx';
import ProductPriceManager from './features/user/products/ProductPriceManager.jsx';
import ProductStockManager from './features/user/products/ProductStockManager.jsx'; // Thêm dòng này
import ProductSupplierManager from './features/user/products/ProductSupplierManager.jsx'; // Thêm dòng này
import OrderManager from './features/user/orders/OrderManager.jsx'; // Thêm dòng này
import DeliveryManager from './features/user/deliveries/DeliveryManager.jsx'; // Thêm dòng này
import ShippingProviderManager from './features/user/deliveries/ShippingProviderManager.jsx'; // Thêm dòng này
import PaymentManager from './features/user/payments/PaymentManager.jsx'; // Thêm dòng này
import InvoiceManager from './features/user/invoices/InvoiceManager.jsx'; // Thêm dòng này
import OrderApprovalManagers from './features/user/order-approval/OrderApprovalManager.jsx'; // Thêm dòng này
import OrderDetailManager from './features/user/orders/OrderDetailManager.jsx'; // Thêm dòng này
import OrderCreate from './features/user/orders/OrderCreate.jsx'; // Thêm dòng này
import OrderQRCode from './features/user/orders/OrderQRCode.jsx'; // Import OrderQRCode component
import InventoryImport from './features/user/warehouse/InventoryImport.jsx';
import InventoryExport from './features/user/warehouse/InventoryExport.jsx';
import InventoryApproval from './features/user/warehouse/InventoryApproval.jsx';
import InventoryTransactions from './features/user/warehouse/InventoryTransactions.jsx';
import InventoryApprovals from './features/user/warehouse/InventoryApprovals.jsx';



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
      { path: 'departments', element: <DepartmentManager /> },
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
      { path: 'uom-conversions', element: <UnitConversionManager /> },
      
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
      { path: 'suppliers', element: <SupplierManager /> },
      { path: 'customers', element: <CustomerManager /> },
      { path: 'product-manager', element: <ProductManager /> },
      { path: 'product-batches', element: <ProductBatchManager /> },
      { path: 'product-prices', element: <ProductPriceManager /> },
      { path: 'product-inventory', element: <ProductStockManager /> },
      { path: 'supplier-products', element: <ProductSupplierManager /> },
      { path: 'order-manager', element: <OrderManager /> },
      { path: 'order-create', element: <OrderCreate /> },
      { path: 'order-approval', element: <OrderApprovalManagers /> },
      { path: 'shipping-manager', element: <DeliveryManager /> },
      { path: 'shipping-providers', element: <ShippingProviderManager /> },
      { path: 'payments', element: <PaymentManager /> },
      { path: 'invoices', element: <InvoiceManager /> },
      { path: 'order-detail', element: <OrderDetailManager /> },
      { path: 'order-qr', element: <OrderQRCode /> },
      // Thêm các dòng sau:
      { path: 'inventory-import', element: <InventoryImport /> },
      { path: 'inventory-export', element: <InventoryExport /> },
      { path: 'inventory-approval', element: <InventoryApproval /> },
      { path: 'inventory-approvals', element: <InventoryApprovals /> },
      { path: 'inventory-transactions', element: <InventoryTransactions /> }
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
