import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../../../components/common/Button/Button.tsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // Thêm dòng này

const API_ORDER_APPROVAL = "https://localhost:7193/OrderApproval";
const API_APPROVAL_FLOW = "https://localhost:7193/ApprovalFlow/list";
const API_ORDERS = "https://localhost:7193/Order/list"; // Giả sử có API này

const OrderApprovalAdd = ({ onSuccess }) => {
  const navigate = useNavigate(); // Thêm dòng này
  const [flows, setFlows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    orderId: "",
    flowId: "",
    approvalStep: "",
    stepOrder: "",
    roleName: "",
    approved: false,
    approvedAt: null,
    approvedBy: null,
    note: "",
    createdBy: JSON.parse(localStorage.getItem("currentUser") || "{}").id || null,
  });

  useEffect(() => {
    // Lấy danh sách flow
    axios.get(API_APPROVAL_FLOW, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
    }).then(res => setFlows(res.data));
    // Lấy danh sách đơn hàng
    axios.get(API_ORDERS, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
    }).then(res => setOrders(res.data));
  }, []);

  // Khi chọn flowId thì tự động fill các trường liên quan
  const handleFlowChange = (flowId) => {
    const flow = flows.find(f => f.id === Number(flowId));
    setForm(f => ({
      ...f,
      flowId,
      approvalStep: flow ? flow.flowName : "",
      stepOrder: flow ? flow.stepOrder : "",
      roleName: flow ? flow.roleName : ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_ORDER_APPROVAL}/add`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      toast.success("Thêm phê duyệt đơn hàng thành công!");
      if (onSuccess) onSuccess();
      // Điều hướng sang trang danh sách phê duyệt đơn hàng
      navigate("/admin/order-approvals"); // Thay đổi đường dẫn nếu bạn dùng route khác
      setForm({
        orderId: "",
        flowId: "",
        approvalStep: "",
        stepOrder: "",
        roleName: "",
        approved: false,
        approvedAt: null,
        approvedBy: null,
        note: "",
        createdBy: JSON.parse(localStorage.getItem("currentUser") || "{}").id || null,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Đơn hàng</label>
        <select
          value={form.orderId}
          onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
          required
        >
          <option value="">Chọn đơn hàng</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>#{o.id} - {o.orderName || o.customerName}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Bước phê duyệt (flow)</label>
        <select
          value={form.flowId}
          onChange={e => handleFlowChange(e.target.value)}
          required
        >
          <option value="">Chọn bước phê duyệt</option>
          {flows.map(f => (
            <option key={f.id} value={f.id}>
              {f.flowName} - {f.orderType} - Bước {f.stepOrder} ({f.roleName})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Ghi chú</label>
        <input
          type="text"
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        />
      </div>
      <Button type="submit" variant="primary">Thêm phê duyệt</Button>
    </form>
  );
};

export default OrderApprovalAdd;