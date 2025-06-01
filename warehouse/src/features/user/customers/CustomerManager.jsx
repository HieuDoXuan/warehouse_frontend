import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, Tag, Select } from "antd";
import axios from "axios";
import styles from './CustomerManager.module.scss';

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

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [customerLevels, setCustomerLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý khách hàng") || permissions.includes("Xem tìm kiếm khách hàng");
  const canAdd = permissions.includes("Quản lý khách hàng") || permissions.includes("Thêm mới khách hàng");
  const canEdit = permissions.includes("Quản lý khách hàng");
  const canDelete = permissions.includes("Quản lý khách hàng");

  useEffect(() => {
    if (canView) {
      fetchCustomers();
      fetchCustomerLevels();
    }
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/Customer/list");
      setCustomers(res.data || []);
    } catch {
      message.error("Không thể tải danh sách khách hàng!");
    }
    setLoading(false);
  };

  const fetchCustomerLevels = async () => {
    try {
      const res = await axios.get("https://localhost:7193/CustomerLevel/list");
      setCustomerLevels(res.data || []);
    } catch {
      message.error("Không thể tải cấp khách hàng!");
    }
  };

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        CustomerCode: values.customerCode,
        CustomerName: values.customerName,
        ContactName: values.contactName,
        PhoneNumber: values.phoneNumber,
        Email: values.email,
        Address: values.address,
        TaxCode: values.taxCode,
        Note: values.note,
        CustomerLevelId: values.customerLevelId,
        Points: values.points,
        CreatedBy: userData.id,
        Status: "Active", // Thêm dòng này
      };
      console.log("Payload gửi lên:", payload); // Thêm dòng này để debug
      await axios.post("https://localhost:7193/Customer/add", payload);
      message.success("Thêm khách hàng thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchCustomers();
    } catch (err) {
      console.log("Lỗi trả về từ backend:", err.response);
      // Thêm dòng này để xem rõ lỗi từng trường:
      if (err.response?.data?.errors) {
        console.log("Chi tiết lỗi:", err.response.data.errors);
        message.error(
          Object.values(err.response.data.errors)
            .map(arr => arr.join(", "))
            .join(" | ")
        );
      } else {
        message.error(err.response?.data?.message || "Thêm thất bại!");
      }
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditingCustomer(record);
    editForm.setFieldsValue({
      customerCode: record.customerCode,
      customerName: record.customerName,
      contactName: record.contactName,
      email: record.email,
      phoneNumber: record.phoneNumber,
      address: record.address,
      taxCode: record.taxCode,
      note: record.note,
      customerLevelId: record.customerLevelId,
      points: record.points,
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        CustomerCode: values.customerCode,
        CustomerName: values.customerName,
        ContactName: values.contactName,
        PhoneNumber: values.phoneNumber,
        Email: values.email,
        Address: values.address,
        TaxCode: values.taxCode,
        Note: values.note,
        CustomerLevelId: values.customerLevelId ? Number(values.customerLevelId) : null,
        Points: values.points ? Number(values.points) : null,
        UpdatedBy: userData.id,
      };
      await axios.put(`https://localhost:7193/Customer/update/${editingCustomer.id}`, payload);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      // Lấy userId từ currentUser
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Customer/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã chuyển khách hàng sang trạng thái Inactive!");
      fetchCustomers();
    } catch {
      message.error("Xoá mềm thất bại!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    try {
      await axios.delete(`https://localhost:7193/Customer/hard-delete/${id}`);
      message.success("Đã xoá vĩnh viễn khách hàng!");
      fetchCustomers();
    } catch {
      message.error("Xoá cứng thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Customer/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại khách hàng!");
      fetchCustomers();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã KH", dataIndex: "customerCode", key: "customerCode" },
    { title: "Tên KH", dataIndex: "customerName", key: "customerName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "SĐT", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "Địa chỉ", dataIndex: "address", key: "address" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "Active" ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="red">Đã xoá mềm</Tag>
        ),
    },
    ...(canEdit || canDelete
      ? [{
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
                    title="Xoá mềm khách hàng này?"
                    onConfirm={() => handleSoftDelete(record.id)}
                    okText="Xoá mềm"
                    cancelText="Huỷ"
                  >
                    <Button size="small" danger style={{ marginRight: 8 }}>Xoá mềm</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Xoá vĩnh viễn khách hàng này? Không thể khôi phục!"
                    onConfirm={() => handleHardDelete(record.id)}
                    okText="Xoá cứng"
                    cancelText="Huỷ"
                  >
                    <Button size="small" danger type="primary" style={{ marginRight: 8 }}>Xoá cứng</Button>
                  </Popconfirm>
                  <Button size="small" onClick={() => handleReactivate(record.id)}>
                    Kích hoạt lại
                  </Button>
                </>
              )}
            </span>
          )
        }]
      : [])
  ];

  if (!canView) {
    return <div>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className={styles.customerManager}>
      <h2 className={styles.title}>Quản Lý Khách Hàng</h2>
      {canAdd && (
        <Button
          type="primary"
          onClick={() => setShowAdd(true)}
          className={styles.addButton}
        >
          Thêm mới khách hàng
        </Button>
      )}
      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className={styles.table}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới khách hàng"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={(values) => {
  // Ép kiểu cho các trường số, nếu rỗng thì để null
  values.customerLevelId = values.customerLevelId !== undefined && values.customerLevelId !== "" ? Number(values.customerLevelId) : null;
  values.points = values.points !== undefined && values.points !== "" ? Number(values.points) : null;
  handleAdd(values);
}}>
          <Form.Item name="customerCode" label="Mã khách hàng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="customerName" label="Tên khách hàng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="Người liên hệ">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="taxCode" label="Mã số thuế">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input />
          </Form.Item>
          <Form.Item name="customerLevelId" label="Cấp khách hàng">
            <Select
              allowClear
              placeholder="Chọn cấp khách hàng"
              options={customerLevels.map(lv => ({
                value: lv.id,
                label: lv.levelName
              }))}
            />
          </Form.Item>
          <Form.Item name="points" label="Điểm tích lũy">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa khách hàng"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="customerCode" label="Mã khách hàng" rules={[{ required: true }]}>
            <Input disabled /> {/* Không cho sửa mã KH */}
          </Form.Item>
          <Form.Item name="customerName" label="Tên khách hàng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManager;