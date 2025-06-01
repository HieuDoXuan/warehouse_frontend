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

const ProductStockManager = () => {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý sản phẩm tồn theo kho") || permissions.includes("Xem tìm kiếm sản phẩm theo kho");
  const canAdd = permissions.includes("Quản lý sản phẩm tồn theo kho") || permissions.includes("Thêm mới sản phẩm theo kho");
  const canEdit = permissions.includes("Quản lý sản phẩm tồn theo kho");
  const canDelete = permissions.includes("Quản lý sản phẩm tồn theo kho");

  useEffect(() => {
    if (canView) {
      fetchStocks();
      fetchProducts();
      fetchWarehouses();
    }
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/ProductStock/list");
      setStocks(res.data || []);
    } catch {
      message.error("Không thể tải danh sách tồn kho!");
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

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Warehouse/list");
      setWarehouses(res.data || []);
    } catch {
      message.error("Không thể tải kho!");
    }
  };

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ProductId: values.productId,
        WarehouseId: values.warehouseId,
        Quantity: Number(values.quantity),
        MinStock: Number(values.minStock),
        MaxStock: values.maxStock ? Number(values.maxStock) : null,
        Status: "Active", // Thêm dòng này nếu luôn mặc định là Active
        UpdatedBy: userData.id,
      };
      console.log("Payload thêm tồn kho:", payload);
      await axios.post("https://localhost:7193/ProductStock/add", payload);
      message.success("Thêm tồn kho thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchStocks();
    } catch (err) {
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditingStock(record);
    editForm.setFieldsValue({
      productId: record.productId,
      warehouseId: record.warehouseId,
      quantity: record.quantity,
      minStock: record.minStock,
      maxStock: record.maxStock,
      status: record.status,
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        Quantity: Number(values.quantity),
        MinStock: Number(values.minStock),
        MaxStock: values.maxStock ? Number(values.maxStock) : null,
        Status: values.status,
        UpdatedBy: userData.id,
      };
      await axios.put(`https://localhost:7193/ProductStock/update/${editingStock.id}`, payload);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditingStock(null);
      fetchStocks();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/ProductStock/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã chuyển tồn kho sang trạng thái Inactive!");
      fetchStocks();
    } catch {
      message.error("Xoá mềm thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/ProductStock/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại tồn kho!");
      fetchStocks();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Sản phẩm", dataIndex: "productId", key: "productId", render: id => products.find(p => p.id === id)?.productName || "" },
    { title: "Kho", dataIndex: "warehouseId", key: "warehouseId", render: id => warehouses.find(w => w.id === id)?.warehouseName || "" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    { title: "Tồn tối thiểu", dataIndex: "minStock", key: "minStock" },
    { title: "Tồn tối đa", dataIndex: "maxStock", key: "maxStock" },
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
                title="Xoá mềm tồn kho này?"
                onConfirm={() => handleSoftDelete(record.id)}
                okText="Xoá mềm"
                cancelText="Huỷ"
              >
                <Button size="small" danger style={{ marginRight: 8 }}>Xoá mềm</Button>
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
      <h2>Quản Lý Tồn Kho Sản Phẩm Tại Kho</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới tồn kho
        </Button>
      )}
      <Table
        dataSource={stocks}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới tồn kho"
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
          <Form.Item name="warehouseId" label="Kho" rules={[{ required: true, message: "Chọn kho!" }]}>
            <Select
              allowClear
              placeholder="Chọn kho"
              options={warehouses.map(w => ({ value: w.id, label: w.warehouseName }))}
            />
          </Form.Item>
          <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: "Nhập số lượng!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="minStock" label="Tồn tối thiểu" rules={[{ required: true, message: "Nhập tồn tối thiểu!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="maxStock" label="Tồn tối đa">
            <Input type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa tồn kho"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: "Nhập số lượng!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="minStock" label="Tồn tối thiểu" rules={[{ required: true, message: "Nhập tồn tối thiểu!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="maxStock" label="Tồn tối đa">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Chọn trạng thái!" }]}>
            <Select
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductStockManager;