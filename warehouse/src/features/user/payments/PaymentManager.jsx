import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, Select, DatePicker, InputNumber } from "antd";
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
  { value: "Completed", label: "Đã thanh toán" },
  { value: "Cancelled", label: "Đã huỷ" }
];

const METHOD_OPTIONS = [
  { value: "Chuyển khoản", label: "Chuyển khoản" },
  { value: "Tiền mặt", label: "Tiền mặt" },
  { value: "Khác", label: "Khác" }
];

const PaymentManager = () => {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý thanh toán") || permissions.includes("Xem tìm kiếm thanh toán");
  const canAdd = permissions.includes("Quản lý thanh toán");
  const canEdit = permissions.includes("Quản lý thanh toán") || permissions.includes("Cập nhật thanh toán");
  const canDelete = permissions.includes("Quản lý thanh toán");

  useEffect(() => {
    if (canView) {
      fetchData();
      fetchOrders();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/Payment/list");
      setData(res.data || []);
    } catch {
      message.error("Không thể tải danh sách thanh toán!");
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
    if (!values.orderId || !values.paymentCode || !values.amount || !values.paymentMethod) {
      message.error("Vui lòng nhập đầy đủ thông tin thanh toán!");
      return;
    }
    try {
      const payload = {
        OrderId: values.orderId,
        PaymentCode: values.paymentCode,
        PaymentDate: values.paymentDate ? values.paymentDate.format("YYYY-MM-DD") : null,
        Amount: values.amount,
        PaymentMethod: values.paymentMethod,
        Note: values.note ?? null,
        CreatedBy: userData.id // phải là GUID hợp lệ
      };
      console.log("Payload gửi lên:", payload); // Thêm dòng này
      await axios.post("https://localhost:7193/Payment/add", payload);
      message.success("Thêm thanh toán thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("Mã thanh toán đã tồn tại!");
      } else {
        message.error(err.response?.data?.message || "Thêm thanh toán thất bại!");
      }
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditing(record);
    editForm.setFieldsValue({
      orderId: record.orderId,
      paymentCode: record.paymentCode,
      paymentDate: record.paymentDate ? dayjs(record.paymentDate) : null,
      amount: record.amount,
      paymentMethod: record.paymentMethod,
      note: record.note,
      status: record.status
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        OrderId: editing.orderId, // Thêm dòng này
        PaymentCode: editing.paymentCode, // Thêm dòng này
        PaymentDate: values.paymentDate ? values.paymentDate.format("YYYY-MM-DD") : null,
        Amount: values.amount,
        PaymentMethod: values.paymentMethod,
        Status: values.status,
        Note: values.note ?? null,
        UpdatedBy: userData.id
      };
      await axios.put(`https://localhost:7193/Payment/update/${editing.id}`, payload);
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
      await axios.put(`https://localhost:7193/Payment/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã huỷ thanh toán!");
      fetchData();
    } catch {
      message.error("Huỷ thanh toán thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Payment/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại thanh toán!");
      fetchData();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã thanh toán", dataIndex: "paymentCode", key: "paymentCode" },
    { title: "Đơn hàng", dataIndex: "orderId", key: "orderId", render: id => orders.find(o => o.id === id)?.orderCode || "" },
    { title: "Ngày thanh toán", dataIndex: "paymentDate", key: "paymentDate", render: v => v ? dayjs(v).format("DD/MM/YYYY") : "" },
    { title: "Số tiền", dataIndex: "amount", key: "amount", render: v => v?.toLocaleString("vi-VN") },
    { title: "Phương thức", dataIndex: "paymentMethod", key: "paymentMethod" },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
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
                title="Huỷ thanh toán này?"
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

  if (!canView) {
    return <div>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div>
      <h2>Quản Lý Thanh Toán</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới thanh toán
        </Button>
      )}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới thanh toán"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="orderId" label="Đơn hàng" rules={[{ required: true, message: "Chọn đơn hàng!" }]}>
            <Select
              showSearch
              placeholder="Chọn đơn hàng"
              options={orders.map(o => ({ value: o.id, label: o.orderCode }))}
            />
          </Form.Item>
          <Form.Item name="paymentCode" label="Mã thanh toán" rules={[{ required: true, message: "Nhập mã thanh toán!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="paymentDate" label="Ngày thanh toán">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: "Nhập số tiền!" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Phương thức" rules={[{ required: true, message: "Chọn phương thức!" }]}>
            <Select
              allowClear
              placeholder="Chọn phương thức"
              options={METHOD_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa thanh toán"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="paymentDate" label="Ngày thanh toán">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: "Nhập số tiền!" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Phương thức" rules={[{ required: true, message: "Chọn phương thức!" }]}>
            <Select
              allowClear
              placeholder="Chọn phương thức"
              options={METHOD_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Chọn trạng thái!" }]}>
            <Select
              allowClear
              placeholder="Chọn trạng thái"
              options={STATUS_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentManager;