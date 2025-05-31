import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import styles from "./DepartmentManager.module.scss";

const API_BASE = "https://localhost:7193/Department";

const initialForm = {
  departmentCode: "",
  departmentName: "",
  description: "",
};

const DepartmentManager = () => {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(initialForm);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Lấy danh sách phòng ban
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/list`);
      setDepartments(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách phòng ban!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Thêm hoặc cập nhật phòng ban
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/update/${editingId}`, form);
        toast.success("Cập nhật thành công!");
      } else {
        await axios.post(`${API_BASE}/add`, form);
        toast.success("Thêm thành công!");
      }
      setForm(initialForm);
      setEditingId(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/add`, addForm);
      toast.success("Thêm thành công!");
      setAddForm(initialForm);
      setShowAddModal(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      await axios.put(`${API_BASE}/soft-delete/${id}`);
      toast.success("Hủy kích hoạt thành công!");
      fetchDepartments();
    } catch (err) {
      toast.error("Lỗi Hủy kích hoạt!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    if (!window.confirm("Xác nhận xoá cứng phòng ban này? Thao tác này không thể khôi phục!")) return;
    try {
      await axios.delete(`${API_BASE}/hard-delete/${id}`);
      toast.success("Xoá cứng thành công!");
      fetchDepartments();
    } catch (err) {
      toast.error("Lỗi xoá cứng!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      await axios.put(`${API_BASE}/reactivate/${id}`);
      toast.success("Kích hoạt lại thành công!");
      fetchDepartments();
    } catch (err) {
      toast.error("Lỗi kích hoạt lại!");
    }
  };

  // Chọn để sửa
  const handleEdit = (dep) => {
    setForm({
      departmentCode: dep.departmentCode,
      departmentName: dep.departmentName,
      description: dep.description || "",
    });
    setEditingId(dep.id);
  };

  // Reset form
  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  // Đặt filteredDepartments lên trước
  const filteredDepartments = departments.filter(dep => {
    if (!dep || typeof dep.status === "undefined") return false;
    if (filterStatus !== "all" && dep.status !== (filterStatus === "active" ? "Active" : "Inactive")) return false;
    if (filterCode && !dep.departmentCode.toLowerCase().includes(filterCode.toLowerCase())) return false;
    if (filterName && !dep.departmentName.toLowerCase().includes(filterName.toLowerCase())) return false;
    return true;
  });

  // Cấu hình columns cho Table component
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={filteredDepartments.length > 0 && selectedIds.length === filteredDepartments.length}
          onChange={e => {
            if (e.target.checked) {
              setSelectedIds(filteredDepartments.map(dep => dep.id));
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
      key: "departmentCode", 
      title: "Mã phòng ban" 
    },
    { 
      key: "departmentName", 
      title: "Tên phòng ban" 
    },
    { 
      key: "description", 
      title: "Mô tả",
      render: (value) => value || "N/A"
    },
    { 
      key: "status", 
      title: "Trạng thái",
      render: (value) =>
        value ? (
          <span className={`${styles.statusBadge} ${value === "Active" ? styles.active : styles.inactive}`}>
            {value}
          </span>
        ) : (
          <span className={styles.statusBadge}>N/A</span>
        ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (value, row) => (
        <ActionMenu
          row={row}
          onEdit={handleEdit}
          onSoftDelete={handleSoftDelete}
          onHardDelete={handleHardDelete}
          onReactivate={handleReactivate}
        />
      ),
    },
  ];

  // Thao tác hàng loạt
  const handleBulkSoftDelete = async () => {
    if (!window.confirm("Xác nhận hủy kích hoạt các phòng ban đã chọn?")) return;
    for (const id of selectedIds) {
      await handleSoftDelete(id);
    }
    setSelectedIds([]);
  };

  const handleBulkReactivate = async () => {
    if (!window.confirm("Xác nhận kích hoạt lại các phòng ban đã chọn?")) return;
    for (const id of selectedIds) {
      await handleReactivate(id);
    }
    setSelectedIds([]);
  };

  const handleBulkHardDelete = async () => {
    if (!window.confirm("Xác nhận xoá cứng các phòng ban đã chọn? Thao tác này không thể khôi phục!")) return;
    for (const id of selectedIds) {
      await handleHardDelete(id);
    }
    setSelectedIds([]);
  };

  return (
    <div className={styles.departmentManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý phòng ban</h1>
        <div className={styles.refreshButton}>
          <Button 
            onClick={fetchDepartments} 
            variant="secondary"
            size="small"
          >
            🔄 Làm mới
          </Button>
        </div>
      </header>

      <div className={styles.formContainer}>
        <h2 className={styles.formTitle}>{editingId ? "Cập nhật phòng ban" : "Thêm phòng ban mới"}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="departmentCode">Mã phòng ban</label>
            <input
              id="departmentCode"
              placeholder="Nhập mã phòng ban"
              value={form.departmentCode}
              onChange={e => setForm({ ...form, departmentCode: e.target.value })}
              required
              disabled={!!editingId}
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="departmentName">Tên phòng ban</label>
            <input
              id="departmentName"
              placeholder="Nhập tên phòng ban"
              value={form.departmentName}
              onChange={e => setForm({ ...form, departmentName: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              placeholder="Nhập mô tả (không bắt buộc)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={styles.formInput}
              rows={3}
            />
          </div>
          
          <div className={styles.formActions}>
            <Button type="submit" variant={editingId ? "success" : "primary"}>
              {editingId ? "Cập nhật" : "Thêm mới"}
            </Button>
            
            {editingId && (
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Huỷ
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Danh sách phòng ban</h2>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            + Thêm mới
          </Button>
        </div>
        <div className={styles.filterBar}>
          <label>Lọc trạng thái: </label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã hủy kích hoạt</option>
          </select>
          <input
            type="text"
            placeholder="Lọc mã phòng ban"
            value={filterCode}
            onChange={e => setFilterCode(e.target.value)}
            className={styles.filterInput}
            style={{ marginLeft: 8 }}
          />
          <input
            type="text"
            placeholder="Lọc tên phòng ban"
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            className={styles.filterInput}
            style={{ marginLeft: 8 }}
          />
        </div>
        <div className={styles.bulkActions}>
          <Button
            variant="danger"
            disabled={selectedIds.length === 0}
            onClick={() => handleBulkSoftDelete()}
          >
            Hủy kích hoạt đã chọn
          </Button>
          <Button
            variant="primary"
            disabled={selectedIds.length === 0}
            onClick={() => handleBulkReactivate()}
            style={{ marginLeft: 8 }}
          >
            Kích hoạt đã chọn
          </Button>
          <Button
            variant="danger"
            disabled={selectedIds.length === 0}
            onClick={() => handleBulkHardDelete()}
            style={{ marginLeft: 8 }}
          >
            Xoá cứng đã chọn
          </Button>
        </div>
        <Table
          columns={columns}
          data={filteredDepartments}
          loading={loading}
        />
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          {modalContent}
        </Modal>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm phòng ban mới"
      >
        <form onSubmit={handleAddDepartment} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="add-departmentCode">Mã phòng ban</label>
            <input
              id="add-departmentCode"
              placeholder="Nhập mã phòng ban"
              value={addForm.departmentCode}
              onChange={e => setAddForm({ ...addForm, departmentCode: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="add-departmentName">Tên phòng ban</label>
            <input
              id="add-departmentName"
              placeholder="Nhập tên phòng ban"
              value={addForm.departmentName}
              onChange={e => setAddForm({ ...addForm, departmentName: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="add-description">Mô tả</label>
            <textarea
              id="add-description"
              placeholder="Nhập mô tả (không bắt buộc)"
              value={addForm.description}
              onChange={e => setAddForm({ ...addForm, description: e.target.value })}
              className={styles.formInput}
              rows={3}
            />
          </div>
          <div className={styles.formActions}>
            <Button type="submit" variant="primary">Thêm mới</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Huỷ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ActionMenu = ({ row, onEdit, onSoftDelete, onHardDelete, onReactivate }) => {
  const [open, setOpen] = useState(false);

  if (!row || typeof row.status === "undefined") return null;

  return (
    <div className={styles.actionMenuWrapper}>
      <button
        style={{ display: "inline-block", zIndex: 1000, background: "#eee", color: "#000" }}
        className={styles.actionMenuButton}
        onClick={() => setOpen((v) => !v)}
        title="Chức năng"
        type="button"
      >
        &#33;
      </button>
      {open && (
        <div className={styles.actionMenuDropdown}>
          <button onClick={() => { setOpen(false); onEdit(row); }}>Sửa</button>
          {row.status === "Active" && (
            <button
              onClick={() => {
                setOpen(false);
                if (window.confirm("Xác nhận hủy kích hoạt phòng ban này?")) {
                  onSoftDelete(row.id);
                }
              }}
            >
              Huỷ kích hoạt
            </button>
          )}
          {row.status === "Inactive" && (
            <button onClick={() => { setOpen(false); onReactivate(row.id); }}>Kích hoạt</button>
          )}
          <button onClick={() => { setOpen(false); onHardDelete(row.id); }}>Xoá cứng</button>
        </div>
      )}
    </div>
  );
};

export default DepartmentManager;