import React, { useEffect, useState } from "react";
import { Table, Button, message, Card } from "antd";
import axios from "axios";
import "./warehouse.css";

const InventoryApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/InventoryTransactionApproval/list");
      setRequests(res.data || []);
    } catch {
      message.error("Không lấy được danh sách yêu cầu xuất kho!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`/InventoryTransactionApproval/approve/${id}?approvedBy=${userData.id}`);
      message.success("Phê duyệt thành công!");
      fetchRequests();
    } catch (err) {
      message.error(err.response?.data?.message || "Phê duyệt thất bại!");
    }
  };

  return (
    <Card className="warehouse-card" title="Nhập kho">
      <Table
        dataSource={requests}
        rowKey="id"
        loading={loading}
        columns={[
          { title: "Mã phiếu", dataIndex: "referenceCode" },
          { title: "Người tạo", dataIndex: "createdBy" },
          { title: "Trạng thái", dataIndex: "approved", render: v => v ? "Đã duyệt" : "Chờ duyệt" },
          {
            title: "Thao tác",
            render: (_, r) =>
              !r.approved && (
                <Button type="primary" onClick={() => handleApprove(r.id)}>
                  Duyệt
                </Button>
              )
          }
        ]}
      />
    </Card>
  );
};

export default InventoryApproval;