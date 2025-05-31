import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUser3Line } from 'react-icons/ri'; // Thêm dòng này
import styles from './Header.module.scss';
import manImg from '../../../../assets/images/man.png'; // Thêm dòng này

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userName = currentUser.fullName || currentUser.username || 'Người dùng';
  const [isMenuOpen, setMenuOpen] = useState(false); // Trạng thái mở menu

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <span 
          className={styles.menuToggle} 
          onClick={onToggleSidebar}
        >
          ☰
        </span>
        <h2>Dashboard</h2>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.userInfo} onClick={toggleMenu}>
          <div className={styles.avatar}>
            <img 
              src={manImg} 
              alt="Default Avatar" 
              style={{ width: 36, height: 36, borderRadius: '50%' }}
            />
          </div>
          <span>Xin chào, {userName}</span>
          {isMenuOpen && (
            <div className={styles.userMenu}>
              <button 
                className={styles.menuItem}
                onClick={() => navigate('/profile')}
              >
                Thông tin cá nhân
              </button>
              <button 
                className={styles.menuItem}
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;