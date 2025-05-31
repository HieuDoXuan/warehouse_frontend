import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar.tsx'; // Sử dụng UserSidebar
import Header from '../AdminLayout/components/Header/Header.tsx';
import styles from '../AdminLayout/AdminLayout.module.scss';

const UserLayout = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar isVisible={isSidebarVisible} />
      <div className={styles.mainContent}>
        <Header onToggleSidebar={toggleSidebar} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UserLayout;