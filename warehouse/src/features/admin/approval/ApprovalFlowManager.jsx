import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "../../../components/common/Modal/Modal.tsx";
import styles from "./ApprovalFlowManager.module.scss";

const API_APPROVAL = "https://localhost:7193/ApprovalFlow";

const initialForm = {
  flowName: "",
  orderType: "",
  stepOrder: 1,
  roleName: "",
  isFinalStep: false,
  note: "",
};

const ApprovalFlowManager = () => {
  const [flows, setFlows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [filterFlowName, setFilterFlowName] = useState("");
  const [filterOrderType, setFilterOrderType] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch approval flows
  const fetchFlows = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const params = {};
      if (filterFlowName) params.flowName = filterFlowName;
      if (filterOrderType) params.orderType = filterOrderType;
      if (filterStatus !== "all") params.status = filterStatus === "active" ? "Active" : "Inactive";
      const res = await axios.get(`${API_APPROVAL}/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setFlows(res.data);
    } catch (err) {
      toast.error("Không thể tải luồng phê duyệt!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
    // eslint-disable-next-line
  }, [filterFlowName, filterOrderType, filterStatus]);

  // Thêm/sửa luồng phê duyệt
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (editingId) {
        await axios.put(`${API_APPROVAL}/update/${editingId}`, {
          ...form,
          updatedBy: currentUser.id || null,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Cập nhật thành công!");
      } else {
        await axios.post(`${API_APPROVAL}/add`, {
          ...form,
          createdBy: currentUser.id || null,
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
      fetchFlows();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  // Sửa
  const handleEdit = (row) => {
    setForm({
      flowName: row.flowName,
      orderType: row.orderType,
      stepOrder: row.stepOrder,
      roleName: row.roleName,
      isFinalStep: row.isFinalStep,
      note: row.note || "",
    });
    setEditingId(row.id);
    setShowModal(true);
  };

  // Xoá mềm
  const handleSoftDelete = (id) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setConfirmAction({
      title: "Xác nhận xoá",
      message: "Bạn có chắc chắn muốn xoá (ẩn) bước phê duyệt này?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await axios.put(`${API_APPROVAL}/soft-delete/${id}?updatedBy=${currentUser.id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Đã xoá (ẩn) bước phê duyệt!");
          fetchFlows();
        } catch (err) {
          toast.error("Lỗi khi xoá!");
        }
      }
    });
  };

  // Kích hoạt lại
  const handleReactivate = (id) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setConfirmAction({
      title: "Kích hoạt lại",
      message: "Bạn có chắc chắn muốn kích hoạt lại bước phê duyệt này?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await axios.put(`${API_APPROVAL}/reactivate/${id}?updatedBy=${currentUser.id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Đã kích hoạt lại!");
          fetchFlows();
        } catch (err) {
          toast.error("Lỗi khi kích hoạt lại!");
        }
      }
    });
  };

  // Table columns
  const columns = [
    { key: "flowName", title: "Tên quy trình" },
    { key: "orderType", title: "Loại đơn" },
    { key: "stepOrder", title: "Thứ tự bước" },
    { key: "roleName", title: "Vai trò phê duyệt" },
    {
      key: "isFinalStep",
      title: "Bước cuối",
      render: v => v ? <span className={styles.active}>✔</span> : "",
    },
    {
      key: "status",
      title: "Trạng thái",
      render: v => (
        <span className={v === "Active" ? styles.active : styles.inactive}>
          {v === "Active" ? "Đang hoạt động" : "Đã ẩn"}
        </span>
      ),
    },
    { key: "note", title: "Ghi chú", render: v => v || "—" },
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
    <div className={styles.approvalManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <h1>Quản lý luồng phê duyệt</h1>
        <Button
          variant="primary"
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setShowModal(true);
          }}
        >
          + Thêm bước phê duyệt
        </Button>
      </header>

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Tìm theo tên quy trình"
          value={filterFlowName}
          onChange={e => setFilterFlowName(e.target.value)}
          className={styles.filterInput}
        />
        <input
          type="text"
          placeholder="Tìm theo loại đơn"
          value={filterOrderType}
          onChange={e => setFilterOrderType(e.target.value)}
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
        data={flows}
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
        title={editingId ? "Chỉnh sửa bước phê duyệt" : "Thêm bước phê duyệt"}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Tên quy trình</label>
            <input
              type="text"
              value={form.flowName}
              onChange={e => setForm({ ...form, flowName: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Loại đơn</label>
            <input
              type="text"
              value={form.orderType}
              onChange={e => setForm({ ...form, orderType: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Thứ tự bước</label>
            <input
              type="number"
              value={form.stepOrder}
              min={1}
              onChange={e => setForm({ ...form, stepOrder: Number(e.target.value) })}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Vai trò phê duyệt</label>
            <input
              type="text"
              value={form.roleName}
              onChange={e => setForm({ ...form, roleName: e.target.value })}
              required
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={form.isFinalStep}
                onChange={e => setForm({ ...form, isFinalStep: e.target.checked })}
              />
              &nbsp;Bước cuối cùng
            </label>
          </div>
          <div className={styles.formGroup}>
            <label>Ghi chú</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className={styles.formInput}
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

export default ApprovalFlowManager;