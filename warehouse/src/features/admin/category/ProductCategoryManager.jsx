import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import styles from "./ProductCategoryManager.module.scss";

const API_CATEGORY = "https://localhost:7193/ProductCategory";

const initialForm = {
  categoryCode: "",
  categoryName: "",
  description: "",
};

const ProductCategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKeyword, setFilterKeyword] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_CATEGORY}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      toast.error("Không thể tải danh mục!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Thêm/sửa danh mục
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      if (editingId) {
        await axios.put(`${API_CATEGORY}/update/${editingId}`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Cập nhật thành công!");
      } else {
        await axios.post(`${API_CATEGORY}/add`, {
          ...form,
          createdBy: JSON.parse(localStorage.getItem("currentUser") || "{}").id || null,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Thêm mới thành công!");
      }
      setForm(initialForm);
      setEditingId(null);
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  // Sửa
  const handleEdit = (cat) => {
    setForm({
      categoryCode: cat.categoryCode,
      categoryName: cat.categoryName,
      description: cat.description || "",
    });
    setEditingId(cat.id);
    setShowModal(true);
  };

  // Xoá mềm
  const handleSoftDelete = (id) => {
    setConfirmAction({
      title: "Xác nhận xoá",
      message: "Bạn có chắc chắn muốn xoá (ẩn) danh mục này?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await axios.put(`${API_CATEGORY}/soft-delete/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Đã xoá (ẩn) danh mục!");
          fetchCategories();
        } catch (err) {
          toast.error("Lỗi khi xoá!");
        }
      }
    });
  };

  // Kích hoạt lại
  const handleReactivate = (id) => {
    setConfirmAction({
      title: "Kích hoạt lại",
      message: "Bạn có chắc chắn muốn kích hoạt lại danh mục này?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await axios.put(`${API_CATEGORY}/reactivate/${id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Đã kích hoạt lại!");
          fetchCategories();
        } catch (err) {
          toast.error("Lỗi khi kích hoạt lại!");
        }
      }
    });
  };

  // Lọc dữ liệu
  const filteredCategories = categories.filter(cat => {
    if (filterStatus !== "all" && cat.status !== (filterStatus === "active" ? "Active" : "Inactive")) return false;
    if (filterKeyword && !(
      cat.categoryCode?.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      cat.categoryName?.toLowerCase().includes(filterKeyword.toLowerCase())
    )) return false;
    return true;
  });

  // Table columns
  const columns = [
    { key: "categoryCode", title: "Mã phân loại" },
    { key: "categoryName", title: "Tên phân loại" },
    { key: "description", title: "Mô tả", render: v => v || "—" },
    {
      key: "status",
      title: "Trạng thái",
      render: v => (
        <span className={v === "Active" ? styles.active : styles.inactive}>
          {v === "Active" ? "Đang hoạt động" : "Đã ẩn"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (v, row) => (
        <div className={styles.actionButtons}>
          <Button size="small" variant="primary" onClick={() => handleEdit(row)}>
            Sửa
          </Button>
          {row.status === "Active" ? (
            <Button size="small" variant="danger" onClick={() => handleSoftDelete(row.id)}>
              Ẩn
            </Button>
          ) : (
            <Button size="small" variant="success" onClick={() => handleReactivate(row.id)}>
              Kích hoạt lại
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.categoryManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <h1>Quản lý danh mục hàng hóa</h1>
        <Button
          variant="primary"
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setShowModal(true);
          }}
        >
          + Thêm danh mục mới
        </Button>
      </header>

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Tìm kiếm mã hoặc tên"
          value={filterKeyword}
          onChange={e => setFilterKeyword(e.target.value)}
          className={styles.filterInput}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã ẩn</option>
        </select>
      </div>

      <Table
        data={filteredCategories}
        columns={columns}
        loading={loading}
        rowKey="id"
      />

      {/* Modal thêm/sửa */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(initialForm);
          setEditingId(null);
        }}
        title={editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Mã phân loại</label>
            <input
              type="text"
              value={form.categoryCode}
              onChange={e => setForm({ ...form, categoryCode: e.target.value })}
              required
              disabled={!!editingId}
              className={styles.formInput}
              placeholder="VD: ELECTRONICS"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Tên phân loại</label>
            <input
              type="text"
              value={form.categoryName}
              onChange={e => setForm({ ...form, categoryName: e.target.value })}
              required
              className={styles.formInput}
              placeholder="VD: Điện tử"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={styles.formInput}
              placeholder="Mô tả ngắn"
            />
          </div>
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

export default ProductCategoryManager;