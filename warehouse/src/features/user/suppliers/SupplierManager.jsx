import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, Tag } from "antd";
import axios from "axios";
import styles from './SupplierManager.module.scss';

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

const SupplierManager = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản Lý Nhà Cung Cấp") || permissions.includes("Xem tìm kiếm nhà cung cấp");
  const canAdd = permissions.includes("Quản Lý Nhà Cung Cấp") || permissions.includes("Thêm mới nhà cung cấp");
  const canEdit = permissions.includes("Quản Lý Nhà Cung Cấp");
  const canDelete = permissions.includes("Quản Lý Nhà Cung Cấp");

  useEffect(() => {
    if (canView) fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/Supplier/list"); // Đúng địa chỉ backend
      setSuppliers(res.data || []);
    } catch {
      message.error("Không thể tải danh sách nhà cung cấp!");
    }
    setLoading(false);
  };

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      await axios.post("https://localhost:7193/Supplier/add", values);
      message.success("Thêm nhà cung cấp thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchSuppliers();
    } catch (err) {
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditingSupplier(record);
    editForm.setFieldsValue(record);
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      await axios.put(`https://localhost:7193/Supplier/update/${editingSupplier.id}`, values);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      await axios.put(`https://localhost:7193/Supplier/soft-delete/${id}`);
      message.success("Đã chuyển nhà cung cấp sang trạng thái Inactive!");
      fetchSuppliers();
    } catch {
      message.error("Xoá mềm thất bại!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    try {
      await axios.delete(`https://localhost:7193/Supplier/hard-delete/${id}`);
      message.success("Đã xoá vĩnh viễn nhà cung cấp!");
      fetchSuppliers();
    } catch {
      message.error("Xoá cứng thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      await axios.put(`https://localhost:7193/Supplier/reactivate/${id}`);
      message.success("Đã kích hoạt lại nhà cung cấp!");
      fetchSuppliers();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã NCC", dataIndex: "supplierCode", key: "supplierCode" },
    { title: "Tên NCC", dataIndex: "supplierName", key: "supplierName" },
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
                    title="Xoá mềm nhà cung cấp này?"
                    onConfirm={() => handleSoftDelete(record.id)}
                    okText="Xoá mềm"
                    cancelText="Huỷ"
                  >
                    <Button size="small" danger style={{ marginRight: 8 }}>Xoá mềm</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Xoá vĩnh viễn nhà cung cấp này? Không thể khôi phục!"
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
    return <div className={styles.noPermission}>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className={styles.supplierManager}>
      <h2 className={styles.title}>Quản Lý Nhà Cung Cấp</h2>
      {canAdd && (
        <Button className={styles.addButton} type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới nhà cung cấp
        </Button>
      )}
      <Table
        className={styles.table}
        dataSource={suppliers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới nhà cung cấp"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="supplierCode" label="Mã nhà cung cấp" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="supplierName" label="Tên nhà cung cấp" rules={[{ required: true }]}>
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

      {/* Modal sửa */}
      <Modal
        title="Sửa nhà cung cấp"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="supplierCode" label="Mã nhà cung cấp" rules={[{ required: true }]}>
            <Input disabled /> {/* Không cho sửa mã NCC */}
          </Form.Item>
          <Form.Item name="supplierName" label="Tên nhà cung cấp" rules={[{ required: true }]}>
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

export default SupplierManager;