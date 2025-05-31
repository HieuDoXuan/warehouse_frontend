import React from 'react';
import styles from './UserOrders.module.scss';

const UserOrders = () => {
  return (
    <div className={styles.userOrders}>
      <h1>Đơn hàng của tôi</h1>
      <p>Danh sách đơn hàng sẽ hiển thị tại đây.</p>
    </div>
  );
};

export default UserOrders;