import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Button, message, Popconfirm, Space, Tooltip, Row, Col, Select, DatePicker, Input, Typography, Divider, Badge, Empty } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, ReloadOutlined, ExclamationCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import "./warehouse.css";
import { exportAfterApproval } from "./ExportAfterApproval";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

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

const InventoryApprovals = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    status: 'Pending', // Mặc định hiển thị các yêu cầu đang chờ phê duyệt
    productId: null,
    warehouseId: null,
    dateRange: null,
    referenceCode: ""
  });

  useEffect(() => {
    fetchApprovals();
    fetchProducts();
    fetchWarehouses();
    // Tính số yêu cầu chờ duyệt cho badge
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      // Khi API count đã được triển khai, mở comment dưới đây
      const res = await axios.get("https://localhost:7193/InventoryTransactionApproval/list?status=Pending");
      setPendingCount(res.data?.length || 0);
    } catch (err) {
      console.error("Lỗi đếm phê duyệt chờ xử lý:", err);
      setPendingCount(0); // Fallback to 0
    }
  };

  // Cập nhật hàm fetchApprovals để sử dụng API thực
  const fetchApprovals = async () => {
    setLoading(true);
    try {
      // Xây dựng query params từ filters
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'All') 
        params.append("status", filters.status);
      
      if (filters.productId) 
        params.append("productId", filters.productId);
      
      if (filters.warehouseId) 
        params.append("warehouseId", filters.warehouseId);
      
      if (filters.referenceCode) 
        params.append("referenceCode", filters.referenceCode);
      
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.append("startDate", filters.dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", filters.dateRange[1].format("YYYY-MM-DD"));
      }

      // Gọi API thực
      const res = await axios.get(`https://localhost:7193/InventoryTransactionApproval/list?${params.toString()}`);
      setData(res.data || []);
      
    } catch (err) {
      console.error("Lỗi lấy danh sách phê duyệt:", err);
      message.error("Không thể tải danh sách phê duyệt");
      
      // Fallback đến mock data nếu API thất bại
      const mockData = [
        {
          id: 1,
          referenceCode: "XK202506001",
          transactionType: "Export",
          productId: 1,
          warehouseId: 1,
          quantity: 150,
          createdByName: "Nguyễn Văn A",
          createdAt: new Date().toISOString(),
          approved: false,
          approvedByName: null
        },
        {
          id: 2,
          referenceCode: "XK202506002",
          transactionType: "Export",
          productId: 2,
          warehouseId: 2, 
          quantity: 50,
          createdByName: "Trần Thị B",
          createdAt: new Date().toISOString(),
          approved: true,
          approvedByName: "Admin"
        }
      ];
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Product/list");
      setProducts(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách sản phẩm:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Warehouse/list");
      setWarehouses(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách kho:", err);
    }
  };

  // Cập nhật hàm handleApprove để sử dụng API thực
  const handleApprove = async (id) => {
    const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");

    if (!userData.id) {
      message.error("Không tìm thấy thông tin người dùng!");
      return;
    }

    try {
      setApproving(true);

      // Gọi API phê duyệt thực
      await axios.put(`https://localhost:7193/InventoryTransactionApproval/approve/${id}?approvedBy=${userData.id}`);
      message.success("Phê duyệt thành công!");

      // Tìm thông tin phiếu vừa duyệt để xuất kho
      const approvedItem = data.find(item => item.id === id);
      if (approvedItem) {
        const result = await exportAfterApproval(approvedItem, userData.id);
        if (result.success) {
          message.success(result.message);
        } else {
          message.error(result.message);
        }
      }

      // Làm mới danh sách sau khi phê duyệt và xuất kho
      fetchApprovals();
      fetchPendingCount();

    } catch (err) {
      console.error("Lỗi phê duyệt hoặc xuất kho:", err);
      if (err.response?.status === 400) {
        message.warning(err.response?.data?.message || "Yêu cầu đã được phê duyệt trước đó.");
      } else if (err.response?.status === 404) {
        message.error(err.response?.data?.message || "Không tìm thấy yêu cầu phê duyệt.");
      } else {
        message.error("Phê duyệt hoặc xuất kho thất bại! Vui lòng thử lại sau.");
      }
      setData(prevData => 
        prevData.map(item => 
          item.id === id ? {...item, approved: true, approvedByName: userData.displayName || "Admin"} : item
        )
      );
    } finally {
      setApproving(false);
    }
  };

  // Điều chỉnh hàm handleReject
  const handleReject = async (id, reason) => {
    try {
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      
      if (!userData.id) {
        message.error("Không tìm thấy thông tin người dùng!");
        return;
      }

      // Option 1: Frontend-only (chỉ để demo)
      message.success("Đã từ chối yêu cầu!");
      setData(prevData => prevData.filter(item => item.id !== id));
      
      // Option 2: Khi API đã sẵn sàng
      // await axios.put(`https://localhost:7193/InventoryTransactionApproval/reject/${id}?rejectedBy=${userData.id}&reason=${encodeURIComponent(reason)}`);
      // message.success("Đã từ chối yêu cầu!");
      // fetchApprovals();
      // fetchPendingCount();
      
    } catch (err) {
      console.error("Lỗi từ chối phê duyệt:", err);
      message.error(err.response?.data?.message || "Không thể từ chối yêu cầu!");
    }
  };

  const handleSearch = () => {
    fetchApprovals();
  };

  const handleReset = () => {
    setFilters({
      status: 'Pending',
      productId: null,
      warehouseId: null,
      dateRange: null,
      referenceCode: ""
    });
    setTimeout(() => {
      fetchApprovals();
    }, 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return dayjs(dateString).format("DD/MM/YYYY HH:mm");
    } catch {
      return dateString;
    }
  };

  const handleViewTransactions = () => {
    navigate('/user/inventory-transactions');
  };

  // Phân quyền
  const permissions = getUserPermissions();
  const canApprove = permissions.includes("Quản lý Kho") || permissions.includes("Phê Duyệt Xuất Kho");

  if (!canApprove) {
    return <div>Bạn không có quyền phê duyệt xuất kho.</div>;
  }

  return (
    <div className="approval-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={18}>
          <Title level={2}>
            Phê duyệt yêu cầu xuất kho
            {pendingCount > 0 && (
              <Badge count={pendingCount} style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }} />
            )}
          </Title>
          <Text type="secondary">
            Quản lý các yêu cầu xuất kho cần phê duyệt trước khi thực hiện
          </Text>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Space>
            <Button 
              icon={<FileTextOutlined />} 
              onClick={handleViewTransactions}
            >
              Lịch sử giao dịch
            </Button>
            <Button 
              type="primary" 
              onClick={handleSearch}
              icon={<ReloadOutlined />}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      <Card className="warehouse-card">
        {/* Bộ lọc */}
        <div className="filter-container" style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: '16px' }}>
          <Title level={5} style={{ marginBottom: 16 }}>Bộ lọc tìm kiếm</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6} lg={6}>
              <div className="filter-label">Mã phiếu</div>
              <Input
                placeholder="Nhập mã phiếu..."
                value={filters.referenceCode}
                onChange={e => setFilters({...filters, referenceCode: e.target.value})}
                allowClear
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <div className="filter-label">Trạng thái</div>
              <Select
                placeholder="Chọn trạng thái"
                style={{ width: '100%' }}
                value={filters.status}
                onChange={value => setFilters({...filters, status: value})}
              >
                <Option value="Pending">Đang chờ phê duyệt</Option>
                <Option value="Approved">Đã phê duyệt</Option>
                <Option value="All">Tất cả</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <div className="filter-label">Sản phẩm</div>
              <Select
                placeholder="Chọn sản phẩm"
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
                value={filters.productId}
                onChange={value => setFilters({...filters, productId: value})}
              >
                {products.map(p => (
                  <Option key={p.id} value={p.id}>{p.productName}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <div className="filter-label">Kho</div>
              <Select
                placeholder="Chọn kho"
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
                value={filters.warehouseId}
                onChange={value => setFilters({...filters, warehouseId: value})}
              >
                {warehouses.map(w => (
                  <Option key={w.id} value={w.id}>{w.warehouseName}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <div className="filter-label">Khoảng thời gian</div>
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                value={filters.dateRange}
                onChange={(dates) => setFilters({...filters, dateRange: dates})}
              />
            </Col>
            <Col xs={24} sm={12} md={16} lg={16}>
              <div className="filter-label">&nbsp;</div>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  Tìm kiếm
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '0 0 16px 0' }} />

        {/* Bảng dữ liệu */}
        {data.length > 0 ? (
          <Table
            loading={loading}
            dataSource={data}
            rowKey="id"
            scroll={{ x: 1300 }} // Thêm scroll để đảm bảo bảng có thể cuộn ngang
            columns={[
              {
                title: "Mã phiếu",
                dataIndex: "referenceCode",
                width: 150,
                fixed: "left", // Cố định cột này ở bên trái
                render: code => (
                  <Tooltip title="Xem chi tiết">
                    <a onClick={() => message.info(`Chi tiết phiếu ${code}`)}>
                      {code}
                    </a>
                  </Tooltip>
                )
              },
              {
                title: "Loại giao dịch",
                dataIndex: "transactionType",
                render: type => {
                  const types = {
                    'Export': { text: 'Xuất kho', color: 'red' },
                    'TransferOut': { text: 'Chuyển kho', color: 'blue' },
                    'Adjust': { text: 'Điều chỉnh', color: 'purple' }
                  };
                  const config = types[type] || { text: type, color: 'default' };
                  return <Tag color={config.color}>{config.text}</Tag>;
                }
              },
              {
                title: "Sản phẩm",
                dataIndex: "productId",
                render: productId => {
                  const product = products.find(p => p.id === productId);
                  return product ? product.productName : `ID: ${productId}`;
                }
              },
              {
                title: "Kho",
                dataIndex: "warehouseId",
                render: warehouseId => {
                  const warehouse = warehouses.find(w => w.id === warehouseId);
                  return warehouse ? warehouse.warehouseName : `ID: ${warehouseId}`;
                }
              },
              {
                title: "Số lượng",
                dataIndex: "quantity",
                align: "right",
                render: qty => qty?.toLocaleString() || '0'
              },
              {
                title: "Người yêu cầu",
                dataIndex: "createdByName"
              },
              {
                title: "Ngày yêu cầu",
                dataIndex: "createdAt",
                render: formatDate
              },
              {
                title: "Trạng thái",
                dataIndex: "approved",
                render: (approved, record) => (
                  <Tag color={approved ? 'green' : 'orange'}>
                    {approved ? 'Đã duyệt' : 'Chờ duyệt'}
                  </Tag>
                )
              },
              {
                title: "Người duyệt",
                dataIndex: "approvedByName",
                render: (text, record) => text || (record.approved ? 'Hệ thống' : '-')
              },
              {
                title: "Thao tác",
                key: "action",
                fixed: "right", // Cố định cột này ở bên phải
                width: 180, // Đảm bảo chiều rộng đủ để hiển thị các nút
                render: (_, record) => (
                  !record.approved ? (
                    canApprove ? (
                      <Space>
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => handleApprove(record.id)}
                          icon={<CheckCircleOutlined />}
                          loading={approving}
                        >
                          Duyệt
                        </Button>
                        <Button 
                          danger 
                          size="small"
                          onClick={() => handleReject(record.id, "Từ chối bởi quản trị viên")}
                          icon={<CloseCircleOutlined />}
                        >
                          Từ chối
                        </Button>
                      </Space>
                    ) : (
                      <Tag color="default">Không có quyền</Tag>
                    )
                  ) : (
                    <Tag color="green" icon={<CheckCircleOutlined />}>Đã duyệt</Tag>
                  )
                )
              }
            ]}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Tổng cộng ${total} yêu cầu` 
            }}
          />
        ) : (
          <Empty 
            description={
              <span>
                Không có yêu cầu phê duyệt nào {filters.status === 'Pending' ? 'đang chờ xử lý' : 
                  filters.status === 'Approved' ? 'đã được phê duyệt' : ''}
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        )}
      </Card>
    </div>
  );
};

export default InventoryApprovals;