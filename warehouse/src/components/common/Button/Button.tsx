import React from 'react';
import styles from './Button.module.scss'; // Sửa .css thành .scss
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  className,
  loading, // Nhận prop loading
  ...props
}) => {
  return (
    <button 
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`}
      disabled={props.disabled || loading} // Vô hiệu hóa nút khi loading
      data-loading={loading ? "true" : "false"} // Sử dụng data attribute cho loading
      {...props}
    >
      {loading ? <span className={styles.loader}></span> : children}
    </button>
  );
};