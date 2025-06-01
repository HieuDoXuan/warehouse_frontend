import React, { useEffect, useState } from "react";
import { Form, InputNumber, Select, Button, Input, message, Card } from "antd";
import axios from "axios";
import "./warehouse.css";

const InventoryImport = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [productPrices, setProductPrices] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
    fetchUnits(); // cần để lấy tên đơn vị theo ID
    fetchProductPrices();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Product/list");
      setProducts(res.data || []);
    } catch {
      message.error("Không thể tải danh sách sản phẩm!");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Warehouse/list");
      setWarehouses(res.data || []);
    } catch {
      message.error("Không thể tải danh sách kho!");
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

  const fetchProductPrices = async () => {
    try {
      const res = await axios.get("https://localhost:7193/ProductPrice/list");
      setProductPrices(res.data || []);
    } catch {
      message.error("Không thể tải đơn giá!");
    }
  };

  const handleProductChange = (productId) => {
    setSelectedProduct(productId);
    form.setFieldsValue({ unitId: undefined, price: undefined });

    const product = products.find(p => p.id === productId);
    if (product?.baseUnitId) {
      form.setFieldsValue({ unitId: product.baseUnitId });
    }

    const importPrice = productPrices.find(
      p => p.productId === productId && p.priceType?.toLowerCase() === "import"
    );
    if (importPrice) {
      form.setFieldsValue({ price: importPrice.price });
    }
  };

  const onFinish = async (values) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      
      // Đảm bảo đúng kiểu dữ liệu và tên trường
      const payload = {
        ProductId: Number(values.productId),
        WarehouseId: Number(values.warehouseId),
        Quantity: Number(values.quantity),
        UnitId: Number(values.unitId),
        Price: values.price ? Number(values.price) : null,
        ReferenceCode: values.referenceCode || null,
        Description: values.description || null,
        CreatedBy: userData.id,
        TransactionType: "Import" // Thêm dòng này
      };

      console.log("Sending payload:", payload);
      
      await axios.post("https://localhost:7193/InventoryTransaction/import", payload);
      message.success("Nhập kho thành công!");
      form.resetFields();
    } catch (err) {
      console.error("Import error:", err.response?.data);
      message.error(err.response?.data?.message || "Nhập kho thất bại!");
    }
  };

  return (
    <Card className="warehouse-card" title="Nhập kho">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true }]}>
          <Select
            options={products.map(p => ({ value: p.id, label: p.productName }))}
            onChange={handleProductChange}
            placeholder="Chọn sản phẩm"
          />
        </Form.Item>

        <Form.Item name="warehouseId" label="Kho" rules={[{ required: true }]}>
          <Select
            options={warehouses.map(w => ({ value: w.id, label: w.warehouseName }))}
            placeholder="Chọn kho"
          />
        </Form.Item>

        <Form.Item name="unitId" label="Đơn vị tính" rules={[{ required: true }]}>
          <Select
            options={units
              .filter(u => {
                if (!selectedProduct) return true;
                const product = products.find(p => p.id === selectedProduct);
                return product && u.id === product.baseUnitId;
              })
              .map(u => ({ value: u.id, label: u.unitName }))
            }
            placeholder={selectedProduct ? "Chọn đơn vị tính" : "Chọn sản phẩm trước"}
            disabled={!selectedProduct}
          />
        </Form.Item>

        <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="price" label="Đơn giá">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="referenceCode" label="Mã phiếu nhập">
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Ghi chú">
          <Input />
        </Form.Item>

        <Button type="primary" htmlType="submit">Nhập kho</Button>
      </Form>
    </Card>
  );
};

export default InventoryImport;
