import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import styles from "./RoleManager.module.scss";

const API_BASE = "https://localhost:7193/Role";

const UserRoleManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userAssignForm, setUserAssignForm] = useState({ userId: "", roleId: "" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get("https://localhost:7193/User/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng!");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
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
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Xử lý phân quyền cho user
  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/assign`, {
        userId: userAssignForm.userId,
        roleIds: [parseInt(userAssignForm.roleId)]
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Phân quyền thành công!");
      setShowModal(false);
      setUserAssignForm({ userId: "", roleId: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi phân quyền cho người dùng!");
    }
  };

  // Xử lý thu hồi quyền
  const handleRevokeRole = async (userId, roleId) => {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi quyền này?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/revoke`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { userId, roleId }
      });
      toast.success("Thu hồi quyền thành công!");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thu hồi quyền!");
    }
  };

  return (
    <div className={styles.userRolesSection}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className={styles.sectionTitle}>Danh sách người dùng và quyền</h2>
      <div className={styles.userRolesTable}>
        <Table
          columns={[
            { key: "username", title: "Tên đăng nhập" },
            { key: "fullName", title: "Họ và tên", render: value => value || "N/A" },
            { 
              key: "roles", 
              title: "Vai trò",
              render: (roles, user) => (
                <div className={styles.userRolesList}>
                  {roles && roles.length > 0 ? roles.map(role => (
                    <div key={role.id} className={styles.userRole}>
                      <span>{role.name}</span>
                      <Button
                        variant="danger"
                        size="mini"
                        onClick={() => handleRevokeRole(user.id, role.id)}
                      >
                        x
                      </Button>
                    </div>
                  )) : "Không có quyền"}
                </div>
              )
            },
            {
              key: "assignRole",
              title: "Phân quyền",
              render: (value, user) => (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    setUserAssignForm(prev => ({ ...prev, userId: user.id }));
                    setShowModal(true);
                  }}
                >
                  Phân quyền
                </Button>
              )
            }
          ]}
          data={users}
          loading={loading}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setUserAssignForm({ userId: "", roleId: "" });
        }}
        title="Phân quyền cho người dùng"
      >
        <form onSubmit={handleAssignRole} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="roleSelect">Vai trò</label>
            <select
              id="roleSelect"
              value={userAssignForm.roleId}
              onChange={e => setUserAssignForm({ ...userAssignForm, roleId: e.target.value })}
              required
              className={styles.formInput}
            >
              <option value="">-- Chọn vai trò --</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formActions}>
            <Button type="submit" variant="primary">Phân quyền</Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowModal(false);
                setUserAssignForm({ userId: "", roleId: "" });
              }}
            >
              Huỷ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserRoleManager;