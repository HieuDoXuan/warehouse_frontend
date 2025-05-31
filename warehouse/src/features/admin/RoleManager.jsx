import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "../../assets/css/styles.css";
import loginBg from "../../assets/img/login-bg.png";

const RoleManager = () => {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Kiểm tra đăng nhập
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        // Kiểm tra quyền admin
        const roles = JSON.parse(localStorage.getItem("userRoles") || "[]");
        if (!roles.includes("Quản trị viên")) {
          toast.error("Bạn không có quyền truy cập trang này!");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error parsing user info:", error);
        navigate("/login");
      }
    } else {
      toast.info("Vui lòng đăng nhập để tiếp tục");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch danh sách người dùng
  const fetchUsers = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("https://localhost:7193/User", {
        headers: {
          "X-Admin-Id": currentUser?.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users); // Sửa ở đây: lấy mảng users từ object trả về
      } else {
        toast.error("Không thể tải danh sách người dùng");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch danh sách tất cả role
  const fetchRoles = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch("https://localhost:7193/Role/all", {
        headers: {
          "X-Admin-Id": currentUser?.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableRoles(data);
      } else {
        toast.error("Không thể tải danh sách quyền");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Không thể kết nối đến server");
    }
  };

  // Fetch role của một user
  const fetchUserRoles = async (userId) => {
    if (!currentUser?.id) return [];

    try {
      const response = await fetch(`https://localhost:7193/Role/user/${userId}`, {
        headers: {
          "X-Admin-Id": currentUser?.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.map(role => role.id);
      } else {
        toast.error("Không thể tải quyền của người dùng");
        return [];
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Không thể kết nối đến server");
      return [];
    }
  };

  // Load data khi component mount
  useEffect(() => {
    if (currentUser?.Id) {
      fetchUsers();
      fetchRoles();
    }
  }, [currentUser]);

  // Xử lý chọn người dùng
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setIsLoading(true);
    
    try {
      const userRoleIds = await fetchUserRoles(user.id);
      setSelectedRoles(userRoleIds);
    } catch (error) {
      console.error("Error loading user roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý thay đổi role
  const handleRoleChange = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  // Lưu thay đổi role
  const saveUserRoles = async () => {
    if (!selectedUser || !currentUser?.id) return;

    try {
      setIsLoading(true);

      const response = await fetch("https://localhost:7193/Role/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Id": currentUser?.id
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleIds: selectedRoles
        })
      });
      
      if (response.ok) {
        // Cập nhật UI
        const updatedUsers = users.map(user => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              roles: availableRoles
                .filter(role => selectedRoles.includes(role.id))
                .map(role => role.name)
            };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        toast.success(`Đã cập nhật quyền cho ${selectedUser.fullName || selectedUser.username}!`);
      } else {
        const errorData = await response.json();
        toast.error(`Không thể cập nhật quyền: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error updating roles:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  // Trở về trang dashboard
  const goToDashboard = () => {
    navigate("/admin");
  };

  // Lọc người dùng theo từ khóa tìm kiếm
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchTermLower) ||
      user.fullName?.toLowerCase().includes(searchTermLower) ||
      user.email?.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="rolemanager">
      <ToastContainer position="top-right" autoClose={2000} />
      <img src={loginBg} alt="Background" className="login__bg" />
      
      <div className="rolemanager__container">
        <header className="rolemanager__header">
          <button className="rolemanager__back-btn" onClick={goToDashboard}>
            <i className="ri-arrow-left-line"></i> Trở về Dashboard
          </button>
          <h1>Quản Lý Phân Quyền</h1>
        </header>
        
        <div className="rolemanager__content">
          <div className="rolemanager__sidebar">
            <div className="rolemanager__search">
              <input 
                type="text" 
                placeholder="Tìm kiếm người dùng..." 
                className="rolemanager__search-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <i className="ri-search-line"></i>
            </div>
            
            <div className="rolemanager__user-list">
              {isLoading && !selectedUser ? (
                <div className="rolemanager__loading">
                  <p>Đang tải danh sách người dùng...</p>
                </div>
              ) : (
                <ul>
                  {filteredUsers.map(user => (
                    <li 
                      key={user.id}
                      className={selectedUser && selectedUser.id === user.id ? "selected" : ""}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="rolemanager__user-info">
                        <div className="rolemanager__user-avatar">
                          {(user.fullName || user.username || "").charAt(0).toUpperCase()}
                        </div>
                        <div className="rolemanager__user-details">
                          <h3>{user.fullName || user.username}</h3>
                          <p>{user.email}</p>
                        </div>
                      </div>
                      <span className="rolemanager__user-roles-count">
                        {user.roles?.length || 0} quyền
                      </span>
                    </li>
                  ))}

                  {filteredUsers.length === 0 && (
                    <li className="rolemanager__no-results">
                      <i className="ri-file-search-line"></i>
                      <p>Không tìm thấy người dùng</p>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
          
          <div className="rolemanager__main">
            {selectedUser ? (
              <div className="rolemanager__role-panel">
                <div className="rolemanager__user-header">
                  <div className="rolemanager__selected-user">
                    <h2>{selectedUser.fullName || selectedUser.username}</h2>
                    <p><i className="ri-mail-line"></i> {selectedUser.email}</p>
                    {selectedUser.lastLoginAt && (
                      <p className="rolemanager__last-login">
                        <i className="ri-time-line"></i> Đăng nhập cuối: {new Date(selectedUser.lastLoginAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="rolemanager__loading">
                    <p>Đang tải thông tin quyền...</p>
                  </div>
                ) : (
                  <>
                    <div className="rolemanager__role-list">
                      <h3>Danh sách quyền</h3>
                      <p className="rolemanager__instruction">
                        Chọn các quyền bạn muốn gán cho người dùng này:
                      </p>
                      
                      <div className="rolemanager__roles">
                        {availableRoles.map(role => (
                          <div key={role.id} className="rolemanager__role-item">
                            <label className="rolemanager__role-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedRoles.includes(role.id)}
                                onChange={() => handleRoleChange(role.id)}
                              />
                              <span className="rolemanager__checkbox-custom"></span>
                              <span className="rolemanager__role-name">{role.name}</span>
                            </label>
                            <span className={`rolemanager__role-status ${role.status.toLowerCase()}`}>
                              {role.status}
                            </span>
                          </div>
                        ))}
                        
                        {availableRoles.length === 0 && (
                          <p className="rolemanager__no-roles">Không có quyền nào trong hệ thống</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="rolemanager__actions">
                      <button 
                        className="rolemanager__cancel-btn"
                        onClick={() => setSelectedUser(null)}
                      >
                        Hủy
                      </button>
                      <button 
                        className="rolemanager__save-btn"
                        onClick={saveUserRoles}
                        disabled={isLoading}
                      >
                        <i className="ri-save-line"></i> Lưu thay đổi
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rolemanager__empty-state">
                <div className="rolemanager__empty-icon">
                  <i className="ri-shield-user-line"></i>
                </div>
                <h2>Quản lý phân quyền người dùng</h2>
                <p>Vui lòng chọn một người dùng từ danh sách bên trái để cấp quyền</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManager;