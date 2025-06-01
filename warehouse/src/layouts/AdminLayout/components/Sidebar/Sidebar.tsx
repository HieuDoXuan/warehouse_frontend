import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.scss';
import logo from '../../../../assets/images/Logo.png';

interface SidebarProps {
  isVisible: boolean; // Nhận trạng thái hiển thị từ props
}

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Quản lý người dùng', icon: '👥' },
  { path: '/admin/roles', label: 'Quản lý phân quyền', icon: '🔐' },
  { path: '/admin/permissions', label: 'Quản lý quyền', icon: '🔑' },
  { path: '/admin/warehouses', label: 'Quản lý kho', icon: '🏭' },
  { path: '/admin/products', label: 'Quản lý sản phẩm', icon: '📦' },
  { path: '/admin/categories', label: 'Danh mục', icon: '📑' },
  { path: '/admin/product-categories', label: 'Quản lý danh mục hàng hóa', icon: '🗂️' },
  { path: '/admin/order-approvals', label: 'Quản lý phê duyệt', icon: '✅' },
  { path: '/admin/orders', label: 'Đơn hàng', icon: '🛍️' },
  
  { path: '/admin/order-logs', label: 'Danh sách ghi log đơn hàng', icon: '📝' },
  { path: '/admin/departments', label: 'Quản lý phòng ban', icon: '🏢' },
  // Thêm mục quản lý đơn vị tính với mục con
  {
    label: 'Quản lý đơn vị tính',
    icon: '📏',
    children: [
      { path: '/admin/uoms', label: 'Quản lý đơn vị tính', icon: '📏' },
      { path: '/admin/uom-conversions', label: 'Quản lý đơn vị chuyển đổi', icon: '🔄' }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isVisible }) => {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const handleToggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside className={`${styles.sidebar} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.logo}>
        <img src={logo} alt="Logo" />
      </div>
      <nav className={styles.navigation}>
        {menuItems.map((item) =>
          item.children ? (
            <div key={item.label} className={styles.menuGroup}>
              <div
                className={styles.menuGroupLabel}
                onClick={() => handleToggleMenu(item.label)}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.arrow}>
                  {openMenus[item.label] ? "▼" : "▶"}
                </span>
              </div>
              {openMenus[item.label] && (
                <div className={styles.menuChildren}>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) =>
                        `${styles.navItem} ${isActive ? styles.active : ''}`
                      }
                    >
                      <span className={styles.icon}>{child.icon}</span>
                      <span className={styles.label}>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;