import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./OrderApprovalManager.module.scss";
import { useNavigate } from "react-router-dom";

const API_ORDER_APPROVAL = "https://localhost:7193/OrderApproval";

const OrderApprovalManager = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOrderId, setFilterOrderId] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();

  // Fetch approvals
  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const params = {};
      if (filterOrderId) params.orderId = filterOrderId;
      const res = await axios.get(`${API_ORDER_APPROVAL}/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setApprovals(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách phê duyệt!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // eslint-disable-next-line
  }, [filterOrderId]);

  // Xoá phê duyệt
  const handleDelete = (id) => {
    setConfirmAction({
      title: "Xác nhận xoá",
      message: "Bạn có chắc chắn muốn xoá phê duyệt này?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await axios.delete(`${API_ORDER_APPROVAL}/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Đã xoá phê duyệt!");
          fetchApprovals();
        } catch (err) {
          toast.error("Lỗi khi xoá!");
        }
      }
    });
  };

  // Table columns
  const columns = [
    { key: "orderId", title: "Mã đơn hàng" },
    { key: "flowId", title: "Flow ID" },
    { key: "approvalStep", title: "Tên bước phê duyệt" },
    { key: "stepOrder", title: "Thứ tự bước" },
    { key: "roleName", title: "Vai trò phê duyệt" },
    {
      key: "approved",
      title: "Đã duyệt",
      render: v => v ? <span className={styles.approved}>✔</span> : <span className={styles.notApproved}>✗</span>,
    },
    {
      key: "approvedAt",
      title: "Ngày duyệt",
      render: v => v ? new Date(v).toLocaleString() : "—"
    },
    { key: "note", title: "Ghi chú", render: v => v || "—" },
    {
      key: "actions",
      title: "Thao tác",
      render: (v, row) => (
        <div className={styles.actionButtons}>
          {/* Có thể thêm nút sửa ở đây nếu muốn */}
          <Button size="small" variant="danger" onClick={() => handleDelete(row.id)}>
            Xoá
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.orderApprovalManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <h1>Quản lý phê duyệt đơn hàng</h1>
        <Button
          variant="primary"
          onClick={() => navigate("/admin/order-approvals/add")}
        >
          + Thêm phê duyệt mới
        </Button>
      </header>

      <div className={styles.filterBar}>
        <input
          type="number"
          placeholder="Lọc theo mã đơn hàng"
          value={filterOrderId}
          onChange={e => setFilterOrderId(e.target.value)}
          className={styles.filterInput}
        />
        <Button variant="secondary" onClick={fetchApprovals}>Làm mới</Button>
      </div>

      <Table
        data={approvals}
        columns={columns}
        loading={loading}
        rowKey="id"
      />

      {/* Modal xác nhận xoá */}
      {confirmAction && (
        <div className={styles.confirmModal}>
          <div className={styles.confirmContent}>
            <h3>{confirmAction.title}</h3>
            <p>{confirmAction.message}</p>
            <div className={styles.confirmActions}>
              <Button
                variant="danger"
                onClick={() => {
                  confirmAction.onConfirm();
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
        </div>
      )}
    </div>
  );
};

export default OrderApprovalManager;