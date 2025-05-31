import React, { useState } from "react";
import axios from "axios";
import { Table } from "../../../components/common/Table/Table.tsx";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./OrderLogList.module.scss";

const API_ORDER_LOG = "https://localhost:7193/OrderLog/list";
const API_USER_BY_IDS = "https://localhost:7193/User/by-ids";

const OrderLogList = () => {
  const [orderId, setOrderId] = useState("");
  const [logs, setLogs] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!orderId) {
      toast.warning("Vui lòng nhập mã đơn hàng!");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(API_ORDER_LOG, {
        headers: { Authorization: `Bearer ${token}` },
        params: { orderId }
      });
      setLogs(res.data);

      // Lấy danh sách userIds từ logs
      const userIds = Array.from(new Set(res.data.map(log => log.performedBy).filter(Boolean)));
      if (userIds.length > 0) {
        const usersRes = await axios.get(API_USER_BY_IDS, {
          params: { ids: userIds.join(",") },
          headers: { Authorization: `Bearer ${token}` }
        });
        const map = {};
        usersRes.data.forEach(u => { map[u.id] = u.fullName || u.username; });
        setUserMap(map);
      } else {
        setUserMap({});
      }

      if (res.data.length === 0) toast.info("Không có log cho đơn hàng này.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải log đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "logTime", title: "Thời gian", render: v => v ? new Date(v).toLocaleString() : "—" },
    { key: "action", title: "Hành động" },
    { key: "oldStatus", title: "Trạng thái cũ", render: v => v || "—" },
    { key: "newStatus", title: "Trạng thái mới", render: v => v || "—" },
    { key: "note", title: "Ghi chú", render: v => v || "—" },
    { key: "performedBy", title: "Người thực hiện", render: v => userMap[v] || v || "—" },
    { key: "details", title: "Chi tiết", render: v => v || "—" },
  ];

  return (
    <div className={styles.orderLogList}>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <h1>Danh sách ghi log đơn hàng</h1>
      </header>
      <div className={styles.filterBar}>
        <input
          type="number"
          placeholder="Nhập mã đơn hàng"
          value={orderId}
          onChange={e => setOrderId(e.target.value)}
          className={styles.filterInput}
        />
        <Button variant="primary" onClick={fetchLogs}>Xem log</Button>
      </div>
      <Table
        data={logs}
        columns={columns}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
};

export default OrderLogList;