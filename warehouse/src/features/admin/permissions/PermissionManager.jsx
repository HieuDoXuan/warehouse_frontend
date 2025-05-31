import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import styles from "./PermissionManager.module.scss";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://localhost:7193/Role";
const API_PERMISSION = "https://localhost:7193/Permission";

const PermissionManager = () => {
  const navigate = useNavigate();
  
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [nonAdmins, setNonAdmins] = useState([]);
  const [showNonAdminsModal, setShowNonAdminsModal] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Lấy danh sách vai trò
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRoles(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách vai trò!");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách tất cả quyền
  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_PERMISSION}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPermissions(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách quyền!");
      setPermissions([]);
    }
  };

  // Lấy danh sách quyền của vai trò
  const fetchRolePermissions = async (roleId) => {
    if (!roleId) return;
    setPermissionLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_PERMISSION}/role/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRolePermissions(res.data);
    } catch (err) {
      toast.error("Không thể tải quyền của vai trò!");
      setRolePermissions([]);
    } finally {
      setPermissionLoading(false);
    }
  };

  // Lấy danh sách người dùng không phải admin
  const fetchNonAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/non-admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNonAdmins(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng!");
      setNonAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  // Xử lý thêm quyền cho vai trò
  const handleAssignPermissions = async (permissionIds) => {
    if (!selectedRole) {
      toast.error("Vui lòng chọn vai trò!");
      return;
    }

    try {
      // Lọc ra những permission ID chưa được gán
      const existingPermissionIds = rolePermissions.map(p => p.id);
      const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));
      
      if (newPermissionIds.length === 0) {
        toast.info("Tất cả quyền đã được gán cho vai trò này!");
        return;
      }
      
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/assign-permissions`, {
        roleId: selectedRole.id,
        permissionIds: newPermissionIds // Chỉ gửi những ID chưa tồn tại
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Thêm quyền thành công!");
      fetchRolePermissions(selectedRole.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thêm quyền!");
    }
  };

  // Xử lý xóa quyền khỏi vai trò
  const handleRemovePermissions = async (permissionIds) => {
    if (!selectedRole) {
      toast.error("Vui lòng chọn vai trò!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa các quyền đã chọn?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/remove-permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          roleId: selectedRole.id,
          permissionIds
        }
      });
      toast.success("Xóa quyền thành công!");
      fetchRolePermissions(selectedRole.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa quyền!");
    }
  };

  // Xử lý cập nhật toàn bộ quyền cho vai trò
  const handleUpdateAllPermissions = async (permissionIds) => {
    if (!selectedRole) {
      toast.error("Vui lòng chọn vai trò!");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_BASE}/update-permissions`, {
        roleId: selectedRole.id,
        permissionIds
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Cập nhật quyền thành công!");
      fetchRolePermissions(selectedRole.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật quyền!");
    }
  };

  // Xử lý cập nhật thông minh (chỉ thay đổi quyền được thêm/xóa)
  const handleSmartUpdate = async (oldPermissionIds, newPermissionIds) => {
    if (!selectedRole) {
      toast.error("Vui lòng chọn vai trò!");
      return;
    }

    try {
      // Log để debug
      console.log("OldIds:", oldPermissionIds);
      console.log("NewIds:", newPermissionIds);
      
      const token = localStorage.getItem("accessToken");
      
      // Đảm bảo oldPermissionIds và newPermissionIds là mảng hợp lệ
      const oldIds = Array.isArray(oldPermissionIds) ? oldPermissionIds : [];
      const newIds = Array.isArray(newPermissionIds) ? newPermissionIds : [];
      
      await axios.put(`${API_BASE}/update-permissions-smart`, {
        roleId: selectedRole.id,
        oldPermissionIds: oldIds,
        newPermissionIds: newIds
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Cập nhật quyền thành công!");
      fetchRolePermissions(selectedRole.id);
    } catch (err) {
      console.error("Error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật quyền!");
    }
  };

  // Lọc quyền theo tên
  const filteredPermissions = permissions.filter(permission => 
    permission.name.toLowerCase().includes(filterName.toLowerCase())
  );
  
  // Các quyền đã được gán cho vai trò
  const assignedPermissionIds = rolePermissions.map(p => p.id);
  
  return (
    <div className={styles.permissionManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý quyền hệ thống</h1>
        <div className={styles.headerActions}>
          <Button 
            variant="primary" 
            size="small"
            onClick={() => {
              fetchNonAdmins();
              setShowNonAdminsModal(true);
            }}
          >
            Người dùng không phải admin
          </Button>
          <Button 
            onClick={() => {
              fetchRoles();
              fetchPermissions();
              fetchRolePermissions(selectedRole?.id);
            }} 
            variant="secondary"
            size="small"
            style={{ marginLeft: 8 }}
          >
            🔄 Làm mới
          </Button>
          <Button 
            variant="secondary"
            size="small"
            onClick={() => navigate("/admin/basic-permissions")}
          >
            Quản lý quyền cơ bản
          </Button>
        </div>
      </header>

      <div className={styles.content}>
        {/* Phần chọn vai trò */}
        <div className={styles.roleSelector}>
          <h2 className={styles.sectionTitle}>Vai trò</h2>
          <div className={styles.roleList}>
            {roles.map(role => (
              <div 
                key={role.id}
                className={`${styles.roleItem} ${selectedRole?.id === role.id ? styles.selectedRole : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                <span className={styles.roleName}>{role.name}</span>
                <span className={`${styles.roleStatus} ${role.status === 'Active' ? styles.active : styles.inactive}`}>
                  {role.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phần quản lý quyền */}
        {selectedRole ? (
          <div className={styles.permissionSection}>
            <h2 className={styles.sectionTitle}>
              Quản lý quyền cho vai trò: <span className={styles.highlight}>{selectedRole.name}</span>
            </h2>

            <div className={styles.permissionTools}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Tìm kiếm quyền..."
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.bulkActions}>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => {
                    const selectedIds = assignedPermissionIds;
                    if (selectedIds.length === 0) {
                      toast.warn("Không có quyền nào để xóa!");
                      return;
                    }
                    handleRemovePermissions(selectedIds);
                  }}
                >
                  Xóa tất cả quyền
                </Button>

                <Button
                  variant="success"
                  size="small"
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    const currentPermissionIds = rolePermissions.map(p => p.id);
                    const allPermissionIds = permissions.map(p => p.id);
                    const permissionsToAdd = allPermissionIds.filter(id => !currentPermissionIds.includes(id));
                    
                    if (permissionsToAdd.length === 0) {
                      toast.info("Vai trò này đã có tất cả quyền!");
                      return;
                    }
                    
                    // Truyền trực tiếp những quyền chưa được gán
                    handleAssignPermissions(permissionsToAdd);
                  }}
                >
                  Thêm tất cả quyền
                </Button>
              </div>
            </div>

            <div className={styles.permissionManagerTabs}>
              <div className={styles.tabHeader}>
                <h3>Danh sách quyền</h3>
              </div>
              
              <div className={styles.permissionList}>
                {permissionLoading ? (
                  <div className={styles.loading}>Đang tải...</div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const newPermissionIds = [];
                      
                      // Lấy các permission được chọn
                      formData.getAll('permission').forEach(id => {
                        newPermissionIds.push(parseInt(id));
                      });
                      
                      // Cập nhật quyền thay đổi
                      handleSmartUpdate(assignedPermissionIds, newPermissionIds);
                    }}
                  >
                    <div className={styles.permissionGrid}>
                      {filteredPermissions.map(permission => (
                        <label key={permission.id} className={styles.permissionItem}>
                          <input
                            type="checkbox"
                            name="permission"
                            value={permission.id}
                            defaultChecked={assignedPermissionIds.includes(permission.id)}
                          />
                          <span className={styles.permissionName}>{permission.name}</span>
                          <span className={styles.permissionDescription}>
                            {permission.description || 'Không có mô tả'}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    <div className={styles.formActions}>
                      <Button type="submit" variant="primary">Lưu thay đổi</Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.noRoleSelected}>
            <p>Vui lòng chọn một vai trò từ danh sách bên trái để quản lý quyền</p>
          </div>
        )}
      </div>
      
      {/* Modal hiển thị người dùng không phải admin */}
      <Modal
        isOpen={showNonAdminsModal}
        onClose={() => setShowNonAdminsModal(false)}
        title="Danh sách người dùng không phải admin"
      >
        <div className={styles.nonAdminsList}>
          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : (
            <Table
              columns={[
                { key: "username", title: "Tên đăng nhập" },
                { key: "fullName", title: "Họ và tên", render: value => value || "N/A" },
                { key: "email", title: "Email", render: value => value || "N/A" },
                { 
                  key: "status", 
                  title: "Trạng thái",
                  render: value => (
                    <span className={value === "Active" ? styles.active : styles.inactive}>
                      {value}
                    </span>
                  )
                }
              ]}
              data={nonAdmins}
              loading={loading}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PermissionManager;