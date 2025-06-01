import React, { useEffect, useState } from "react";
import { Form, InputNumber, Select, Button, Input, message, Card, Row, Col, Statistic, Alert } from "antd";
import axios from "axios";
import "./warehouse.css";

const InventoryExport = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [productPrices, setProductPrices] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [warehouseStocks, setWarehouseStocks] = useState([]); // Danh sách tồn kho tại các kho

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
    fetchUnits(); 
    fetchProductPrices();
  }, []);

  // Kiểm tra tồn kho khi người dùng chọn cả sản phẩm và kho
  useEffect(() => {
    if (selectedProduct && selectedWarehouse) {
      checkProductStock(selectedProduct, selectedWarehouse);
    } else {
      setCurrentStock(null);
    }
  }, [selectedProduct, selectedWarehouse]);

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

  // Hàm kiểm tra tồn kho
  const checkProductStock = async (productId, warehouseId) => {
    try {
      setCheckingStock(true);
      const res = await axios.get(`https://localhost:7193/InventoryTransaction/check-stock?productId=${productId}&warehouseId=${warehouseId}`);
      const stockList = res.data?.stockList || [];

      if (warehouseId) {
        const selectedWarehouseStock = stockList.find(stock => stock.warehouseId === warehouseId);
        setCurrentStock(selectedWarehouseStock?.quantity || 0);
      } else {
        setCurrentStock(null); // Không chọn kho cụ thể
      }

      setWarehouseStocks(stockList); // Lưu danh sách tồn kho tại các kho
    } catch (err) {
      console.error("Error checking stock:", err);
      setCurrentStock(0);
      setWarehouseStocks([]);
    } finally {
      setCheckingStock(false);
    }
  };

  const handleProductChange = (productId) => {
    setSelectedProduct(productId);
    form.setFieldsValue({ unitId: undefined, price: undefined });

    const product = products.find(p => p.id === productId);
    if (product?.baseUnitId) {
      form.setFieldsValue({ unitId: product.baseUnitId });
    }

    const exportPrice = productPrices.find(
      p => p.productId === productId && p.priceType?.toLowerCase() === "export"
    );
    if (exportPrice) {
      form.setFieldsValue({ price: exportPrice.price });
    }
  };

  const handleWarehouseChange = (warehouseId) => {
    setSelectedWarehouse(warehouseId);
    if (selectedProduct) {
      checkProductStock(selectedProduct, warehouseId); // Kiểm tra tồn kho tại kho đã chọn
    }
  };

  const onFinish = async (values) => {
    try {
      // Kiểm tra số lượng xuất không vượt quá tồn kho
      if (values.quantity > currentStock) {
        message.error(`Số lượng xuất (${values.quantity}) vượt quá tồn kho hiện tại (${currentStock})`);
        return;
      }

      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      
      // Tạo mã phiếu tự động nếu chưa có
      const referenceCode = values.referenceCode || `XK${Math.floor(Math.random() * 100000000)}`;
      
      // Đảm bảo đúng kiểu dữ liệu và tên trường
      const payload = {
        ProductId: Number(values.productId),
        WarehouseId: Number(values.warehouseId),
        Quantity: Number(values.quantity),
        UnitId: Number(values.unitId),
        Price: values.price ? Number(values.price) : null,
        ReferenceCode: referenceCode,
        Description: values.description || null,
        CreatedBy: userData.id,
        TransactionType: "Export" // Loại giao dịch là xuất kho
      };

      console.log("Sending payload:", payload);
      
      // Gọi API xuất kho trực tiếp (không qua phê duyệt)
      const response = await axios.post("https://localhost:7193/InventoryTransaction/export", payload);
      
      // Lưu thông tin giao dịch để hiển thị
      setLastTransaction(response.data.details);
      
      // Cập nhật lại số lượng tồn kho
      setCurrentStock(response.data.details.currentStock);
      
      message.success("Xuất kho thành công!");
      
      // Reset form và các state liên quan
      form.resetFields();
      setSelectedProduct(null);
      setSelectedWarehouse(null);
      
    } catch (err) {
      console.error("Export error:", err.response?.data || err);
      message.error(err.response?.data?.message || "Xuất kho thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hiển thị thông tin giao dịch cuối cùng */}
      {lastTransaction && (
        <Alert
          message="Xuất kho thành công"
          description={
            <div>
              <p><strong>Sản phẩm:</strong> {lastTransaction.productName}</p>
              <p><strong>Kho:</strong> {lastTransaction.warehouseName}</p>
              <p><strong>Số lượng xuất:</strong> {lastTransaction.exportedQuantity}</p>
              <p><strong>Tồn kho trước khi xuất:</strong> {lastTransaction.previousStock}</p>
              <p><strong>Tồn kho hiện tại:</strong> {lastTransaction.currentStock}</p>
            </div>
          }
          type="success"
          showIcon
          closable
          onClose={() => setLastTransaction(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card className="warehouse-card" title="Xuất kho">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}>
                <Select
                  options={products.map(p => ({ value: p.id, label: p.productName }))}
                  onChange={handleProductChange}
                  placeholder="Chọn sản phẩm"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="warehouseId" label="Kho" rules={[{ required: true, message: "Vui lòng chọn kho" }]}>
                <Select
                  options={warehouses.map(w => ({ value: w.id, label: w.warehouseName }))}
                  placeholder="Chọn kho"
                  showSearch
                  optionFilterProp="label"
                  onChange={handleWarehouseChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="unitId" label="Đơn vị tính" rules={[{ required: true, message: "Vui lòng chọn đơn vị tính" }]}>
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
            </Col>

            <Col xs={24} md={12}>
              <Form.Item 
                name="quantity" 
                label={
                  <span>
                    Số lượng 
                    {currentStock !== null && 
                      <span style={{ marginLeft: 8, fontSize: 12, color: currentStock > 0 ? 'green' : 'red' }}>
                        (Tồn kho: {currentStock})
                      </span>
                    }
                  </span>
                }
                rules={[
                  { required: true, message: "Vui lòng nhập số lượng" },
                  {
                    validator: (_, value) => {
                      if (value > currentStock) {
                        return Promise.reject(`Số lượng xuất không được vượt quá tồn kho (${currentStock})`);
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber min={1} max={currentStock || undefined} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="price" label="Đơn giá">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="referenceCode" label="Mã phiếu xuất">
                <Input placeholder="Để trống sẽ tạo mã tự động" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Lý do xuất kho">
            <Input.TextArea placeholder="Nhập lý do xuất kho" />
          </Form.Item>

          {currentStock !== null && currentStock === 0 ? (
            <Alert
              message="Không có tồn kho"
              description="Sản phẩm này không có tồn kho tại kho đã chọn."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : null}

          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            disabled={currentStock === 0 || currentStock === null}
          >
            Xuất kho
          </Button>
        </Form>
      </Card>

      {warehouseStocks.length > 0 && (
        <Card title="Tồn kho tại các kho">
          <ul>
            {warehouseStocks.map(stock => (
              <li key={stock.warehouseId}>
                <strong>{stock.warehouseName}:</strong> {stock.quantity} sản phẩm
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default InventoryExport;