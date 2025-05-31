import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../../../AdminLayout/components/Sidebar/Sidebar.module.scss';
import logo from '../../../../assets/images/Logo.png';

interface SidebarProps {
  isVisible: boolean;
}

// Menu dành cho người dùng thông thường
const menuItems = [
  { path: '/user/dashboard', label: 'Trang chủ', icon: '📊' },
  { path: '/user/orders', label: 'Đơn hàng của tôi', icon: '🛍️' },
  { path: '/user/products', label: 'Danh sách sản phẩm', icon: '📦' },
  { path: '/user/notifications', label: 'Thông báo', icon: '🔔' },
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
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.arrow}>
                  {openMenus[item.label] ? '▼' : '▶'}
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
              end={item.path === '/user/dashboard'}
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