import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import { useNavigate } from "react-router-dom";
import styles from "./BasicPermissionManager.module.scss";

const API_PERMISSION = "https://localhost:7193/Permission";

const initialForm = {
  name: "",
  status: "Active",
};

const BasicPermissionManager = () => {
  const navigate = useNavigate();

  // States
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Lấy danh sách tất cả quyền
  const fetchPermissions = async () => {
    setLoading(true);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Xử lý thêm/cập nhật quyền
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      
      if (editingId) {
        await axios.put(`${API_PERMISSION}/update/${editingId}`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Cập nhật quyền thành công!");
      } else {
        await axios.post(`${API_PERMISSION}/add`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Thêm quyền mới thành công!");
      }
      
      setForm(initialForm);
      setEditingId(null);
      setShowAddModal(false);
      fetchPermissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thao tác với quyền!");
      console.error(err);
    }
  };

  // Chọn để sửa
  const handleEdit = (permission) => {
    setForm({
      name: permission.name,
      status: permission.status || "Active",
    });
    setEditingId(permission.id);
    setShowAddModal(true);
  };

  // Xử lý xóa quyền
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa quyền này?")) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_PERMISSION}/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Xóa quyền thành công!");
      fetchPermissions();
      setSelectedIds(prevIds => prevIds.filter(prevId => prevId !== id));
    } catch (err) {
      toast.error("Không thể xóa quyền. Có thể quyền này đang được sử dụng!");
      console.error(err);
    }
  };

  // Xử lý toggle trạng thái quyền
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("accessToken");
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      
      await axios.put(`${API_PERMISSION}/update/${id}`, { 
        name: permissions.find(p => p.id === id).name, 
        status: newStatus 
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      toast.success("Cập nhật trạng thái thành công!");
      fetchPermissions();
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái!");
      console.error(err);
    }
  };

  // Xử lý xóa hàng loạt
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một quyền để xóa!");
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} quyền đã chọn?`))
      return;
    
    try {
      const token = localStorage.getItem("accessToken");
      let successCount = 0;
      let failureCount = 0;

      for (const id of selectedIds) {
        try {
          await axios.delete(`${API_PERMISSION}/delete/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          successCount++;
        } catch (error) {
          failureCount++;
          console.error(`Lỗi khi xóa quyền ID ${id}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Đã xóa ${successCount} quyền thành công!`);
      }
      
      if (failureCount > 0) {
        toast.error(`Không thể xóa ${failureCount} quyền. Có thể đang được sử dụng!`);
      }
      
      setSelectedIds([]);
      fetchPermissions();
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xóa quyền!");
      console.error(err);
    }
  };

  // Xử lý hủy kích hoạt hàng loạt
  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một quyền!");
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kích hoạt ${selectedIds.length} quyền đã chọn?`))
      return;
    
    try {
      const token = localStorage.getItem("accessToken");
      let successCount = 0;

      for (const id of selectedIds) {
        const permission = permissions.find(p => p.id === id);
        if (permission.status === "Active") {
          await axios.put(`${API_PERMISSION}/update/${id}`, { 
            name: permission.name, 
            status: "Inactive" 
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Đã hủy kích hoạt ${successCount} quyền!`);
        fetchPermissions();
      } else {
        toast.info("Không có quyền nào được hủy kích hoạt!");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi hủy kích hoạt quyền!");
      console.error(err);
    }
  };

  // Xử lý kích hoạt hàng loạt
  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một quyền!");
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn kích hoạt ${selectedIds.length} quyền đã chọn?`))
      return;
    
    try {
      const token = localStorage.getItem("accessToken");
      let successCount = 0;

      for (const id of selectedIds) {
        const permission = permissions.find(p => p.id === id);
        if (permission.status !== "Active") {
          await axios.put(`${API_PERMISSION}/update/${id}`, { 
            name: permission.name, 
            status: "Active" 
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Đã kích hoạt ${successCount} quyền!`);
        fetchPermissions();
      } else {
        toast.info("Không có quyền nào được kích hoạt!");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi kích hoạt quyền!");
      console.error(err);
    }
  };

  // Lọc quyền theo tên
  const filteredPermissions = permissions.filter(permission => 
    permission?.name?.toLowerCase().includes(filterName.toLowerCase())
  );

  // Cấu hình columns cho Table component
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={filteredPermissions.length > 0 && selectedIds.length === filteredPermissions.length}
          onChange={e => {
            if (e.target.checked) {
              setSelectedIds(filteredPermissions.map(permission => permission.id));
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
      title: "Tên quyền" 
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

  return (
    <div className={styles.permissionManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý quyền cơ bản</h1>
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
              setShowAddModal(true);
            }}
          >
            + Thêm quyền mới
          </Button>
          <Button 
            onClick={fetchPermissions} 
            variant="secondary"
            size="small"
            style={{ marginLeft: 8 }}
          >
            🔄 Làm mới
          </Button>
          <Button 
            variant="secondary"
            size="small"
            onClick={() => navigate("/admin/permissions")}
          >
            Quản lý quyền chi tiết
          </Button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Danh sách quyền</h2>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Tìm kiếm quyền..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        
        <div className={styles.bulkActions}>
          <Button
            variant="danger"
            disabled={selectedIds.length === 0}
            onClick={handleBulkDelete}
          >
            Xoá đã chọn ({selectedIds.length})
          </Button>
          <Button
            variant="danger"
            disabled={selectedIds.length === 0}
            onClick={handleBulkDeactivate}
            style={{ marginLeft: 8 }}
          >
            Hủy kích hoạt đã chọn
          </Button>
          <Button
            variant="success"
            disabled={selectedIds.length === 0}
            onClick={handleBulkActivate}
            style={{ marginLeft: 8 }}
          >
            Kích hoạt đã chọn
          </Button>
        </div>

        <Table
          columns={columns}
          data={filteredPermissions}
          loading={loading}
        />
      </div>

      {/* Modal thêm/sửa quyền */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setForm(initialForm);
          setEditingId(null);
        }}
        title={editingId ? "Cập nhật quyền" : "Thêm quyền mới"}
      >
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tên quyền</label>
            <input
              id="name"
              placeholder="Nhập tên quyền"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          
          {editingId && (
            <div className={styles.formGroup}>
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                required
                className={styles.formInput}
              >
                <option value="Active">Kích hoạt</option>
                <option value="Inactive">Hủy kích hoạt</option>
              </select>
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
                setShowAddModal(false);
                setForm(initialForm);
                setEditingId(null);
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

export default BasicPermissionManager;