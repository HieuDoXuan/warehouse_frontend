import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, Select } from "antd";
import axios from "axios";

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
  { value: "Active", label: "Đang hoạt động" },
  { value: "Inactive", label: "Ngừng hoạt động" }
];

const ShippingProviderManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý đơn vị vận chuyển") || permissions.includes("Xem tìm kiếm đơn vị vận chuyển");
  const canAdd = permissions.includes("Quản lý đơn vị vận chuyển") || permissions.includes("Thêm mới đơn vị vận chuyển");
  const canEdit = permissions.includes("Quản lý đơn vị vận chuyển");
  const canDelete = permissions.includes("Quản lý đơn vị vận chuyển");

  useEffect(() => {
    if (canView) fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/ShippingProvider/list");
      setData(res.data || []);
    } catch {
      message.error("Không thể tải danh sách đối tác!");
    }
    setLoading(false);
  };

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ProviderCode: values.providerCode,
        ProviderName: values.providerName,
        ContactName: values.contactName,
        PhoneNumber: values.phoneNumber,
        Email: values.email,
        Website: values.website,
        Note: values.note ?? null,
        CreatedBy: userData.id
      };
      await axios.post("https://localhost:7193/ShippingProvider/add", payload);
      message.success("Thêm đối tác thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("Mã đối tác đã tồn tại!");
      } else {
        message.error(err.response?.data?.message || "Thêm đối tác thất bại!");
      }
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditing(record);
    editForm.setFieldsValue({
      providerCode: record.providerCode,
      providerName: record.providerName,
      contactName: record.contactName,
      phoneNumber: record.phoneNumber,
      email: record.email,
      website: record.website,
      note: record.note,
      status: record.status
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ProviderName: values.providerName,
        ContactName: values.contactName,
        PhoneNumber: values.phoneNumber,
        Email: values.email,
        Website: values.website,
        Note: values.note ?? null,
        UpdatedBy: userData.id
      };
      await axios.put(`https://localhost:7193/ShippingProvider/update/${editing.id}`, payload);
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
      await axios.put(`https://localhost:7193/ShippingProvider/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã ngừng hoạt động đối tác!");
      fetchData();
    } catch {
      message.error("Ngừng hoạt động thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/ShippingProvider/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại đối tác!");
      fetchData();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã đối tác", dataIndex: "providerCode", key: "providerCode" },
    { title: "Tên đối tác", dataIndex: "providerName", key: "providerName" },
    { title: "Người liên hệ", dataIndex: "contactName", key: "contactName" },
    { title: "SĐT", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Website", dataIndex: "website", key: "website" },
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
                title="Ngừng hoạt động đối tác này?"
                onConfirm={() => handleSoftDelete(record.id)}
                okText="Ngừng"
                cancelText="Không"
              >
                <Button size="small" danger style={{ marginRight: 8 }}>Ngừng</Button>
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
      <h2>Quản Lý Đối Tác Vận Chuyển</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới đối tác
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
        title="Thêm mới đối tác"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="providerCode" label="Mã đối tác" rules={[{ required: true, message: "Nhập mã đối tác!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="providerName" label="Tên đối tác" rules={[{ required: true, message: "Nhập tên đối tác!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="Người liên hệ">
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa đối tác"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="providerName" label="Tên đối tác" rules={[{ required: true, message: "Nhập tên đối tác!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="Người liên hệ">
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShippingProviderManager;