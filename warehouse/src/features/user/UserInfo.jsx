import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../components/common/Table/Table.tsx";
import { Button } from "../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../components/common/Modal/Modal.tsx";
import { useNavigate } from "react-router-dom";
import styles from "./UserInfo.module.scss";

const API_USER = "https://localhost:7193/User";
const API_DEPT = "https://localhost:7193/Department/all";

const initialForm = {
  username: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  gender: "Male",
  dateOfBirth: "",
  departmentId: "",
  password: "",
};

const UserManager = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUsername, setFilterUsername] = useState("");
  const [filterName, setFilterName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_USER}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(API_DEPT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(res.data);
    } catch (err) {
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  // Form submit (add/edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      if (editingId) {
        const { password, ...updateData } = form;
        const payload = {
          ...updateData,
          fullName: updateData.fullName || null,
          email: updateData.email || null,
          phoneNumber: updateData.phoneNumber || null,
          address: updateData.address || null,
          avatarUrl: null,
          dateOfBirth: updateData.dateOfBirth ? updateData.dateOfBirth : null,
          gender: updateData.gender || null,
          departmentId: updateData.departmentId ? Number(updateData.departmentId) : null,
        };
        await axios.put(`${API_USER}/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Cập nhật thành công!");
      } else {
        // Thêm mới (nếu có API)
        // await axios.post(`${API_USER}/add`, form, { ... });
      }
      setForm(initialForm);
      setEditingId(null);
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
      console.error(err);
    }
  };

  // Xóa user
  const handleDelete = async (id) => {
    setConfirmAction({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác!",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await axios.delete(`${API_USER}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Xóa người dùng thành công!");
          fetchUsers();
        } catch (err) {
          toast.error("Lỗi khi xóa người dùng!");
          console.error(err);
        }
      }
    });
  };

  // Đổi trạng thái user
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setConfirmAction({
      title: `Xác nhận ${newStatus === "Active" ? "kích hoạt" : "hủy kích hoạt"}`,
      message: `Bạn có chắc chắn muốn ${newStatus === "Active" ? "kích hoạt" : "hủy kích hoạt"} người dùng này?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await axios.patch(
            `${API_USER}/${id}/status`,
            JSON.stringify(newStatus),
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          toast.success(`${newStatus === "Active" ? "Kích hoạt" : "Hủy kích hoạt"} thành công!`);
          fetchUsers();
        } catch (err) {
          toast.error("Lỗi khi cập nhật trạng thái!");
          console.error(err);
        }
      }
    });
  };

  // Sửa user
  const handleEdit = (user) => {
    setForm({
      username: user.username,
      fullName: user.fullName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      gender: user.gender || "Male",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
      departmentId: user.departmentId || "",
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} người dùng đã chọn?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          let successCount = 0;
          let failCount = 0;
          for (const id of selectedIds) {
            try {
              await axios.delete(`${API_USER}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              successCount++;
            } catch {
              failCount++;
            }
          }
          if (successCount > 0) toast.success(`Đã xóa ${successCount} người dùng!`);
          if (failCount > 0) toast.error(`Không thể xóa ${failCount} người dùng!`);
          fetchUsers();
          setSelectedIds([]);
        } catch (err) {
          toast.error("Có lỗi xảy ra khi xóa!");
        }
      }
    });
  };

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({
      title: "Xác nhận kích hoạt",
      message: `Bạn có chắc chắn muốn kích hoạt ${selectedIds.length} người dùng đã chọn?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          for (const id of selectedIds) {
            await axios.patch(
              `${API_USER}/${id}/status`,
              JSON.stringify("Active"),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
          }
          toast.success("Đã kích hoạt các người dùng đã chọn!");
          fetchUsers();
          setSelectedIds([]);
        } catch (err) {
          toast.error("Có lỗi xảy ra khi kích hoạt!");
        }
      }
    });
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({
      title: "Xác nhận hủy kích hoạt",
      message: `Bạn có chắc chắn muốn hủy kích hoạt ${selectedIds.length} người dùng đã chọn?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          for (const id of selectedIds) {
            await axios.patch(
              `${API_USER}/${id}/status`,
              JSON.stringify("Inactive"),
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
          }
          toast.success("Đã hủy kích hoạt các người dùng đã chọn!");
          fetchUsers();
          setSelectedIds([]);
        } catch (err) {
          toast.error("Có lỗi xảy ra khi hủy kích hoạt!");
        }
      }
    });
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    if (filterStatus !== "all" && user.status !== (filterStatus === "active" ? "Active" : "Inactive")) return false;
    if (filterUsername && !user.username.toLowerCase().includes(filterUsername.toLowerCase())) return false;
    if (filterName && !user.fullName?.toLowerCase().includes(filterName.toLowerCase())) return false;
    return true;
  });

  // Table columns
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
          onChange={e => {
            if (e.target.checked) {
              setSelectedIds(filteredUsers.map(user => user.id));
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
    { key: "userCode", title: "Mã người dùng" },
    { key: "username", title: "Tên đăng nhập" },
    { key: "fullName", title: "Họ và tên", render: (value) => value || "N/A" },
    { key: "email", title: "Email", render: (value) => value || "N/A" },
    {
      key: "departmentName",
      title: "Phòng ban",
      render: (value, row) => {
        const dept = departments.find(d => d.id === row.departmentId);
        return dept ? (dept.departmentName || dept.name) : "N/A";
      }
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (value) => (
        <span className={value === "Active" ? styles.active : styles.inactive}>
          {value === "Active" ? "Đang hoạt động" : "Ngừng hoạt động"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (value, row) => (
        <div className={styles.actionButtons}>
          <Button variant="primary" size="small" onClick={() => handleEdit(row)}>
            Sửa
          </Button>
          <Button
            variant={row.status === "Active" ? "warning" : "success"}
            size="small"
            onClick={() => handleToggleStatus(row.id, row.status)}
          >
            {row.status === "Active" ? "Hủy kích hoạt" : "Kích hoạt"}
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

  return (
    <div className={styles.userManager}>
      <ToastContainer position="top-right" autoClose={3000} />

      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý người dùng</h1>
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            onClick={() => navigate('/register')}
          >
            + Thêm người dùng mới
          </Button>
          <Button
            onClick={fetchUsers}
            variant="secondary"
            style={{ marginLeft: 8 }}
          >
            🔄 Làm mới
          </Button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label>Trạng thái:</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              value={filterUsername}
              onChange={e => setFilterUsername(e.target.value)}
              placeholder="Tìm theo tên đăng nhập"
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Họ và tên:</label>
            <input
              type="text"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              placeholder="Tìm theo họ và tên"
              className={styles.filterInput}
            />
          </div>
        </div>

        <div className={styles.bulkActions}>
          <Button
            variant="success"
            disabled={selectedIds.length === 0}
            onClick={handleBulkActivate}
          >
            Kích hoạt đã chọn
          </Button>
          <Button
            variant="warning"
            disabled={selectedIds.length === 0}
            onClick={handleBulkDeactivate}
            style={{ marginLeft: 8 }}
          >
            Hủy kích hoạt đã chọn
          </Button>
          <Button
            variant="danger"
            disabled={selectedIds.length === 0}
            onClick={handleBulkDelete}
            style={{ marginLeft: 8 }}
          >
            Xóa đã chọn
          </Button>
        </div>

        <Table
          data={filteredUsers}
          columns={columns}
          loading={loading}
          rowKey="id"
        />
      </div>

      {/* Modal thêm/sửa người dùng */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(initialForm);
          setEditingId(null);
        }}
        title={editingId ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Tên đăng nhập</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              disabled={!!editingId}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Họ và tên</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Số điện thoại</label>
            <input
              type="text"
              value={form.phoneNumber}
              onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Địa chỉ</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Giới tính</label>
            <select
              value={form.gender}
              onChange={e => setForm({ ...form, gender: e.target.value })}
              className={styles.formSelect}
            >
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Ngày sinh</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Phòng ban</label>
            <select
              value={form.departmentId}
              onChange={e => setForm({ ...form, departmentId: e.target.value })}
              className={styles.formSelect}
            >
              <option value="">Chọn phòng ban</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName || dept.name}
                </option>
              ))}
            </select>
          </div>
          {!editingId && (
            <div className={styles.formGroup}>
              <label>Mật khẩu</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={styles.formInput}
              />
            </div>
          )}
          <div className={styles.formActions}>
            <Button type="submit" variant="primary">
              {editingId ? "Cập nhật" : "Thêm mới"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setForm(initialForm);
                setEditingId(null);
              }}
              style={{ marginLeft: 8 }}
            >
              Huỷ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal xác nhận */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title || "Xác nhận"}
        size="small"
      >
        <div className={styles.confirmModal}>
          <p>{confirmAction?.message}</p>
          <div className={styles.confirmActions}>
            <Button
              variant="danger"
              onClick={() => {
                confirmAction?.onConfirm();
                setConfirmAction(null);
              }}
            >
              Xác nhận
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmAction(null)}
              style={{ marginLeft: 8 }}
            >
              Huỷ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManager;