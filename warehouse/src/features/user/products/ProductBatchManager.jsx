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

const ProductBatchManager = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Quyền
  const permissions = getUserPermissions();
  const canView = permissions.includes("Quản lý lô và hạn sử dụng") || permissions.includes("Xem tìm kiếm lô hàng và hạn sử dụng");
  const canAdd = permissions.includes("Quản lý lô và hạn sử dụng") || permissions.includes("Thêm lô hàng và hạn sử dụng");
  const canEdit = permissions.includes("Quản lý lô và hạn sử dụng");
  const canDelete = permissions.includes("Quản lý lô và hạn sử dụng");

  useEffect(() => {
    if (canView) {
      fetchBatches();
      fetchProducts();
      fetchWarehouses();
    }
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/ProductLot/list");
      setBatches(res.data || []);
    } catch {
      message.error("Không thể tải danh sách lô!");
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
        LotNumber: values.lotNumber,
        ManufactureDate: values.manufactureDate ? values.manufactureDate.format("YYYY-MM-DD") : null,
        ExpiryDate: values.expiryDate ? values.expiryDate.format("YYYY-MM-DD") : null,
        Quantity: Number(values.quantity),
        WarehouseId: values.warehouseId ? Number(values.warehouseId) : null,
        CreatedBy: userData.id,
      };
      await axios.post("https://localhost:7193/ProductLot/add", payload);
      message.success("Thêm lô thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchBatches();
    } catch (err) {
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  // Sửa
  const openEdit = (record) => {
    setEditingBatch(record);
    editForm.setFieldsValue({
      productId: record.productId,
      lotNumber: record.lotNumber,
      manufactureDate: record.manufactureDate ? dayjs(record.manufactureDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
      quantity: record.quantity,
      warehouseId: record.warehouseId,
    });
    setShowEdit(true);
  };
  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        LotNumber: values.lotNumber, // BẮT BUỘC phải có dòng này!
        ManufactureDate: values.manufactureDate ? values.manufactureDate.format("YYYY-MM-DD") : null,
        ExpiryDate: values.expiryDate ? values.expiryDate.format("YYYY-MM-DD") : null,
        Quantity: Number(values.quantity),
        UpdatedBy: userData.id,
      };
      await axios.put(`https://localhost:7193/ProductLot/update/${editingBatch.id}`, payload);
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditingBatch(null);
      fetchBatches();
    } catch (err) {
      console.log("Lỗi khi sửa lô:", err.response?.data);
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/ProductLot/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã chuyển lô sang trạng thái Inactive!");
      fetchBatches();
    } catch {
      message.error("Xoá mềm thất bại!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    try {
      await axios.delete(`https://localhost:7193/ProductLot/hard-delete/${id}`);
      message.success("Đã xoá vĩnh viễn lô!");
      fetchBatches();
    } catch {
      message.error("Xoá cứng thất bại!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/ProductLot/reactivate/${id}?updatedBy=${userData.id}`);
      message.success("Đã kích hoạt lại lô!");
      fetchBatches();
    } catch {
      message.error("Kích hoạt lại thất bại!");
    }
  };

  // Table columns
  const columns = [
    { title: "Sản phẩm", dataIndex: "productId", key: "productId", render: id => products.find(p => p.id === id)?.productName || "" },
    { title: "Lô", dataIndex: "lotNumber", key: "lotNumber" },
    { title: "Ngày SX", dataIndex: "manufactureDate", key: "manufactureDate", render: d => d ? dayjs(d).format("DD/MM/YYYY") : "" },
    { title: "Hạn dùng", dataIndex: "expiryDate", key: "expiryDate", render: d => d ? dayjs(d).format("DD/MM/YYYY") : "" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    { title: "Kho", dataIndex: "warehouseId", key: "warehouseId", render: id => warehouses.find(w => w.id === id)?.warehouseName || "" },
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
                    title="Xoá mềm lô này?"
                    onConfirm={() => handleSoftDelete(record.id)}
                    okText="Xoá mềm"
                    cancelText="Huỷ"
                  >
                    <Button size="small" danger style={{ marginRight: 8 }}>Xoá mềm</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Xoá vĩnh viễn lô này? Không thể khôi phục!"
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
      <h2>Quản Lý Lô Và Hạn Sử Dụng</h2>
      {canAdd && (
        <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
          Thêm mới lô
        </Button>
      )}
      <Table
        dataSource={batches}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm mới */}
      <Modal
        title="Thêm mới lô"
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
          <Form.Item name="lotNumber" label="Số lô" rules={[{ required: true, message: "Nhập số lô!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="manufactureDate" label="Ngày sản xuất">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="expiryDate" label="Hạn sử dụng">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: "Nhập số lượng!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="warehouseId" label="Kho">
            <Select
              allowClear
              placeholder="Chọn kho"
              options={warehouses.map(w => ({ value: w.id, label: w.warehouseName }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa lô"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="productId" label="Sản phẩm">
            <Select
              allowClear
              placeholder="Chọn sản phẩm"
              options={products.map(p => ({ value: p.id, label: p.productName }))}
              disabled // Nếu không muốn cho sửa thì giữ disabled
            />
          </Form.Item>
          <Form.Item name="lotNumber" label="Số lô">
            <Input disabled />
          </Form.Item>
          <Form.Item name="manufactureDate" label="Ngày sản xuất">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="expiryDate" label="Hạn sử dụng">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: "Nhập số lượng!" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="warehouseId" label="Kho">
            <Select
              allowClear
              placeholder="Chọn kho"
              options={warehouses.map(w => ({ value: w.id, label: w.warehouseName }))}
              disabled
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductBatchManager;