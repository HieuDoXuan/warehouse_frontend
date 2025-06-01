import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, Select, Checkbox } from "antd";
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

const ProductSupplierManager = () => {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý sản phẩm nhà cung cấp") || permissions.includes("Xem tìm kiếm sản phẩm nhà cung cấp");
  const canAdd = permissions.includes("Quản lý sản phẩm nhà cung cấp") || permissions.includes("Thêm mới sản phẩm nhà cung cấp");
  const canEdit = permissions.includes("Quản lý sản phẩm nhà cung cấp");
  const canDelete = permissions.includes("Quản lý sản phẩm nhà cung cấp");

  useEffect(() => {
    if (canView) {
      fetchData();
      fetchProducts();
      fetchSuppliers();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/ProductSupplier/list");
      setData(res.data || []);
    } catch {
      message.error("Không thể tải danh sách!");
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Product/search");
      setProducts(res.data || []);
    } catch {
      message.error("Không thể tải sản phẩm!");
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
        ProductId: values.productId,
        SupplierId: values.supplierId,
        SupplierProductCode: values.supplierProductCode,
        IsMain: values.isMain || false,
        CreatedBy: userData.id,
      };
      await axios.post("https://localhost:7193/ProductSupplier/add", payload);
      message.success("Thêm liên kết thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        message.error("Đã tồn tại liên kết này!");
      } else {
        message.error(err.response?.data?.message || "Thêm thất bại!");
      }
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditing(record);
    editForm.setFieldsValue({
      supplierProductCode: record.supplierProductCode,
      isMain: record.isMain,
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        SupplierProductCode: values.supplierProductCode,
        IsMain: values.isMain || false,
        UpdatedBy: userData.id,
      };
      await axios.put(`https://localhost:7193/ProductSupplier/update/${editing.id}`, payload);
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
      await axios.put(`https://localhost:7193/ProductSupplier/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã chuyển liên kết sang trạng thái Inactive!");
      fetchData();
    } catch {
      message.error("Xoá mềm thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/ProductSupplier/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại liên kết!");
      fetchData();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    try {
      await axios.delete(`https://localhost:7193/ProductSupplier/hard-delete/${id}`);
      message.success("Đã xoá cứng liên kết!");
      fetchData();
    } catch {
      message.error("Xoá cứng thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Sản phẩm", dataIndex: "productId", key: "productId", render: id => products.find(p => p.id === id)?.productName || "" },
    { title: "Nhà cung cấp", dataIndex: "supplierId", key: "supplierId", render: id => suppliers.find(s => s.id === id)?.supplierName || "" },
    { title: "Mã SP NCC", dataIndex: "supplierProductCode", key: "supplierProductCode" },
    { title: "Là chính?", dataIndex: "isMain", key: "isMain", render: v => v ? "✔️" : "" },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
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
                title="Xoá mềm liên kết này?"
                onConfirm={() => handleSoftDelete(record.id)}
                okText="Xoá mềm"
                cancelText="Huỷ"
              >
                <Button size="small" danger style={{ marginRight: 8 }}>Xoá mềm</Button>
              </Popconfirm>
              <Button size="small" onClick={() => handleReactivate(record.id)}>
                Kích hoạt lại
              </Button>
              <Popconfirm
                title="Xoá cứng liên kết này? Không thể khôi phục!"
                onConfirm={() => handleHardDelete(record.id)}
                okText="Xoá cứng"
                cancelText="Huỷ"
              >
                <Button size="small" danger>Xoá cứng</Button>
              </Popconfirm>
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
      <h2>Quản Lý Sản Phẩm Nhà Cung Cấp</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới liên kết
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
        title="Thêm mới liên kết sản phẩm - nhà cung cấp"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true, message: "Chọn sản phẩm!" }]}>
            <Select
              allowClear
              placeholder="Chọn sản phẩm"
              options={products.map(p => ({ value: p.id, label: p.productName }))}
            />
          </Form.Item>
          <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: "Chọn nhà cung cấp!" }]}>
            <Select
              allowClear
              placeholder="Chọn nhà cung cấp"
              options={suppliers.map(s => ({ value: s.id, label: s.supplierName }))}
            />
          </Form.Item>
          <Form.Item name="supplierProductCode" label="Mã sản phẩm NCC">
            <Input />
          </Form.Item>
          <Form.Item name="isMain" valuePropName="checked">
            <Checkbox>Là sản phẩm chính của NCC?</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa liên kết sản phẩm - nhà cung cấp"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="supplierProductCode" label="Mã sản phẩm NCC">
            <Input />
          </Form.Item>
          <Form.Item name="isMain" valuePropName="checked">
            <Checkbox>Là sản phẩm chính của NCC?</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSupplierManager;