import React, { useEffect, useState } from "react";
import { Table, Button, Modal, message, Tag, Input } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import "./OrderApprovalManager.css";

const OrderApprovalManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/OrderApproval/list");
      setData(res.data || []);
    } catch {
      message.error("Không thể tải danh sách phê duyệt!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = (record, approved) => {
    setSelected({ ...record, approved });
    setNote("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(
        `https://localhost:7193/OrderApproval/update/${selected.id}`,
        {
          ...selected,
          Approved: selected.approved,
          ApprovedAt: new Date(),
          ApprovedBy: userData.id,
          Note: note,
        }
      );
      message.success("Cập nhật phê duyệt thành công!");
      setShowModal(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  const columns = [
    { title: "Mã đơn", dataIndex: "orderId", key: "orderId" },
    { title: "Bước duyệt", dataIndex: "approvalStep", key: "approvalStep" },
    { title: "Vai trò", dataIndex: "roleName", key: "roleName" },
    {
      title: "Trạng thái",
      dataIndex: "approved",
      key: "approved",
      render: (v) =>
        v === true ? <Tag color="green">Đã duyệt</Tag> : <Tag color="orange">Chờ duyệt</Tag>,
    },
    {
      title: "Người duyệt",
      dataIndex: "approvedBy",
      key: "approvedBy",
      render: (v) => (v ? v : "-"),
    },
    {
      title: "Thời gian duyệt",
      dataIndex: "approvedAt",
      key: "approvedAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
    },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) =>
        record.approved ? null : (
          <span className="order-approval-action">
            <Button
              type="primary"
              size="small"
              style={{ marginRight: 8 }}
              onClick={() => handleApprove(record, true)}
            >
              Duyệt
            </Button>
            <Button
              danger
              size="small"
              onClick={() => handleApprove(record, false)}
            >
              Từ chối
            </Button>
          </span>
        ),
    },
  ];

  return (
    <div>
      <h2 className="order-approval-title">Duyệt đơn hàng</h2>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="order-approval-table"
      />

      <Modal
        title={selected?.approved ? "Xác nhận duyệt đơn" : "Xác nhận từ chối"}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSubmit}
        okText={selected?.approved ? "Duyệt" : "Từ chối"}
        cancelText="Hủy"
      >
        <p>
          {selected?.approved
            ? "Bạn có chắc chắn muốn duyệt bước này?"
            : "Bạn có chắc chắn muốn từ chối bước này?"}
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Ghi chú (nếu có)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default OrderApprovalManager;