import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "../../../components/common/Button/Button.tsx";
import { Input } from "../../../components/common/Input/Input.tsx";
import validateRegisterInput from "../../utils/validateRegisterInput";
import styles from "./Register.module.scss";
import logo from "../../../assets/images/Logo.png";

const Register = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userCode: "",
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    avatarUrl: "",
    dateOfBirth: null,
    gender: "Other",
    departmentId: "",
  });

  // Lấy danh sách phòng ban
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await fetch("https://localhost:7193/Department/list", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          toast.error("Không thể tải danh sách phòng ban");
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phòng ban:", error);
        toast.error("Lỗi kết nối tới máy chủ");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartments();
  }, [navigate]);

  // Tạo options cho department dropdown
  const departmentOptions = departments.map(dept => ({
    value: dept.id,
    label: dept.departmentName
  }));

  // Options cho gender dropdown
  const genderOptions = [
    { value: "Male", label: "Nam" },
    { value: "Female", label: "Nữ" },
    { value: "Other", label: "Khác" }
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      dateOfBirth: date
    });
  };

  const handleDepartmentChange = (selectedOption) => {
    setFormData({
      ...formData,
      departmentId: selectedOption ? selectedOption.value : ""
    });
  };

  const handleGenderChange = (selectedOption) => {
    setFormData({
      ...formData,
      gender: selectedOption.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateRegisterInput(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Bạn cần đăng nhập để thực hiện thao tác này!");
        navigate('/login');
        return;
      }

      // Chuẩn bị dữ liệu gửi đi - cải thiện cách xử lý dữ liệu
      const payload = {
        userCode: formData.userCode ? formData.userCode.trim() : "",
        username: formData.username.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : "",
        address: formData.address ? formData.address.trim() : "",
        avatarUrl: "", // Để trống vì chưa có chức năng upload avatar
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : null,
        gender: formData.gender,
        departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        status: "Active" // Mặc định là "Active"
      };
      
      console.log("Sending payload:", payload);
      
      const response = await fetch("https://localhost:7193/Auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      // Cải thiện xử lý response
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Đăng ký người dùng thành công!");
        setTimeout(() => {
          navigate('/admin/users');
        }, 2000);
      } else {
        // Xử lý error message dựa trên content-type
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          toast.error(errorData.message || "Đăng ký thất bại.");
        } else {
          const errorText = await response.text();
          console.error("Non-JSON error response:", errorText);
          toast.error(`Đăng ký thất bại. Mã lỗi: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Đã xảy ra lỗi khi kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm tạo mã UserCode tự động
  const generateUserCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `USER${dateStr}-${randomStr}`;
  };

  // Thêm hàm để xử lý khi click vào nút "Tạo mã"
  const handleGenerateUserCode = () => {
    setFormData({
      ...formData,
      userCode: generateUserCode()
    });
  };

  return (
    <div className={styles.registerContainer}>
      <ToastContainer position="top-right" autoClose={2000} />
      
      <div className={styles.registerCard}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>
        
        <h1 className={styles.title}>Thêm người dùng mới</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Tên đăng nhập *</label>
              <Input
                id="username"
                type="text"
                name="username"
                placeholder="Nhập tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Họ và tên *</label>
              <Input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Nhập họ và tên"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber">Số điện thoại</label>
              <Input
                id="phoneNumber"
                type="text"
                name="phoneNumber"
                placeholder="Nhập số điện thoại"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Mật khẩu *</label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="address">Địa chỉ</label>
              <Input
                id="address"
                type="text"
                name="address"
                placeholder="Nhập địa chỉ"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="userCode">Mã nhân viên</label>
              <div className={styles.inputWithButton}>
                <Input
                  id="userCode"
                  type="text"
                  name="userCode"
                  placeholder="Mã nhân viên (tự động nếu để trống)"
                  value={formData.userCode}
                  onChange={handleChange}
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="small"
                  onClick={handleGenerateUserCode}
                >
                  Tạo mã
                </Button>
              </div>
              <small className={styles.hint}>
                Để trống để hệ thống tự tạo mã khi đăng ký
              </small>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="gender">Giới tính</label>
              <Select
                inputId="gender"
                options={genderOptions}
                value={genderOptions.find(option => option.value === formData.gender)}
                onChange={handleGenderChange}
                placeholder="Chọn giới tính"
                className={styles.select}
                classNamePrefix="select"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="dateOfBirth">Ngày sinh</label>
              <DatePicker
                id="dateOfBirth"
                selected={formData.dateOfBirth}
                onChange={handleDateChange}
                peekNextMonth
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                placeholderText="Chọn ngày sinh"
                className={styles.datePicker}
                dateFormat="dd/MM/yyyy"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="department">Phòng ban</label>
              <Select
                inputId="department"
                options={departmentOptions}
                value={departmentOptions.find(option => option.value === formData.departmentId)}
                onChange={handleDepartmentChange}
                placeholder="Chọn phòng ban"
                className={styles.select}
                classNamePrefix="select"
              />
            </div>
          </div>
          
          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              Đăng ký
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/users')}
              disabled={loading}
            >
              Huỷ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;