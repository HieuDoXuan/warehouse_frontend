import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, DatePicker, message, Popconfirm, Select } from "antd";
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

const PRICE_TYPES = [
  { value: "Sale", label: "Giá bán" },
  { value: "Cost", label: "Giá nhập" }
];

const ProductPriceManager = () => {
  const [prices, setPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý giá sản phẩm") || permissions.includes("Xem tìm kiếm giá sản phẩm");
  const canAdd = permissions.includes("Quản lý giá sản phẩm") || permissions.includes("Thêm mới giá sản phẩm");
  const canEdit = permissions.includes("Quản lý giá sản phẩm");
  const canDelete = permissions.includes("Quản lý giá sản phẩm");

  useEffect(() => {
    if (canView) {
      fetchPrices();
      fetchProducts();
    }
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/ProductPrice/list");
      setPrices(res.data || []);
    } catch {
      message.error("Không thể tải danh sách giá!");
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

  // Thêm mới
  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ProductId: values.productId,
        PriceType: values.priceType,
        Price: Number(values.price),
        EffectiveFrom: values.effectiveFrom ? values.effectiveFrom.format("YYYY-MM-DDTHH:mm:ss") : null,
        EffectiveTo: values.effectiveTo ? values.effectiveTo.format("YYYY-MM-DDTHH:mm:ss") : null,
        CreatedBy: userData.id,
      };
      await axios.post("https://localhost:7193/ProductPrice/add", payload);
      message.success("Thêm giá thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchPrices();
    } catch (err) {
      if (err.response?.status === 409) {
        // Luôn hiển thị thông báo này khi bị trùng
        message.open({
          type: 'error',
          content: 'Đã tồn tại giá này cho thời điểm này!',
          duration: 3,
        });
      } else {
        message.error(err.response?.data?.message || "Thêm thất bại!");
      }
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditingPrice(record);
    editForm.setFieldsValue({
      productId: record.productId,
      priceType: record.priceType,
      price: record.price,
      effectiveFrom: record.effectiveFrom ? dayjs(record.effectiveFrom) : null,
      effectiveTo: record.effectiveTo ? dayjs(record.effectiveTo) : null,
      status: record.status,
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const payload = {
        Price: Number(values.price),
        EffectiveTo: values.effectiveTo ? values.effectiveTo.format("YYYY-MM-DDTHH:mm:ss") : null,
        PriceType: editingPrice.priceType, // Gửi lại loại giá (Sale/Cost)
      };
      await axios.put(`https://localhost:7193/ProductPrice/update/${editingPrice.id}`, payload);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditingPrice(null);
      fetchPrices();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      await axios.put(`https://localhost:7193/ProductPrice/soft-delete/${id}`);
      message.success("Đã chuyển giá sang trạng thái Inactive!");
      fetchPrices();
    } catch {
      message.error("Xoá mềm thất bại!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    try {
      await axios.delete(`https://localhost:7193/ProductPrice/hard-delete/${id}`);
      message.success("Đã xoá vĩnh viễn giá!");
      fetchPrices();
    } catch {
      message.error("Xoá cứng thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      await axios.put(`https://localhost:7193/ProductPrice/reactivate/${id}`);
      message.success("Đã kích hoạt lại giá!");
      fetchPrices();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Sản phẩm", dataIndex: "productId", key: "productId", render: id => products.find(p => p.id === id)?.productName || "" },
    { title: "Loại giá", dataIndex: "priceType", key: "priceType" },
    { title: "Giá", dataIndex: "price", key: "price" },
    { title: "Hiệu lực từ", dataIndex: "effectiveFrom", key: "effectiveFrom", render: d => d ? dayjs(d).format("DD/MM/YYYY") : "" },
    { title: "Hiệu lực đến", dataIndex: "effectiveTo", key: "effectiveTo", render: d => d ? dayjs(d).format("DD/MM/YYYY") : "" },
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
                    title="Xoá mềm giá này?"
                    onConfirm={() => handleSoftDelete(record.id)}
                    okText="Xoá mềm"
                    cancelText="Huỷ"
                  >
                    <Button size="small" danger style={{ marginRight: 8 }}>Xoá mềm</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Xoá vĩnh viễn giá này? Không thể khôi phục!"
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
    <div>
      <h2>Quản Lý Giá Sản Phẩm</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới giá
        </Button>
      )}
      <Table
        dataSource={prices}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới giá"
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
          <Form.Item name="priceType" label="Loại giá" rules={[{ required: true, message: "Chọn loại giá!" }]}>
            <Select
              allowClear
              placeholder="Chọn loại giá"
              options={PRICE_TYPES}
            />
          </Form.Item>
          <Form.Item name="price" label="Giá" rules={[{ required: true, message: "Nhập giá!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="Hiệu lực từ" rules={[{ required: true, message: "Chọn ngày bắt đầu!" }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="effectiveTo" label="Hiệu lực đến">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa giá"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="price" label="Giá" rules={[{ required: true, message: "Nhập giá!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="effectiveTo" label="Hiệu lực đến">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductPriceManager;