// Import các thư viện cần thiết
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Login.module.scss";
import { Button } from "../../../components/common/Button/Button.tsx";
import { Input } from "../../../components/common/Input/Input.tsx";
import logo from "../../../assets/images/Logo.png";
import validateInput from "../../utils/validateInput.js";
import axios from "axios";

// Component chính cho trang đăng nhập
const Login = () => {
  // State để lưu trữ giá trị của các trường nhập liệu
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const navigate = useNavigate();

  // Hàm xử lý khi người dùng nhấn nút "Đăng nhập"
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = formData;

    const validationError = validateInput(username, password);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://localhost:7193/Auth/login", {
        username,
        password,
      });

      // Lấy đúng trường từ backend mới
      const { accessToken, userInfo, roles, permissions, isAdmin, redirectTo } = response.data;

      // Gộp roles và permissions vào userInfo để frontend dùng thống nhất
      const user = {
        ...userInfo,
        roles: roles ? roles.map(name => ({ name })) : [],
        permissions: permissions || [],
        isAdmin: !!isAdmin
      };

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("currentUser", JSON.stringify(user));

      if (redirectTo) {
        navigate(redirectTo === "admin-dashboard" ? "/admin" : "/user/dashboard");
      } else if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/user/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className={styles.loginContainer}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <h1 className={styles.title}>Đăng nhập hệ thống</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <Input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              value={formData.username}
              onChange={handleChange}
              icon="user"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              icon="lock"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.options}>
            <label className={styles.rememberMe}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <span
              className={styles.forgotPassword}
              onClick={() => navigate("/forgot-password")}
            >
              Quên mật khẩu?
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className={styles.submitButton}
            fullWidth
          >
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;