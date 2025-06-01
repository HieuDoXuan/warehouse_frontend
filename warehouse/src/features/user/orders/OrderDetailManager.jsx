import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm } from "antd";
import axios from "axios";

const OrderDetailManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Bạn cần fetch danh sách sản phẩm và đơn vị tính để chọn
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [orders, setOrders] = useState([]); // Thêm state lưu danh sách đơn hàng
  const [productPrices, setProductPrices] = useState([]);

  useEffect(() => {
    fetchData();
    fetchOrders();
    fetchProducts();
    fetchUnits();
    fetchProductPrices(); // Thêm dòng này
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://localhost:7193/OrderDetail/list");
      setData(res.data || []);
    } catch {
      message.error("Không thể tải danh sách chi tiết đơn hàng!");
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Order/list");
      setOrders(res.data || []);
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Product/list");
      setProducts(res.data || []);
    } catch {}
  };

  const fetchUnits = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Unit/list");
      setUnits(res.data || []);
    } catch {}
  };

  const fetchProductPrices = async () => {
    try {
      const res = await axios.get("https://localhost:7193/ProductPrice/list");
      setProductPrices(res.data || []);
    } catch {}
  };

  const handleAdd = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ...values,
        Discount: values.discount ?? 0,   // Đảm bảo luôn có Discount
        VAT: values.vat ?? 0,             // Đảm bảo luôn có VAT
        CreatedBy: userData.id,
      };
      await axios.post("https://localhost:7193/OrderDetail/add", payload);
      message.success("Thêm chi tiết đơn hàng thành công!");
      setShowAdd(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  const openEdit = (record) => {
    setEditing(record);
    editForm.setFieldsValue(record);
    setShowEdit(true);
  };

  const handleEdit = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/OrderDetail/update/${editing.id}`, {
        ...editing,
        ...values,
        UpdatedBy: userData.id,
      });
      message.success("Cập nhật thành công!");
      setShowEdit(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  const handleDelete = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.put(`https://localhost:7193/OrderDetail/soft-delete/${id}?updatedBy=${userData.id}`);
      message.success("Đã huỷ chi tiết đơn hàng!");
      fetchData();
    } catch {
      message.error("Huỷ thất bại!");
    }
  };

  // Khi chọn sản phẩm, tự động set đơn vị mặc định (baseUnitId)
  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && product.baseUnitId) {
      addForm.setFieldsValue({ unitId: product.baseUnitId });
    }
    // Lấy giá từ ProductPrice nếu có
    const priceObj = productPrices.find(pp => pp.productId === productId);
    if (priceObj && priceObj.price) {
      addForm.setFieldsValue({ price: priceObj.price });
    }
  };

  const columns = [
    { title: "Mã đơn", dataIndex: "orderId", key: "orderId" },
    { title: "Sản phẩm", dataIndex: "productId", key: "productId", render: id => products.find(p => p.id === id)?.productName || id },
    { title: "Đơn vị", dataIndex: "unitId", key: "unitId", render: id => units.find(u => u.id === id)?.unitName || id },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    { title: "Đơn giá", dataIndex: "price", key: "price" },
    { title: "Chiết khấu", dataIndex: "discount", key: "discount" },
    { title: "VAT", dataIndex: "vat", key: "vat" },
    { title: "Thành tiền", dataIndex: "totalAmount", key: "totalAmount" },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <>
          <Button size="small" onClick={() => openEdit(record)} style={{ marginRight: 8 }}>Sửa</Button>
          <Popconfirm
            title="Huỷ chi tiết này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Huỷ"
            cancelText="Không"
          >
            <Button size="small" danger>Huỷ</Button>
          </Popconfirm>
        </>
      )
    }
  ];

  return (
    <div>
      <h2>Quản lý chi tiết đơn hàng</h2>
      <Button type="primary" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
        Thêm chi tiết
      </Button>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal
        title="Thêm chi tiết đơn hàng"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onOk={() => addForm.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="orderId" label="Mã đơn hàng" rules={[{ required: true, message: "Chọn mã đơn hàng!" }]}>
            <Select
              showSearch
              placeholder="Chọn mã đơn hàng"
              options={orders.map(o => ({ value: o.id, label: o.orderCode }))}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true, message: "Chọn sản phẩm!" }]}>
            <Select
              showSearch
              placeholder="Chọn sản phẩm"
              options={products.map(p => ({ value: p.id, label: p.productName }))}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleProductChange}
            />
          </Form.Item>
          <Form.Item name="unitId" label="Đơn vị" rules={[{ required: true, message: "Chọn đơn vị!" }]}>
            <Select
              options={units.map(u => ({ value: u.id, label: u.unitName }))}
              placeholder="Chọn đơn vị"
            />
          </Form.Item>
          <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, type: "number", min: 1, message: "Nhập số lượng!" }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Đơn giá"
            rules={[{ required: true, type: "number", min: 1, message: "Nhập đơn giá!" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="discount" label="Chiết khấu" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="vat" label="VAT" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sửa chi tiết đơn hàng"
        open={showEdit}
        onCancel={() => setShowEdit(false)}
        onOk={() => editForm.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: "Nhập số lượng!" }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Đơn giá"
            rules={[{ required: true, type: "number", min: 1, message: "Nhập đơn giá!" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="discount" label="Chiết khấu">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="vat" label="VAT">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetailManager;