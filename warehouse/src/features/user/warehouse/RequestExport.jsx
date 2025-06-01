import React, { useEffect, useState } from "react";
import { Form, InputNumber, Select, Button, Input, message, Card } from "antd";
import axios from "axios";
import "./warehouse.css";

const RequestExport = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    axios.get("/Product/list").then(res => setProducts(res.data || []));
    axios.get("/Warehouse/list").then(res => setWarehouses(res.data || []));
    axios.get("/Unit/list").then(res => setUnits(res.data || []));
  }, []);

  const onFinish = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      await axios.post("/InventoryTransaction/request-export", {
        ...values,
        createdBy: userData.id
      });
      message.success("Đã gửi yêu cầu xuất kho, chờ phê duyệt!");
      form.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || "Gửi yêu cầu thất bại!");
    }
  };

  return (
    <Card className="warehouse-card" title="Nhập kho">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true }]}>
          <Select options={products.map(p => ({ value: p.id, label: p.productName }))} />
        </Form.Item>
        <Form.Item name="warehouseId" label="Kho" rules={[{ required: true }]}>
          <Select options={warehouses.map(w => ({ value: w.id, label: w.warehouseName }))} />
        </Form.Item>
        <Form.Item name="unitId" label="Đơn vị tính" rules={[{ required: true }]}>
          <Select options={units.map(u => ({ value: u.id, label: u.unitName }))} />
        </Form.Item>
        <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="price" label="Đơn giá">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="referenceCode" label="Mã phiếu xuất">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Ghi chú">
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">Gửi yêu cầu</Button>
      </Form>
    </Card>
  );
};

export default RequestExport;