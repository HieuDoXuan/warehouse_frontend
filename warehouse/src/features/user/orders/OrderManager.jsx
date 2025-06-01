import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, Select, DatePicker } from "antd";
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

const ORDER_TYPES = [
  { value: "Sale", label: "Bán" },
  { value: "Purchase", label: "Nhập" },
  { value: "Internal", label: "Nội bộ" }
];

const STATUS_OPTIONS = [
  { value: "Draft", label: "Nháp" },
  { value: "Cancelled", label: "Đã huỷ" }
];

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý đơn hàng") || permissions.includes("Xem tìm kiếm đơn hàng");
  const canAdd = permissions.includes("Quản lý đơn hàng") || permissions.includes("Thêm mới đơn hàng");
  const canEdit = permissions.includes("Quản lý đơn hàng");
  const canDelete = permissions.includes("Quản lý đơn hàng");

  useEffect(() => {
    if (canView) {
      fetchOrders();
      fetchCustomers();
      fetchSuppliers();
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/Order/list");
      setOrders(res.data || []);
    } catch {
      message.error("Không thể tải danh sách đơn hàng!");
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Customer/list");
      setCustomers(res.data || []);
    } catch {
      message.error("Không thể tải khách hàng!");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Supplier/list");
      setSuppliers(res.data || []);
    } catch {
      message.error("Không thể tải nhà cung cấp!");
    }
  };

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        OrderCode: values.orderCode,
        OrderType: values.orderType,
        CreatedBy: userData.id,
      };
      console.log("Payload tạo đơn hàng:", payload);
      await axios.post("https://localhost:7193/Order/add", payload);
      message.success("Tạo đơn hàng thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchOrders();
    } catch (err) {
      message.error(err.response?.data?.message || "Tạo đơn hàng thất bại!");
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditingOrder(record);
    editForm.setFieldsValue({
      orderDate: record.orderDate ? dayjs(record.orderDate) : null,
      customerId: record.customerId,
      supplierId: record.supplierId,
      orderType: record.orderType,
      note: record.note,
      status: record.status,
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        OrderDate: values.orderDate ? values.orderDate.format("YYYY-MM-DD") : null,
        CustomerId: values.customerId || null,
        SupplierId: values.supplierId || null,
        OrderType: values.orderType,
        Note: values.note,
        UpdatedBy: userData.id,
        Status: values.status,
      };
      await axios.put(`https://localhost:7193/Order/update/${editingOrder.id}`, payload);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Huỷ (xoá mềm)
  const handleSoftDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Order/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã huỷ đơn hàng!");
      fetchOrders();
    } catch {
      message.error("Huỷ đơn hàng thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Order/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại đơn hàng!");
      fetchOrders();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã đơn", dataIndex: "orderCode", key: "orderCode" },
    { title: "Ngày đơn", dataIndex: "orderDate", key: "orderDate", render: v => v ? dayjs(v).format("DD/MM/YYYY") : "" },
    { title: "Khách hàng", dataIndex: "customerId", key: "customerId", render: id => customers.find(c => c.id === id)?.customerName || "" },
    { title: "Nhà cung cấp", dataIndex: "supplierId", key: "supplierId", render: id => suppliers.find(s => s.id === id)?.supplierName || "" },
    { title: "Loại đơn", dataIndex: "orderType", key: "orderType" },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
    { title: "Tổng tiền", dataIndex: "totalAmount", key: "totalAmount" },
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
                title="Huỷ đơn hàng này?"
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
      <h2>Quản Lý Đơn Hàng</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới đơn hàng
        </Button>
      )}
      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới đơn hàng"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="orderCode" label="Mã đơn hàng" rules={[{ required: true, message: "Nhập mã đơn hàng!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="orderDate" label="Ngày đơn" rules={[{ required: true, message: "Chọn ngày đơn!" }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="customerId" label="Khách hàng">
            <Select
              allowClear
              placeholder="Chọn khách hàng"
              options={customers.map(c => ({ value: c.id, label: c.customerName }))}
            />
          </Form.Item>
          <Form.Item name="supplierId" label="Nhà cung cấp">
            <Select
              allowClear
              placeholder="Chọn nhà cung cấp"
              options={suppliers.map(s => ({ value: s.id, label: s.supplierName }))}
            />
          </Form.Item>
          <Form.Item name="orderType" label="Loại đơn" rules={[{ required: true, message: "Chọn loại đơn!" }]}>
            <Select
              allowClear
              placeholder="Chọn loại đơn"
              options={ORDER_TYPES}
            />
          </Form.Item>
          <Form.Item name="totalAmount" label="Tổng tiền">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa đơn hàng"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="orderDate" label="Ngày đơn" rules={[{ required: true, message: "Chọn ngày đơn!" }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="customerId" label="Khách hàng">
            <Select
              allowClear
              placeholder="Chọn khách hàng"
              options={customers.map(c => ({ value: c.id, label: c.customerName }))}
            />
          </Form.Item>
          <Form.Item name="supplierId" label="Nhà cung cấp">
            <Select
              allowClear
              placeholder="Chọn nhà cung cấp"
              options={suppliers.map(s => ({ value: s.id, label: s.supplierName }))}
            />
          </Form.Item>
          <Form.Item name="orderType" label="Loại đơn" rules={[{ required: true, message: "Chọn loại đơn!" }]}>
            <Select
              allowClear
              placeholder="Chọn loại đơn"
              options={ORDER_TYPES}
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

export default OrderManager;