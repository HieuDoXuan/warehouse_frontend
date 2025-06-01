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

const STATUS_OPTIONS = [
  { value: "Pending", label: "Chờ giao" },
  { value: "Completed", label: "Đã giao" },
  { value: "Cancelled", label: "Đã huỷ" }
];

const DeliveryManager = () => {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [providers, setProviders] = useState([]); // Thêm state cho đối tác vận chuyển
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý vận chuyển") || permissions.includes("Xem tìm kiếm thông tin vận chuyển");
  const canAdd = permissions.includes("Quản lý vận chuyển") || permissions.includes("Thêm thông tin vận chuyển");
  const canEdit = permissions.includes("Quản lý vận chuyển");
  const canDelete = permissions.includes("Quản lý vận chuyển");

  useEffect(() => {
    if (canView) {
      fetchData();
      fetchOrders();
      fetchProviders(); // Lấy danh sách đối tác vận chuyển
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/Delivery/list");
      setData(res.data || []);
    } catch {
      message.error("Không thể tải danh sách vận chuyển!");
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

  const fetchProviders = async () => {
    try {
      const res = await axios.get("https://localhost:7193/ShippingProvider/list?status=Active");
      setProviders(res.data || []);
    } catch {
      message.error("Không thể tải đối tác vận chuyển!");
    }
  };

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        OrderId: values.orderId,
        DeliveryCode: values.deliveryCode,
        DeliveryDate: values.deliveryDate ? values.deliveryDate.format("YYYY-MM-DD") : null,
        ShipperName: values.shipperName,
        DeliveryAddress: values.deliveryAddress,
        Note: values.note ?? null,
        CreatedBy: userData.id,
        ShippingProviderId: values.shippingProviderId || null,
        TrackingNumber: values.trackingNumber || null,
        ShippingFee: values.shippingFee ? Number(values.shippingFee) : null,
        TrackingUrl: values.trackingUrl || null,
        SyncStatus: values.syncStatus || "None",
        SyncLog: values.syncLog || null
      };
      await axios.post("https://localhost:7193/Delivery/add", payload);
      message.success("Thêm giao hàng thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("Mã giao hàng đã tồn tại!");
      } else {
        message.error(err.response?.data?.message || "Thêm giao hàng thất bại!");
      }
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditing(record);
    editForm.setFieldsValue({
      orderId: record.orderId,
      deliveryCode: record.deliveryCode,
      deliveryDate: record.deliveryDate ? dayjs(record.deliveryDate) : null,
      shipperName: record.shipperName,
      deliveryAddress: record.deliveryAddress,
      note: record.note,
      shippingProviderId: record.shippingProviderId,
      trackingNumber: record.trackingNumber,
      shippingFee: record.shippingFee,
      trackingUrl: record.trackingUrl,
      syncStatus: record.syncStatus,
      syncLog: record.syncLog,
      status: record.status
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        DeliveryDate: values.deliveryDate ? values.deliveryDate.format("YYYY-MM-DD") : null,
        ShipperName: values.shipperName,
        DeliveryAddress: values.deliveryAddress,
        Status: values.status,
        Note: values.note ?? null,
        UpdatedBy: userData.id,
        ShippingProviderId: values.shippingProviderId || null,
        TrackingNumber: values.trackingNumber || null,
        ShippingFee: values.shippingFee ? Number(values.shippingFee) : null,
        TrackingUrl: values.trackingUrl || null,
        SyncStatus: values.syncStatus || "None",
        SyncLog: values.syncLog || null
      };
      await axios.put(`https://localhost:7193/Delivery/update/${editing.id}`, payload);
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
      await axios.put(`https://localhost:7193/Delivery/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã huỷ giao hàng!");
      fetchData();
    } catch {
      message.error("Huỷ giao hàng thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Delivery/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại giao hàng!");
      fetchData();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã giao hàng", dataIndex: "deliveryCode", key: "deliveryCode" },
    { title: "Đơn hàng", dataIndex: "orderId", key: "orderId", render: id => orders.find(o => o.id === id)?.orderCode || "" },
    { title: "Đối tác vận chuyển", dataIndex: "shippingProviderId", key: "shippingProviderId", render: id => providers.find(p => p.id === id)?.providerName || "" },
    { title: "Ngày giao", dataIndex: "deliveryDate", key: "deliveryDate", render: v => v ? dayjs(v).format("DD/MM/YYYY") : "" },
    { title: "Người giao", dataIndex: "shipperName", key: "shipperName" },
    { title: "Địa chỉ giao", dataIndex: "deliveryAddress", key: "deliveryAddress" },
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
                title="Huỷ giao hàng này?"
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
      <h2>Quản Lý Vận Chuyển</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới giao hàng
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
        title="Thêm mới giao hàng"
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
          <Form.Item name="deliveryCode" label="Mã giao hàng" rules={[{ required: true, message: "Nhập mã giao hàng!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="shippingProviderId" label="Đối tác vận chuyển" rules={[{ required: true, message: "Chọn đối tác vận chuyển!" }]}>
            <Select
              showSearch
              placeholder="Chọn đối tác vận chuyển"
              options={providers.map(p => ({ value: p.id, label: p.providerName }))}
            />
          </Form.Item>
          <Form.Item name="deliveryDate" label="Ngày giao">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="shipperName" label="Người giao">
            <Input />
          </Form.Item>
          <Form.Item name="deliveryAddress" label="Địa chỉ giao">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          {/* Có thể bổ sung các trường khác nếu cần */}
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa giao hàng"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="shippingProviderId" label="Đối tác vận chuyển" rules={[{ required: true, message: "Chọn đối tác vận chuyển!" }]}>
            <Select
              showSearch
              placeholder="Chọn đối tác vận chuyển"
              options={providers.map(p => ({ value: p.id, label: p.providerName }))}
            />
          </Form.Item>
          <Form.Item name="deliveryDate" label="Ngày giao">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="shipperName" label="Người giao">
            <Input />
          </Form.Item>
          <Form.Item name="deliveryAddress" label="Địa chỉ giao">
            <Input />
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
          {/* Có thể bổ sung các trường khác nếu cần */}
        </Form>
      </Modal>
    </div>
  );
};

export default DeliveryManager;