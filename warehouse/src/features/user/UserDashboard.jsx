import React from 'react';
import styles from './UserDashboard.module.scss';

const UserDashboard = () => {
  let currentUser = {};
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData && userData !== 'undefined') {
      currentUser = JSON.parse(userData);
    }
  } catch (e) {
    currentUser = {};
  }
  const userName = currentUser.fullName || currentUser.username || 'Người dùng';

  // Thêm log để debug
  console.log("UserDashboard currentUser:", currentUser);

  return (
    <div className={styles.userDashboard}>
      <h1>Xin chào, {userName}!</h1>
      <div className={styles.dashboardContent}>
        <div className={styles.card}>
          <h3>Đơn hàng của tôi</h3>
          <p>Xem và quản lý đơn hàng</p>
          <button className={styles.cardButton}>Xem đơn hàng</button>
        </div>
        <div className={styles.card}>
          <h3>Thông báo</h3>
          <p>Bạn có 2 thông báo mới</p>
          <button className={styles.cardButton}>Xem thông báo</button>
        </div>
        <div className={styles.card}>
          <h3>Sản phẩm</h3>
          <p>Xem danh sách sản phẩm</p>
          <button className={styles.cardButton}>Xem sản phẩm</button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;