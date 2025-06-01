import React, { useEffect, useState } from "react";
import { Form, Input, Button, Select, InputNumber, message, Space, Card, Divider } from "antd";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./OrderCreate.css";

const OrderCreate = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [details, setDetails] = useState([{ productId: null, unitId: null, quantity: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [productPrices, setProductPrices] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null); // Lưu thông tin đơn hàng vừa tạo

  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchUnits();
    fetchProductPrices();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Customer/list");
      setCustomers(res.data || []);
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

  // Thêm dòng chi tiết mới
  const addDetail = () => {
    setDetails([...details, { productId: null, unitId: null, quantity: 1, price: 0 }]);
  };

  // Xóa dòng chi tiết
  const removeDetail = (idx) => {
    setDetails(details.filter((_, i) => i !== idx));
  };

  // Cập nhật dòng chi tiết
  const updateDetail = (idx, field, value) => {
    const newDetails = [...details];
    newDetails[idx][field] = value;
    // Nếu chọn sản phẩm thì tự động set đơn vị mặc định nếu có
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      if (product && product.baseUnitId) {
        newDetails[idx].unitId = product.baseUnitId;
      }
      // Lấy giá sale từ ProductPrice
      const salePriceObj = productPrices.find(
        pp => pp.productId === value && pp.priceType?.toLowerCase() === "sale"
      );
      if (salePriceObj && salePriceObj.price) {
        newDetails[idx].price = salePriceObj.price;
      }
    }
    setDetails(newDetails);
  };

  // Tìm khách hàng theo tên
  const filterCustomer = (input, option) =>
    option?.label?.toLowerCase().includes(input.toLowerCase());

  // Submit tạo đơn hàng
  const onFinish = async (values) => {
    if (details.length === 0 || details.some(d => !d.productId || !d.unitId || !d.quantity || !d.price)) {
      message.error("Vui lòng nhập đầy đủ thông tin chi tiết đơn hàng!");
      return;
    }
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      // Tính tổng tiền
      const totalAmount = details.reduce((sum, d) => sum + (d.price * d.quantity), 0);
      // Tạo mã đơn hàng tự động (hoặc cho người dùng nhập)
      const orderCode = "ORD" + Date.now();
      // Ngày đơn là ngày hiện tại
      const orderDate = new Date().toISOString();
      // Tạo đơn hàng
      const orderRes = await axios.post("https://localhost:7193/Order/add", {
        orderCode,
        orderDate,
        customerId: values.customerId,
        orderType: "Sale",
        status: "Draft",
        totalAmount,
        note: values.note,
        createdBy: userData.id,
      });
      const orderId = orderRes.data.id;

      // Tạo từng dòng chi tiết
      for (const d of details) {
        await axios.post("https://localhost:7193/OrderDetail/add", {
          orderId,
          productId: d.productId,
          unitId: d.unitId,
          quantity: d.quantity,
          price: d.price,
          discount: d.discount ?? 0,
          vat: d.vat ?? 0,
          note: d.note,
          createdBy: userData.id,
        });
      }
      message.success("Tạo đơn hàng thành công!");
      // Lưu thông tin đơn hàng vừa tạo để hiển thị
      setCreatedOrder({
        ...orderRes.data,
        orderCode,
        orderDate,
        customerId: values.customerId,
        customerName: customers.find(c => c.id === values.customerId)?.customerName,
        totalAmount,
        details: details.map(d => ({
          ...d,
          productName: products.find(p => p.id === d.productId)?.productName,
          unitName: units.find(u => u.id === d.unitId)?.unitName,
        })),
      });
      // Không reset form ở đây
    } catch (err) {
      message.error(err.response?.data?.message || "Tạo đơn hàng thất bại!");
    }
    setLoading(false);
  };

  // Hàm làm mới form và chi tiết
  const handleReset = () => {
    form.resetFields();
    setDetails([{ productId: null, unitId: null, quantity: 1, price: 0 }]);
    setCreatedOrder(null);
  };

  // Hàm xuất PDF
  const exportPDF = () => {
    if (!createdOrder) return;
    const doc = new jsPDF();

    // Thông tin công ty
    doc.setFontSize(14);
    doc.text("CÔNG TY TNHH TALOPACK", 15, 15);
    doc.setFontSize(10);
    doc.text("Địa chỉ: 330 Long BÌnh, Nguyễn Xiển, TP. Thủ Đức, Thành Phố Hồ Chí Minh", 15, 22);
    doc.text("MST: 0358456212", 15, 27);
    doc.text("Email: talopack@gmail.com", 15, 32);

    // Tiêu đề
    doc.setFontSize(16);
    doc.text("ĐƠN ĐẶT HÀNG", 105, 42, { align: "center" });

    // Thông tin đơn hàng
    doc.setFontSize(11);
    doc.text(`Mã đơn hàng: ${createdOrder.orderCode}`, 15, 52);
    doc.text(`Ngày đơn: ${new Date(createdOrder.orderDate).toLocaleString()}`, 15, 58);
    doc.text(`Khách hàng: ${createdOrder.customerName}`, 15, 64);
    doc.text(`Ghi chú: ${createdOrder.note || ""}`, 15, 70);

    // Bảng chi tiết đơn hàng
    const tableColumn = [
      "STT",
      "Sản phẩm",
      "Đơn vị",
      "Số lượng",
      "Đơn giá",
      "Chiết khấu",
      "VAT",
      "Ghi chú"
    ];
    const tableRows = createdOrder.details.map((d, i) => [
      i + 1,
      d.productName,
      d.unitName,
      d.quantity,
      d.price?.toLocaleString(),
      d.discount,
      d.vat,
      d.note || ""
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 76,
      styles: { fontSize: 10 }
    });

    // Tổng tiền
    let finalY = doc.lastAutoTable.finalY || 76;
    doc.setFontSize(12);
    doc.text(
      `Tổng tiền: ${createdOrder.totalAmount?.toLocaleString()} đ`,
      15,
      finalY + 10
    );

    // Chữ ký
    doc.setFontSize(11);
    doc.text("Giám đốc kinh doanh", 30, finalY + 30);
    doc.text("(Ký và xác nhận)", 30, finalY + 36);
    doc.text("Khách hàng", 150, finalY + 30);
    doc.text("(Ký và xác nhận)", 150, finalY + 36);

    doc.save(`DonDatHang_${createdOrder.orderCode}.pdf`);
  };

  return (
    <Card title={<span className="order-create-title">Tạo đơn hàng mới</span>} className="order-create-card">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          name="customerId"
          label="Khách hàng"
          rules={[{ required: true, message: "Chọn khách hàng!" }]}
        >
          <Select
            showSearch
            placeholder="Nhập tên khách hàng"
            options={customers.map(c => ({
              value: c.id,
              label: c.customerName,
            }))}
            filterOption={filterCustomer}
          />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>

        <div style={{ marginBottom: 16, fontWeight: 600 }}>Chi tiết đơn hàng</div>
        {details.map((d, idx) => (
          <Space
            key={idx}
            className="order-create-detail-row"
            style={{ display: "flex", marginBottom: 8 }}
            align="start"
          >
            <div>
              <div style={{ fontWeight: 500 }}>Sản phẩm</div>
              <Select
                style={{ width: 180 }}
                placeholder="Sản phẩm"
                value={d.productId}
                options={products.map(p => ({ value: p.id, label: p.productName }))}
                onChange={v => updateDetail(idx, "productId", v)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>Đơn vị</div>
              <Select
                style={{ width: 120 }}
                placeholder="Đơn vị"
                value={d.unitId}
                options={units.map(u => ({ value: u.id, label: u.unitName }))}
                onChange={v => updateDetail(idx, "unitId", v)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>Số lượng</div>
              <InputNumber
                min={1}
                placeholder="Số lượng"
                value={d.quantity}
                onChange={v => updateDetail(idx, "quantity", v)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>Đơn giá</div>
              <InputNumber
                min={0}
                placeholder="Đơn giá"
                value={d.price}
                onChange={v => updateDetail(idx, "price", v)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>Chiết khấu</div>
              <InputNumber
                min={0}
                placeholder="Chiết khấu"
                value={d.discount}
                onChange={v => updateDetail(idx, "discount", v)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>VAT</div>
              <InputNumber
                min={0}
                placeholder="VAT"
                value={d.vat}
                onChange={v => updateDetail(idx, "vat", v)}
              />
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>Ghi chú</div>
              <Input
                placeholder="Ghi chú"
                value={d.note}
                onChange={e => updateDetail(idx, "note", e.target.value)}
              />
            </div>
            {details.length > 1 && (
              <Button danger onClick={() => removeDetail(idx)}>
                Xóa
              </Button>
            )}
          </Space>
        ))}
        <Button type="dashed" onClick={addDetail} className="order-create-add-detail" style={{ width: "100%", marginBottom: 16 }}>
          + Thêm dòng chi tiết
        </Button>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo đơn hàng
            </Button>
            <Button onClick={handleReset}>
              Làm mới
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Hiển thị thông tin đơn hàng vừa tạo */}
      {createdOrder && (
        <>
          <Divider />
          <div>
            <h3>Đơn hàng bán vừa tạo</h3>
            <div><b>Mã đơn hàng:</b> {createdOrder.orderCode}</div>
            <div><b>Ngày đơn:</b> {new Date(createdOrder.orderDate).toLocaleString()}</div>
            <div><b>Khách hàng:</b> {createdOrder.customerName}</div>
            <div><b>Tổng tiền:</b> {createdOrder.totalAmount?.toLocaleString()} đ</div>
            <div><b>Ghi chú:</b> {createdOrder.note}</div>
            <div style={{ marginTop: 8 }}>
              <b>Chi tiết:</b>
              <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ border: "1px solid #eee", padding: 4 }}>Sản phẩm</th>
                    <th style={{ border: "1px solid #eee", padding: 4 }}>Đơn vị</th>
                    <th style={{ border: "1px solid #eee", padding: 4 }}>Số lượng</th>
                    <th style={{ border: "1px solid #eee", padding: 4 }}>Đơn giá</th>
                    <th style={{ border: "1px solid #eee", padding: 4 }}>Chiết khấu</th>
                    <th style={{ border: "1px solid #eee", padding: 4 }}>VAT</th>
                    <th style={{ border: "1px solid #eee", padding: 4 }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {createdOrder.details.map((d, i) => (
                    <tr key={i}>
                      <td style={{ border: "1px solid #eee", padding: 4 }}>{d.productName}</td>
                      <td style={{ border: "1px solid #eee", padding: 4 }}>{d.unitName}</td>
                      <td style={{ border: "1px solid #eee", padding: 4 }}>{d.quantity}</td>
                      <td style={{ border: "1px solid #eee", padding: 4 }}>{d.price?.toLocaleString()}</td>
                      <td style={{ border: "1px solid #eee", padding: 4 }}>{d.discount}</td>
                      <td style={{ border: "1px solid #eee", padding: 4 }}>{d.vat}</td>
                      <td style={{ border: "1px solid #eee", padding: 4 }}>{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="primary" onClick={exportPDF} style={{ margin: "16px 0" }}>
              Xuất PDF
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default OrderCreate;