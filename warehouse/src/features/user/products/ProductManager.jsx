import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, message, Popconfirm, Select } from "antd";
import axios from "axios";
import styles from './ProductManager.module.scss';

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

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý sản phẩm") || permissions.includes("Xem tìm kiếm sản phẩm");
  const canAdd = permissions.includes("Quản lý sản phẩm") || permissions.includes("Thêm mới sản phẩm");
  const canEdit = permissions.includes("Quản lý sản phẩm");
  const canDelete = permissions.includes("Quản lý sản phẩm");

  useEffect(() => {
    if (canView) {
      fetchProducts();
      fetchCategories();
      fetchUnits();
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/Product/search");
      setProducts(res.data || []);
    } catch {
      message.error("Không thể tải danh sách sản phẩm!");
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://localhost:7193/ProductCategory/all");
      setCategories(res.data || []);
    } catch {
      message.error("Không thể tải danh mục!");
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Unit/list");
      setUnits(res.data || []);
    } catch {
      message.error("Không thể tải đơn vị tính!");
    }
  };

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ProductCode: values.productCode,
        ProductName: values.productName,
        CategoryId: values.categoryId ? Number(values.categoryId) : null,
        BaseUnitId: values.baseUnitId ? Number(values.baseUnitId) : null,
        Brand: values.brand,
        Origin: values.origin,
        Barcode: values.barcode,
        ImageUrl: values.imageUrl,
        Description: values.description,
        CostPrice: values.costPrice ? Number(values.costPrice) : null,
        SalePrice: values.salePrice ? Number(values.salePrice) : null,
        VAT: values.vat ? Number(values.vat) : null,
        MinStock: values.minStock ? Number(values.minStock) : 0,
        MaxStock: values.maxStock ? Number(values.maxStock) : null,
        CreatedBy: userData.id,
      };
      await axios.post("https://localhost:7193/Product/add", payload);
      message.success("Thêm sản phẩm thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchProducts();
    } catch (err) {
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditingProduct(record);
    editForm.setFieldsValue({
      productCode: record.productCode,
      productName: record.productName,
      categoryId: record.categoryId,
      baseUnitId: record.baseUnitId,
      brand: record.brand,
      origin: record.origin,
      barcode: record.barcode,
      imageUrl: record.imageUrl,
      description: record.description,
      costPrice: record.costPrice,
      salePrice: record.salePrice,
      vat: record.vat,
      minStock: record.minStock,
      maxStock: record.maxStock,
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ProductCode: values.productCode,
        ProductName: values.productName,
        CategoryId: values.categoryId ? Number(values.categoryId) : null,
        BaseUnitId: values.baseUnitId ? Number(values.baseUnitId) : null,
        Brand: values.brand,
        Origin: values.origin,
        Barcode: values.barcode,
        ImageUrl: values.imageUrl,
        Description: values.description,
        CostPrice: values.costPrice ? Number(values.costPrice) : null,
        SalePrice: values.salePrice ? Number(values.salePrice) : null,
        VAT: values.vat ? Number(values.vat) : null,
        MinStock: values.minStock ? Number(values.minStock) : 0,
        MaxStock: values.maxStock ? Number(values.maxStock) : null,
        UpdatedBy: userData.id,
      };
      await axios.put(`https://localhost:7193/Product/update/${editingProduct.id}`, payload);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Product/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã chuyển sản phẩm sang trạng thái Inactive!");
      fetchProducts();
    } catch {
      message.error("Xoá mềm thất bại!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.delete(`https://localhost:7193/Product/hard-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã xoá vĩnh viễn sản phẩm!");
      fetchProducts();
    } catch {
      message.error("Xoá cứng thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/Product/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại sản phẩm!");
      fetchProducts();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Mã SP", dataIndex: "productCode", key: "productCode" },
    { title: "Tên SP", dataIndex: "productName", key: "productName" },
    { title: "Danh mục", dataIndex: "categoryId", key: "categoryId", render: id => categories.find(c => c.id === id)?.categoryName || "" },
    { title: "Đơn vị", dataIndex: "baseUnitId", key: "baseUnitId", render: id => units.find(u => u.id === id)?.unitName || "" },
    { title: "Thương hiệu", dataIndex: "brand", key: "brand" },
    { title: "Xuất xứ", dataIndex: "origin", key: "origin" },
    { title: "Barcode", dataIndex: "barcode", key: "barcode" },
    { title: "Giá vốn", dataIndex: "costPrice", key: "costPrice" },
    { title: "Giá bán", dataIndex: "salePrice", key: "salePrice" },
    { title: "VAT (%)", dataIndex: "vat", key: "vat" },
    { title: "Tồn tối thiểu", dataIndex: "minStock", key: "minStock" },
    { title: "Tồn tối đa", dataIndex: "maxStock", key: "maxStock" },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
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
                    title="Xoá mềm sản phẩm này?"
                    onConfirm={() => handleSoftDelete(record.id)}
                    okText="Xoá mềm"
                    cancelText="Huỷ"
                  >
                    <Button size="small" danger style={{ marginRight: 8 }}>Xoá mềm</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Xoá vĩnh viễn sản phẩm này? Không thể khôi phục!"
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
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Quản Lý Sản Phẩm</span>
        {canAdd && (
          <Button className={styles.addBtn} type="primary" onClick={() => setShowAdd(true)}>
            Thêm mới sản phẩm
          </Button>
        )}
      </div>
      <Table
        className={styles.table}
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới sản phẩm"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="productCode" label="Mã sản phẩm" rules={[{ required: true, pattern: /^[A-Z0-9_]{3,30}$/, message: "Mã sản phẩm phải từ 3-30 ký tự in hoa, số, gạch dưới." }]}>
            <Input />
          </Form.Item>
          <Form.Item name="productName" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục">
            <Select
              allowClear
              placeholder="Chọn danh mục"
              options={categories.map(c => ({ value: c.id, label: c.categoryName }))}
            />
          </Form.Item>
          <Form.Item name="baseUnitId" label="Đơn vị tính">
            <Select
              allowClear
              placeholder="Chọn đơn vị"
              options={units.map(u => ({ value: u.id, label: u.unitName }))}
            />
          </Form.Item>
          <Form.Item name="brand" label="Thương hiệu">
            <Input />
          </Form.Item>
          <Form.Item name="origin" label="Xuất xứ">
            <Input />
          </Form.Item>
          <Form.Item name="barcode" label="Barcode">
            <Input />
          </Form.Item>
          <Form.Item name="imageUrl" label="Ảnh (URL)">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input />
          </Form.Item>
          <Form.Item name="costPrice" label="Giá vốn">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="salePrice" label="Giá bán">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="vat" label="VAT (%)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="minStock" label="Tồn tối thiểu">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="maxStock" label="Tồn tối đa">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa sản phẩm"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="productCode" label="Mã sản phẩm" rules={[{ required: true, pattern: /^[A-Z0-9_]{3,30}$/, message: "Mã sản phẩm phải từ 3-30 ký tự in hoa, số, gạch dưới." }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="productName" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục">
            <Select
              allowClear
              placeholder="Chọn danh mục"
              options={categories.map(c => ({ value: c.id, label: c.categoryName }))}
            />
          </Form.Item>
          <Form.Item name="baseUnitId" label="Đơn vị tính">
            <Select
              allowClear
              placeholder="Chọn đơn vị"
              options={units.map(u => ({ value: u.id, label: u.unitName }))}
            />
          </Form.Item>
          <Form.Item name="brand" label="Thương hiệu">
            <Input />
          </Form.Item>
          <Form.Item name="origin" label="Xuất xứ">
            <Input />
          </Form.Item>
          <Form.Item name="barcode" label="Barcode">
            <Input />
          </Form.Item>
          <Form.Item name="imageUrl" label="Ảnh (URL)">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input />
          </Form.Item>
          <Form.Item name="costPrice" label="Giá vốn">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="salePrice" label="Giá bán">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="vat" label="VAT (%)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="minStock" label="Tồn tối thiểu">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="maxStock" label="Tồn tối đa">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManager;