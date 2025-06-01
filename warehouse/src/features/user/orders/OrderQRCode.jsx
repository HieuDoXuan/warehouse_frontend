import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Space, Card, Divider } from "antd";
import axios from "axios";
import "../../../utils/Roboto-Regular-normal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./OrderCreate.css";
import { QRCodeCanvas } from "qrcode.react"; // Dùng cho hiển thị React
import QRCodeLib from "qrcode";         // Dùng cho PDF

const OrderQRCode = () => {
  const [createdOrder, setCreatedOrder] = useState(null);
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const [form] = Form.useForm();

  // Hàm lấy thông tin đơn hàng theo mã
  const fetchOrderByCode = async () => {
    if (!orderCodeInput) {
      message.warning("Vui lòng nhập mã đơn hàng!");
      return;
    }
    try {
      // Lấy danh sách đơn hàng và tìm theo mã
      const res = await axios.get("https://localhost:7193/Order/list");
      const found = res.data.find(o => o.orderCode === orderCodeInput);
      if (!found) {
        message.error("Không tìm thấy đơn hàng!");
        setCreatedOrder(null);
        return;
      }
      // Nếu API trả về details trong found, dùng luôn:
      setCreatedOrder(found);
      message.success("Đã lấy thông tin đơn hàng!");
    } catch (err) {
      message.error("Không tìm thấy đơn hàng!");
      setCreatedOrder(null);
    }
  };

  // Hàm xuất PDF
  const exportPDF = async () => {
    if (!createdOrder) return;
    const doc = new jsPDF();
    doc.setFont("Roboto");

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

    // Tạo QR code từ mã đơn hàng
    const qrValue = createdOrder.orderCode;
    const qrDataUrl = await QRCodeLib.toDataURL(qrValue, { width: 100, margin: 1 });
    doc.addImage(qrDataUrl, "PNG", 160, 15, 30, 30);

    // Bảng chi tiết đơn hàng (nếu có)
    if (createdOrder.details && createdOrder.details.length > 0) {
      autoTable(doc, {
        head: [[
          "STT", "Sản phẩm", "Đơn vị", "Số lượng", "Đơn giá", "Chiết khấu", "VAT", "Ghi chú"
        ]],
        body: createdOrder.details.map((d, i) => [
          i + 1,
          d.productName,
          d.unitName,
          d.quantity,
          d.price?.toLocaleString(),
          d.discount,
          d.vat,
          d.note || ""
        ]),
        startY: 76,
        styles: { font: "Roboto", fontStyle: "normal", fontSize: 10 },
        headStyles: { font: "Roboto", fontStyle: "normal", fontSize: 10 },
        bodyStyles: { font: "Roboto", fontStyle: "normal", fontSize: 10 },
      });
    }

    // Tổng tiền
    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 90;
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
    <Card title={<span className="order-create-title">Tra cứu đơn hàng & mã QR</span>} className="order-create-card">
      {/* Ô nhập mã đơn hàng để tra cứu */}
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Nhập mã đơn hàng để tra cứu"
          value={orderCodeInput}
          onChange={e => setOrderCodeInput(e.target.value)}
          style={{ width: 220 }}
        />
        <Button type="primary" onClick={fetchOrderByCode}>
          Tra cứu
        </Button>
      </Space>

      {/* Hiển thị thông tin đơn hàng vừa tra cứu */}
      {createdOrder && (
        <>
          <Divider />
          <div>
            <h3>Đơn hàng bán</h3>
            <div><b>Mã đơn hàng:</b> {createdOrder.orderCode}</div>
            <div><b>Ngày đơn:</b> {new Date(createdOrder.orderDate).toLocaleString()}</div>
            <div><b>Khách hàng:</b> {createdOrder.customerName}</div>
            <div><b>Tổng tiền:</b> {createdOrder.totalAmount?.toLocaleString()} đ</div>
            <div><b>Ghi chú:</b> {createdOrder.note}</div>
            {/* Hiển thị QR code */}
            <div style={{ margin: "16px 0" }}>
              <QRCodeCanvas value={createdOrder.orderCode} size={120} />
              <div style={{ textAlign: "center", fontSize: 12, color: "#888" }}>Mã QR cho đơn hàng</div>
            </div>
            {/* Hiển thị chi tiết nếu có */}
            {createdOrder.details && createdOrder.details.length > 0 && (
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
            )}
            <Button type="primary" onClick={exportPDF} style={{ margin: "16px 0" }}>
              Xuất PDF
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default OrderQRCode;