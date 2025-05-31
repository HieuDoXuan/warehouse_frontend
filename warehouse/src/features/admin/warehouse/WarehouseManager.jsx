import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import styles from "./WarehouseManager.module.scss";
import { formatDateTime } from "../../../utils/dateUtils";
import { useNavigate } from "react-router-dom";

const API_WAREHOUSE = "https://localhost:7193/Warehouse";

const initialForm = {
  warehouseCode: "",
  warehouseName: "",
  address: "",
  description: "",
  status: "Active",
};

const WarehouseManager = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userId = currentUser?.id;

  // Lấy danh sách kho
  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_WAREHOUSE}/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWarehouses(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách kho!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Xử lý thêm/cập nhật kho
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      
      const payload = {
        ...form,
        createdBy: userId,
        updatedBy: userId,
      };
      
      if (editingId) {
        await axios.put(`${API_WAREHOUSE}/update/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Cập nhật kho thành công!");
      } else {
        await axios.post(`${API_WAREHOUSE}/add`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Thêm kho mới thành công!");
      }
      
      setForm(initialForm);
      setEditingId(null);
      setShowModal(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thao tác với kho!");
      console.error(err);
    }
  };

  // Xử lý xóa cứng kho
  const handleHardDelete = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_WAREHOUSE}/hard-delete/${id}?updatedBy=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Xóa kho thành công!");
      fetchWarehouses();
      setSelectedIds(prevIds => prevIds.filter(prevId => prevId !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa kho!");
      console.error(err);
    }
  };

  // Xử lý xóa mềm kho
  const handleSoftDelete = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_WAREHOUSE}/soft-delete/${id}?updatedBy=${userId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Hủy kích hoạt kho thành công!");
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể hủy kích hoạt kho!");
      console.error(err);
    }
  };

  // Xử lý kích hoạt lại kho
  const handleReactivate = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_WAREHOUSE}/reactivate/${id}?updatedBy=${userId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Kích hoạt lại kho thành công!");
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể kích hoạt lại kho!");
      console.error(err);
    }
  };

  // Xử lý xóa hàng loạt
  const handleBulkHardDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setConfirmAction({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} kho đã chọn?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          let successCount = 0;
          let failCount = 0;
          
          for (const id of selectedIds) {
            try {
              await axios.delete(`${API_WAREHOUSE}/hard-delete/${id}?updatedBy=${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              successCount++;
            } catch (err) {
              failCount++;
              console.error(`Lỗi xóa kho ${id}:`, err);
            }
          }
          
          if (successCount > 0) {
            toast.success(`Đã xóa ${successCount} kho thành công!`);
          }
          
          if (failCount > 0) {
            toast.error(`Không thể xóa ${failCount} kho!`);
          }
          
          fetchWarehouses();
          setSelectedIds([]);
        } catch (err) {
          toast.error("Có lỗi xảy ra khi xóa kho!");
          console.error(err);
        }
      }
    });
  };

  // Xử lý hủy kích hoạt hàng loạt
  const handleBulkSoftDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setConfirmAction({
      title: "Xác nhận hủy kích hoạt",
      message: `Bạn có chắc chắn muốn hủy kích hoạt ${selectedIds.length} kho đã chọn?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          let successCount = 0;
          let failCount = 0;
          
          for (const id of selectedIds) {
            try {
              await axios.put(`${API_WAREHOUSE}/soft-delete/${id}?updatedBy=${userId}`, {}, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              successCount++;
            } catch (err) {
              failCount++;
              console.error(`Lỗi hủy kích hoạt kho ${id}:`, err);
            }
          }
          
          if (successCount > 0) {
            toast.success(`Đã hủy kích hoạt ${successCount} kho thành công!`);
          }
          
          if (failCount > 0) {
            toast.error(`Không thể hủy kích hoạt ${failCount} kho!`);
          }
          
          fetchWarehouses();
          setSelectedIds([]);
        } catch (err) {
          toast.error("Có lỗi xảy ra khi hủy kích hoạt kho!");
          console.error(err);
        }
      }
    });
  };

  // Xử lý kích hoạt hàng loạt
  const handleBulkReactivate = async () => {
    if (selectedIds.length === 0) return;
    
    setConfirmAction({
      title: "Xác nhận kích hoạt",
      message: `Bạn có chắc chắn muốn kích hoạt lại ${selectedIds.length} kho đã chọn?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          let successCount = 0;
          let failCount = 0;
          
          for (const id of selectedIds) {
            try {
              await axios.put(`${API_WAREHOUSE}/reactivate/${id}?updatedBy=${userId}`, {}, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              successCount++;
            } catch (err) {
              failCount++;
              console.error(`Lỗi kích hoạt lại kho ${id}:`, err);
            }
          }
          
          if (successCount > 0) {
            toast.success(`Đã kích hoạt lại ${successCount} kho thành công!`);
          }
          
          if (failCount > 0) {
            toast.error(`Không thể kích hoạt lại ${failCount} kho!`);
          }
          
          fetchWarehouses();
          setSelectedIds([]);
        } catch (err) {
          toast.error("Có lỗi xảy ra khi kích hoạt lại kho!");
          console.error(err);
        }
      }
    });
  };

  // Xử lý click nút sửa
  const handleEdit = (warehouse) => {
    setForm({
      warehouseCode: warehouse.warehouseCode,
      warehouseName: warehouse.warehouseName,
      address: warehouse.address || "",
      description: warehouse.description || "",
      status: warehouse.status,
    });
    setEditingId(warehouse.id);
    setShowModal(true);
  };

  // Lọc kho
  const filteredWarehouses = warehouses.filter((warehouse) => {
    const matchStatus = filterStatus === "all" || warehouse.status.toLowerCase() === filterStatus.toLowerCase();
    const matchCode = warehouse.warehouseCode.toLowerCase().includes(filterCode.toLowerCase());
    const matchName = warehouse.warehouseName.toLowerCase().includes(filterName.toLowerCase());
    return matchStatus && matchCode && matchName;
  });

  // Cấu hình columns cho Table
  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={filteredWarehouses.length > 0 && selectedIds.length === filteredWarehouses.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(filteredWarehouses.map((warehouse) => warehouse.id));
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
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...prev, row.id]);
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== row.id));
            }
          }}
        />
      ),
    },
    { key: "id", title: "ID" },
    { key: "warehouseCode", title: "Mã kho" },
    { key: "warehouseName", title: "Tên kho" },
    { 
      key: "address", 
      title: "Địa chỉ",
      render: (value) => value || "N/A" 
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (value) => (
        <span className={value === "Active" ? styles.active : styles.inactive}>
          {value === "Active" ? "Đang hoạt động" : "Đã hủy kích hoạt"}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "Ngày tạo",
      render: (value) => (value ? formatDateTime(value) : "N/A"),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (value, row) => (
        <div className={styles.actionButtons}>
          <Button variant="primary" size="small" onClick={() => handleEdit(row)}>
            Sửa
          </Button>
          {row.status === "Active" ? (
            <Button
              variant="warning"
              size="small"
              onClick={() => {
                setConfirmAction({
                  title: "Xác nhận hủy kích hoạt",
                  message: `Bạn có chắc chắn muốn hủy kích hoạt kho "${row.warehouseName}"?`,
                  onConfirm: () => handleSoftDelete(row.id)
                });
              }}
            >
              Hủy kích hoạt
            </Button>
          ) : (
            <Button
              variant="success"
              size="small"
              onClick={() => {
                setConfirmAction({
                  title: "Xác nhận kích hoạt",
                  message: `Bạn có chắc chắn muốn kích hoạt lại kho "${row.warehouseName}"?`,
                  onConfirm: () => handleReactivate(row.id)
                });
              }}
            >
              Kích hoạt
            </Button>
          )}
          <Button
            variant="danger"
            size="small"
            onClick={() => {
              setConfirmAction({
                title: "Xác nhận xóa",
                message: `Bạn có chắc chắn muốn xóa vĩnh viễn kho "${row.warehouseName}"? Hành động này không thể hoàn tác!`,
                onConfirm: () => handleHardDelete(row.id)
              });
            }}
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.warehouseManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý kho</h1>
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
              setShowModal(true);
            }}
          >
            + Thêm kho mới
          </Button>
          <Button 
            onClick={fetchWarehouses} 
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
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã hủy kích hoạt</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Mã kho:</label>
            <input
              type="text"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              placeholder="Tìm theo mã kho"
              className={styles.filterInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label>Tên kho:</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Tìm theo tên kho"
              className={styles.filterInput}
            />
          </div>
        </div>

        <div className={styles.bulkActions}>
          <Button
            variant="danger"
            disabled={selectedIds.length === 0}
            onClick={handleBulkHardDelete}
          >
            Xóa vĩnh viễn đã chọn ({selectedIds.length})
          </Button>
          <Button
            variant="warning"
            disabled={selectedIds.length === 0}
            onClick={handleBulkSoftDelete}
            style={{ marginLeft: 8 }}
          >
            Hủy kích hoạt đã chọn
          </Button>
          <Button
            variant="success"
            disabled={selectedIds.length === 0}
            onClick={handleBulkReactivate}
            style={{ marginLeft: 8 }}
          >
            Kích hoạt lại đã chọn
          </Button>
        </div>

        <Table 
          columns={columns} 
          data={filteredWarehouses} 
          loading={loading} 
        />
      </div>

      {/* Modal thêm/sửa kho */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(initialForm);
          setEditingId(null);
        }}
        title={editingId ? "Cập nhật kho" : "Thêm kho mới"}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="warehouseCode">Mã kho</label>
            <input
              id="warehouseCode"
              placeholder="Nhập mã kho"
              value={form.warehouseCode}
              onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })}
              required
              disabled={!!editingId}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="warehouseName">Tên kho</label>
            <input
              id="warehouseName"
              placeholder="Nhập tên kho"
              value={form.warehouseName}
              onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address">Địa chỉ</label>
            <input
              id="address"
              placeholder="Nhập địa chỉ"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              placeholder="Nhập mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={styles.formTextarea}
              rows={3}
            />
          </div>

          {editingId && (
            <div className={styles.formGroup}>
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={styles.formSelect}
              >
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Đã hủy kích hoạt</option>
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

export default WarehouseManager;