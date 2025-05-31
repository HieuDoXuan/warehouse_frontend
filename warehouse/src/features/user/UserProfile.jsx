import React, { useEffect, useState } from 'react';
import styles from './UserProfile.module.scss';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const storedUserInfo = localStorage.getItem("currentUser");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    } else {
      console.error("User info is not available in localStorage.");
    }
  }, []);

  if (!userInfo) {
    return <p>Đang tải thông tin cá nhân...</p>;
  }

  return (
    <div className={styles.userProfile}>
      <h1>Thông tin cá nhân</h1>
      <div className={styles.info}>
        <p><strong>Mã người dùng:</strong> {userInfo.userCode}</p>
        <p><strong>Tên đăng nhập:</strong> {userInfo.username}</p>
        <p><strong>Họ và tên:</strong> {userInfo.fullName || 'N/A'}</p>
        <p><strong>Email:</strong> {userInfo.email}</p>
        <p><strong>Trạng thái:</strong> {userInfo.status}</p>
        <p><strong>Giới tính:</strong> {userInfo.gender || 'N/A'}</p>
        <p><strong>Ngày sinh:</strong> {userInfo.dateOfBirth || 'N/A'}</p>
        <p><strong>Địa chỉ:</strong> {userInfo.address || 'N/A'}</p>
        <p><strong>Số điện thoại:</strong> {userInfo.phoneNumber || 'N/A'}</p>
        <p><strong>Thời gian đăng nhập cuối:</strong> {userInfo.lastLoginAt || 'N/A'}</p>
      </div>
    </div>
  );
};

export default UserProfile;

