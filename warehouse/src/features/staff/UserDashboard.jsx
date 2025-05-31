import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/css/styles.css";
import loginBg from "../../assets/img/login-bg.png";

const UserDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Kiểm tra đăng nhập và lấy thông tin người dùng
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    const rolesStr = localStorage.getItem("userRoles");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        if (rolesStr) {
          const roles = JSON.parse(rolesStr);
          setUserRoles(roles);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Hàm chuyển đổi Google Drive link thành direct image URL
  const getGoogleDriveImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/[-\w]{25,}/);
      if (fileId && fileId[0]) {
        return `https://drive.google.com/uc?export=view&id=${fileId[0]}`;
      }
    }
    return url;
  };

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRoles");
    navigate("/login");
    toast.info("Đã đăng xuất");
  };

  // Format thời gian đăng nhập cuối cùng
  const formatLastLogin = (dateTimeStr) => {
    if (!dateTimeStr) return "Chưa có";
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Lấy danh sách người dùng (chỉ dành cho admin)
  useEffect(() => {
    if (!userRoles.includes("Quản trị viên")) return;
    setLoading(true);
    fetch(`/User?page=${currentPage}&size=10`)
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      })
      .catch(() => toast.error("Không thể tải danh sách người dùng!"))
      .finally(() => setLoading(false));
  }, [userRoles, currentPage]);

  // Phân trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="user-dashboard">
      <ToastContainer position="top-right" autoClose={2000} />
      <img src={loginBg} alt="Dashboard Background" className="login__bg" />
      <div className="user-dashboard__container">
        <header className="user-dashboard__header">
          <h1>Dashboard Người Dùng</h1>
          {currentUser && (
            <div className="user-dashboard__user">
              <div className="user-dashboard__user-profile">
                {currentUser.AvatarUrl ? (
                  <img
                    src={getGoogleDriveImageUrl(currentUser.AvatarUrl)}
                    alt={currentUser.FullName || currentUser.Username}
                    className="user-dashboard__user-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/40?text=" +
                        (currentUser.FullName || currentUser.Username || "").charAt(0).toUpperCase();
                    }}
                  />
                ) : (
                  <div className="user-dashboard__user-avatar user-dashboard__user-avatar--placeholder">
                    {(currentUser.FullName || currentUser.Username || "").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-dashboard__user-info">
                  <h3 className="user-dashboard__user-name">{currentUser.FullName || currentUser.Username}</h3>
                  <p className="user-dashboard__user-role">{userRoles.join(", ")}</p>
                  <p className="user-dashboard__user-last-login">
                    Đăng nhập: {formatLastLogin(currentUser.LastLoginAt)}
                  </p>
                </div>
              </div>
              <button className="user-dashboard__logout" onClick={handleLogout}>
                <i className="ri-logout-box-line"></i>
              </button>
            </div>
          )}
        </header>

        <main className="user-dashboard__content">
          <div className="user-dashboard__welcome">
            <h2>Chào mừng, {currentUser?.FullName || currentUser?.Username}!</h2>
            <p>Đây là trang Dashboard cơ bản dành cho người dùng thông thường.</p>
          </div>

          {/* Nếu là admin thì hiển thị bảng danh sách user */}
          {userRoles.includes("Quản trị viên") && (
            <div className="user-dashboard__users-table">
              <h3>Danh sách người dùng</h3>
              {loading ? (
                <p>Đang tải...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên đăng nhập</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Trạng thái</th>
                      <th>Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.Id}>
                        <td>{user.UserCode}</td>
                        <td>{user.Username}</td>
                        <td>{user.FullName}</td>
                        <td>{user.Email}</td>
                        <td>{user.Status}</td>
                        <td>
                          {(user.Roles || []).map(role => role.Name).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Phân trang đơn giản */}
              <div style={{ marginTop: 12 }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    disabled={currentPage === i + 1}
                    style={{
                      marginRight: 4,
                      background: currentPage === i + 1 ? "#ccc" : "#fff"
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nếu không phải admin, hiển thị các card như cũ */}
          {!userRoles.includes("Quản trị viên") && (
            <div className="user-dashboard__cards">
              <div className="user-dashboard__card">
                <div className="user-dashboard__card-icon">
                  <i className="ri-user-line"></i>
                </div>
                <div className="user-dashboard__card-content">
                  <h3>Thông tin cá nhân</h3>
                  <p>Xem và cập nhật thông tin cá nhân</p>
                </div>
              </div>
              <div className="user-dashboard__card">
                <div className="user-dashboard__card-icon">
                  <i className="ri-file-list-line"></i>
                </div>
                <div className="user-dashboard__card-content">
                  <h3>Danh sách công việc</h3>
                  <p>Xem các công việc được giao</p>
                </div>
              </div>
              <div className="user-dashboard__card">
                <div className="user-dashboard__card-icon">
                  <i className="ri-notification-line"></i>
                </div>
                <div className="user-dashboard__card-content">
                  <h3>Thông báo</h3>
                  <p>Xem các thông báo mới</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;