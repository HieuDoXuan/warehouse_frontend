import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar.tsx';
import Header from './components/Header/Header.tsx';
import styles from './AdminLayout.module.scss';

const AdminLayout: React.FC = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(true); // Sidebar mặc định hiển thị

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const userId = localStorage.getItem("userId");

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

export default AdminLayout;