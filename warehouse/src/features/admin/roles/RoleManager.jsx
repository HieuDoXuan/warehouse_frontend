import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import styles from "./RoleManager.module.scss";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://localhost:7193/Role";

const initialForm = {
  name: "",
  description: "",
};

const RoleManager = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userAssignForm, setUserAssignForm] = useState({ userId: "", roleId: "" });
  const [users, setUsers] = useState([]);
  const [searchRole, setSearchRole] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

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
      toast.error("Không thể tải danh sách phân quyền!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get("https://localhost:7193/User/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Không thể tải danh sách người dùng:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  // Xử lý thêm/cập nhật vai trò
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      
      if (editingId) {
        // Sửa URL endpoint
        await axios.put(`${API_BASE}/update/${editingId}`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Cập nhật vai trò thành công!");
      } else {
        // Sửa URL endpoint
        await axios.post(`${API_BASE}/add`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Thêm vai trò mới thành công!");
      }
      
      setForm(initialForm);
      setEditingId(null);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thao tác với vai trò!");
      console.error(err);
    }
  };

  // Xử lý xóa vai trò
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vai trò này?")) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Xóa vai trò thành công!");
      fetchRoles();
    } catch (err) {
      toast.error("Không thể xóa vai trò. Có thể vai trò đang được sử dụng!");
      console.error(err);
    }
  };

  // Xử lý phân quyền cho user
  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      
      // Điều chỉnh request format để phù hợp với backend
      await axios.post(`${API_BASE}/assign`, {
        userId: userAssignForm.userId,
        roleIds: [parseInt(userAssignForm.roleId)] // Backend cần mảng roleIds
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      toast.success("Phân quyền thành công!");
      setShowModal(false);
      setUserAssignForm({ userId: "", roleId: "" });
      fetchUsers(); // Cập nhật lại danh sách để hiển thị vai trò mới
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi phân quyền cho người dùng!");
      console.error(err);
    }
  };

  // Xử lý thu hồi quyền - sử dụng API revoke trực tiếp
  const handleRevokeRole = async (userId, roleId) => {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi quyền này?")) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      
      // Gọi API revoke trực tiếp
      await axios.delete(`${API_BASE}/revoke`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { userId, roleId } // body cho DELETE request
      });
      
      toast.success("Thu hồi quyền thành công!");
      fetchUsers(); // Cập nhật lại danh sách
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thu hồi quyền!");
      console.error(err);
    }
  };

  // Chọn để sửa
  const handleEdit = (role) => {
    setForm({
      name: role.name,
      status: role.status,
    });
    setEditingId(role.id);
    setShowAddModal(true); // Nếu muốn dùng chung modal cho sửa
  };

  // Reset form
  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  // Lọc vai trò theo tên
  const filteredRoles = roles.filter(role => 
    role && role.name && role.name.toLowerCase().includes(searchRole.toLowerCase())
  );

  // Cấu hình columns cho Table component
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={filteredRoles.length > 0 && selectedIds.length === filteredRoles.length}
          onChange={e => {
            if (e.target.checked) {
              setSelectedIds(filteredRoles.map(role => role.id));
            } else {
              setSelectedIds([]);
            }
          }}
        />
      ),
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={e => {
            if (e.target.checked) {
              setSelectedIds(prev => [...prev, row.id]);
            } else {
              setSelectedIds(prev => prev.filter(id => id !== row.id));
            }
          }}
        />
      ),
    },
    { 
      key: "id", 
      title: "ID" 
    },
    { 
      key: "name", 
      title: "Tên vai trò" 
    },
    {
      key: "userCount",
      title: "Số người dùng",
      render: (value, row) => {
        // Đếm số người dùng có vai trò này
        const count = users.filter(user => 
          user.roles && user.roles.some(role => role.id === row.id)
        ).length;
        return count;
      }
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (value) => (
        <span className={value === "Active" ? styles.active : styles.inactive}>
          {value === "Active" ? "Kích hoạt" : "Hủy kích hoạt"}
        </span>
      )
    },
    {
      key: "toggleStatus",
      title: "Đổi trạng thái",
      render: (value, row) => (
        <Button
          variant={row.status === "Active" ? "danger" : "success"}
          size="small"
          onClick={() => handleToggleStatus(row.id, row.status)}
        >
          {row.status === "Active" ? "Hủy kích hoạt" : "Kích hoạt"}
        </Button>
      )
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (value, row) => (
        <div className={styles.actionButtons}>
          <Button 
            variant="primary" 
            size="small"
            onClick={() => handleEdit(row)}
          >
            Sửa
          </Button>
          <Button 
            variant="danger" 
            size="small"
            onClick={() => handleDelete(row.id)}
          >
            Xóa
          </Button>
          
        </div>
      ),
    },
  ];

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("accessToken");
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await axios.put(`${API_BASE}/update/${id}`, { ...roles.find(r => r.id === id), status: newStatus }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Cập nhật trạng thái thành công!");
      fetchRoles();
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái!");
      console.error(err);
    }
  };

  return (
    <div className={styles.roleManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý phân quyền</h1>
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "" });
              setShowAddModal(true);
            }}
          >
            + Thêm mới
          </Button>
          <Button 
            onClick={fetchRoles} 
            variant="secondary"
            size="small"
          >
            🔄 Làm mới
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate('/admin/user-roles')}
          >
            Danh sách người dùng & quyền
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate('/admin/permissions')}
          >
            Quản lý quyền chi tiết
          </Button>
        </div>
      </header>

    

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Danh sách vai trò</h2>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Tìm kiếm vai trò..."
              value={searchRole}
              onChange={e => setSearchRole(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredRoles}
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

          <div className={styles.formGroup}>
            <label htmlFor="userSelect">Người dùng</label>
            <select
              id="userSelect"
              value={userAssignForm.userId}
              onChange={e => setUserAssignForm({ ...userAssignForm, userId: e.target.value })}
              required
              className={styles.formInput}
            >
              <option value="">-- Chọn người dùng --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.username} ({user.email})
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

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm vai trò mới"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const token = localStorage.getItem("accessToken");
              await axios.post(`${API_BASE}/add`, { name: form.name }, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });
              toast.success("Thêm vai trò mới thành công!");
              setShowAddModal(false);
              setForm({ name: "" });
              fetchRoles();
            } catch (err) {
              toast.error(err.response?.data?.message || "Lỗi khi thêm vai trò!");
            }
          }}
          className={styles.form}
        >
          <div className={styles.formGroup}>
            <label htmlFor="name">Tên vai trò</label>
            <input
              id="name"
              placeholder="Nhập tên vai trò"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formActions}>
            <Button type="submit" variant="primary">Lưu</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Huỷ</Button>
          </div>
        </form>
      </Modal>

      
    
      
    </div>
  );
};

export default RoleManager;