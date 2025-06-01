import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, DatePicker, InputNumber } from "antd";
import axios from "axios";
import dayjs from "dayjs";

// Helper lấy quyền từ currentUser
function getUserPermissions() {
  try {
    const userData = localStorage.getItem("currentUser");
    if (userData && userData !== "undefined") {
      const user = JSON.parse(userData);
      return user.permissions || [];
    }
  } catch {
    return [];
  }
  return [];
}

const STATUS_OPTIONS = [
  { value: "Pending", label: "Chờ xử lý" },
  { value: "Issued", label: "Đã xuất hóa đơn" },
  { value: "Cancelled", label: "Đã huỷ" }
];

const InvoiceManager = () => {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý hóa đơn") || permissions.includes("Xem tìm kiếm hóa đơn");
  const canAdd = permissions.includes("Quản lý hóa đơn") || permissions.includes("Thêm mới hóa đơn");
  const canEdit = permissions.includes("Quản lý hóa đơn");
  const canDelete = permissions.includes("Quản lý hóa đơn");

  useEffect(() => {
    if (canView) {
      fetchData();
      fetchOrders();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/Invoice/list");
      setData(res.data || []);
    } catch {
      message.error("Không thể tải danh sách hóa đơn!");
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Order/list");
      setOrders(res.data || []);
    } catch {
      message.error("Không thể tải đơn hàng!");
    }
  };

  // Thêm mới
  const handleAdd = async (values) => {
    const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (!userData.id) {
      message.error("Không xác định được người tạo!");
      return;
    }
    if (!values.invoiceCode || !values.orderId || !values.totalAmount) {
      message.error("Vui lòng nhập đầy đủ thông tin hóa đơn!");
      return;
    }
    try {
      const payload = {
        InvoiceCode: values.invoiceCode,
        OrderId: values.orderId,
        InvoiceDate: values.invoiceDate ? values.invoiceDate.format("YYYY-MM-DD") : null,
        TotalAmount: values.totalAmount,
        FileUrl: values.fileUrl ?? null,
        Note: values.note ?? null,
        CreatedBy: userData.id
      };
      await axios.post("https://localhost:7193/Invoice/add", payload);
      message.success("Thêm hóa đơn thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("Mã hóa đơn đã tồn tại!");
      } else {
        message.error(err.response?.data?.message || "Thêm hóa đơn thất bại!");
      }
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditing(record);
    editForm.setFieldsValue({
      invoiceCode: record.invoiceCode,
      orderId: record.orderId,
      invoiceDate: record.invoiceDate ? dayjs(record.invoiceDate) : null,
      totalAmount: record.totalAmount,
      fileUrl: record.fileUrl,
      note: record.note,
      status: record.status
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        InvoiceCode: editing.invoiceCode, // Thêm dòng này
        OrderId: editing.orderId,         // Thêm dòng này
        InvoiceDate: values.invoiceDate ? values.invoiceDate.format("YYYY-MM-DD") : null,
        TotalAmount: Number(values.totalAmount),
        Status: values.status,
        FileUrl: values.fileUrl ?? null,
        Note: values.note ?? null,
        UpdatedBy: userData.id
      };
      console.log("Payload update:", payload);
      if (!payload.TotalAmount || payload.TotalAmount <= 0 || !payload.Status || !payload.UpdatedBy) {
        message.error("Vui lòng nhập đầy đủ thông tin hóa đơn!");
        return;
      }
      await axios.put(`https://localhost:7193/Invoice/update/${editing.id}`, payload);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Invoice/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã huỷ hóa đơn!");
      fetchData();
    } catch {
      message.error("Huỷ hóa đơn thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Invoice/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại hóa đơn!");
      fetchData();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã hóa đơn", dataIndex: "invoiceCode", key: "invoiceCode" },
    { title: "Đơn hàng", dataIndex: "orderId", key: "orderId", render: id => orders.find(o => o.id === id)?.orderCode || "" },
    { title: "Ngày hóa đơn", dataIndex: "invoiceDate", key: "invoiceDate", render: v => v ? dayjs(v).format("DD/MM/YYYY") : "" },
    { title: "Tổng tiền", dataIndex: "totalAmount", key: "totalAmount", render: v => v?.toLocaleString("vi-VN") },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
    { title: "File", dataIndex: "fileUrl", key: "fileUrl", render: url => url ? <a href={url} target="_blank" rel="noopener noreferrer">Xem file</a> : "" },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <span>
          {canEdit && (
            <Button size="small" onClick={() => openEdit(record)} style={{ marginRight: 8 }}>
              Sửa
            </Button>
          )}
          {canDelete && (
            <>
              <Popconfirm
                title="Huỷ hóa đơn này?"
                onConfirm={() => handleSoftDelete(record.id)}
                okText="Huỷ"
                cancelText="Không"
              >
                <Button size="small" danger style={{ marginRight: 8 }}>Huỷ</Button>
              </Popconfirm>
              <Button size="small" onClick={() => handleReactivate(record.id)}>
                Kích hoạt lại
              </Button>
            </>
          )}
        </span>
      )
    }
  ];

  const openDetail = (record) => {
    setDetailRecord(record);
    setShowDetail(true);
  };

  if (!canView) {
    return <div>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div>
      <h2>Quản Lý Hóa Đơn</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới hóa đơn
        </Button>
      )}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        onRow={record => ({
          onClick: () => openDetail(record)
        })}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới hóa đơn"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="invoiceCode" label="Mã hóa đơn" rules={[{ required: true, message: "Nhập mã hóa đơn!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="orderId" label="Đơn hàng" rules={[{ required: true, message: "Chọn đơn hàng!" }]}>
            <select style={{ width: "100%", padding: 8 }}>
              <option value="">Chọn đơn hàng</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>{o.orderCode}</option>
              ))}
            </select>
          </Form.Item>
          <Form.Item name="invoiceDate" label="Ngày hóa đơn">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="totalAmount" label="Tổng tiền" rules={[{ required: true, message: "Nhập tổng tiền!" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="fileUrl" label="File hóa đơn">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa hóa đơn"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="invoiceDate" label="Ngày hóa đơn">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="totalAmount" label="Tổng tiền" rules={[{ required: true, message: "Nhập tổng tiền!" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="fileUrl" label="File hóa đơn">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Chọn trạng thái!" }]}>
            <select style={{ width: "100%", padding: 8 }}>
              <option value="">Chọn trạng thái</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết hóa đơn"
        open={showDetail}
        onCancel={() => setShowDetail(false)}
        footer={null}
      >
        {detailRecord && (
          <div>
            <h4>Thông tin hóa đơn</h4>
            <p><b>Mã hóa đơn:</b> {detailRecord.invoiceCode}</p>
            <p><b>Ngày hóa đơn:</b> {detailRecord.invoiceDate ? dayjs(detailRecord.invoiceDate).format("DD/MM/YYYY") : ""}</p>
            <p><b>Tổng tiền:</b> {detailRecord.totalAmount?.toLocaleString("vi-VN")}</p>
            <p><b>Trạng thái:</b> {STATUS_OPTIONS.find(opt => opt.value === detailRecord.status)?.label || detailRecord.status}</p>
            <p><b>File:</b> {detailRecord.fileUrl ? <a href={detailRecord.fileUrl} target="_blank" rel="noopener noreferrer">Xem file</a> : ""}</p>
            <p><b>Ghi chú:</b> {detailRecord.note}</p>
            <hr />
            <h4>Thông tin đơn hàng</h4>
            {(() => {
              const order = orders.find(o => o.id === detailRecord.orderId);
              if (!order) return <p>Không tìm thấy đơn hàng.</p>;
              return (
                <div>
                  <p><b>Mã đơn hàng:</b> {order.orderCode}</p>
                  <p><b>Khách hàng:</b> {order.customerName}</p>
                  <p><b>Ngày tạo:</b> {order.createdAt ? dayjs(order.createdAt).format("DD/MM/YYYY") : ""}</p>
                  <p><b>Tổng tiền đơn hàng:</b> {order.totalAmount?.toLocaleString("vi-VN")}</p>
                  {/* Thêm các trường khác nếu cần */}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceManager;