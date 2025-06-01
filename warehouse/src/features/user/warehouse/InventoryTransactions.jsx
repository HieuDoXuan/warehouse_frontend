import React, { useEffect, useState } from "react";
import { Table, Card, Tag, message, Select, DatePicker, Button, Space, Input, Row, Col, Statistic, Divider, Typography, Tooltip } from "antd";
import { FileExcelOutlined, SearchOutlined, ReloadOutlined, BarChartOutlined, ImportOutlined, ExportOutlined, InfoCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import "./warehouse.css";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

const InventoryTransactions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [units, setUnits] = useState([]);
  const [stats, setStats] = useState({
    totalImport: 0,
    totalExport: 0,
    totalTransactions: 0
  });
  
  // Các state cho bộ lọc
  const [filters, setFilters] = useState({
    type: null,
    productId: null,
    warehouseId: null,
    dateRange: null,
    keyword: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
    fetchProducts();
    fetchWarehouses();
    fetchUnits();
  }, []);

  // Sau khi lấy dữ liệu, tính toán thống kê
  useEffect(() => {
    calculateStats();
  }, [data]);

  const calculateStats = () => {
    const importTrans = data.filter(t => t.transactionType === 'Import').reduce((sum, t) => sum + t.quantity, 0);
    const exportTrans = data.filter(t => t.transactionType === 'Export').reduce((sum, t) => sum + t.quantity, 0);
    
    setStats({
      totalImport: importTrans,
      totalExport: exportTrans,
      totalTransactions: data.length
    });
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Xây dựng query params từ filters
      const params = new URLSearchParams();
      
      if (filters.productId) params.append("productId", filters.productId);
      if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);
      if (filters.type) params.append("transactionType", filters.type);
      
      if (filters.keyword) params.append("referenceCode", filters.keyword);
      
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.append("startDate", filters.dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", filters.dateRange[1].format("YYYY-MM-DD"));
      }

      const res = await axios.get(`https://localhost:7193/InventoryTransaction/list?${params.toString()}`);
      setData(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu giao dịch kho:", err);
      message.error("Không thể tải lịch sử giao dịch kho");
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

  const fetchUnits = async () => {
    try {
      const res = await axios.get("https://localhost:7193/Unit/list");
      setUnits(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách đơn vị tính:", err);
    }
  };

  const handleSearch = () => {
    fetchTransactions();
  };

  const handleReset = () => {
    setFilters({
      type: null,
      productId: null,
      warehouseId: null,
      dateRange: null,
      keyword: ""
    });
    setTimeout(() => {
      fetchTransactions();
    }, 0);
  };

  const handleExportExcel = async () => {
    try {
      window.open(`https://localhost:7193/InventoryTransaction/export-excel`, '_blank');
    } catch (err) {
      message.error("Không thể xuất dữ liệu!");
      console.error("Lỗi xuất Excel:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return dayjs(dateString).format("DD/MM/YYYY HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="inventory-transactions-container">
      <Title level={2} style={{ marginBottom: 24 }}>Quản lý giao dịch kho</Title>
      
      {/* Thống kê tổng quan */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng nhập kho"
              value={stats.totalImport}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ImportOutlined />}
              suffix="sản phẩm"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng xuất kho"
              value={stats.totalExport}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExportOutlined />}
              suffix="sản phẩm"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số giao dịch"
              value={stats.totalTransactions}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BarChartOutlined />}
              suffix="giao dịch"
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <span>
            Lịch sử giao dịch kho
            <Tooltip title="Hiển thị danh sách các giao dịch nhập/xuất kho">
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </span>
        }
        className="warehouse-card"
        extra={
          <Space>
            <Button 
              icon={<CheckCircleOutlined />} 
              onClick={() => navigate('/inventory-approvals')}
            >
              Phê duyệt
            </Button>
            <Button 
              type="primary" 
              icon={<FileExcelOutlined />} 
              onClick={handleExportExcel}
            >
              Xuất Excel
            </Button>
          </Space>
        }
      >
        {/* Bộ lọc */}
        <div className="filter-container" style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: '16px' }}>
          <Title level={5} style={{ marginBottom: 16 }}>Bộ lọc tìm kiếm</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6} lg={6}>
              <div className="filter-label">Mã phiếu / Mô tả</div>
              <Input
                placeholder="Nhập để tìm kiếm..."
                value={filters.keyword}
                onChange={e => setFilters({...filters, keyword: e.target.value})}
                allowClear
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6}>
              <div className="filter-label">Loại giao dịch</div>
              <Select
                placeholder="Chọn loại giao dịch"
                style={{ width: '100%' }}
                allowClear
                value={filters.type}
                onChange={value => setFilters({...filters, type: value})}
              >
                <Option value="Import">Nhập kho</Option>
                <Option value="Export">Xuất kho</Option>
                <Option value="RequestExport">Yêu cầu xuất kho</Option>
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
            <Col xs={24} sm={12} md={12} lg={12}>
              <div className="filter-label">Khoảng thời gian</div>
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                value={filters.dateRange}
                onChange={(dates) => setFilters({...filters, dateRange: dates})}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={12}>
              <div className="filter-label">&nbsp;</div>
              <div className="filter-buttons">
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  Tìm kiếm
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ marginLeft: 8 }}>
                  Làm mới
                </Button>
              </div>
            </Col>
          </Row>
        </div>
        
        <Divider style={{ marginTop: 0 }} />
        
        {/* Bảng dữ liệu */}
        <Table
          loading={loading}
          dataSource={data}
          rowKey="id"
          columns={[
            { 
              title: "Mã GD", 
              dataIndex: "id",
              width: 80,
              sorter: (a, b) => a.id - b.id
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
              title: "Loại giao dịch", 
              dataIndex: "transactionType", 
              render: type => {
                const types = {
                  'Import': { text: 'Nhập kho', color: 'green' },
                  'Export': { text: 'Xuất kho', color: 'red' },
                  'RequestExport': { text: 'Yêu cầu xuất', color: 'orange' }
                };
                const config = types[type] || { text: type, color: 'blue' };
                return <Tag color={config.color}>{config.text}</Tag>;
              },
              filters: [
                { text: 'Nhập kho', value: 'Import' },
                { text: 'Xuất kho', value: 'Export' },
                { text: 'Yêu cầu xuất', value: 'RequestExport' }
              ],
              onFilter: (value, record) => record.transactionType === value
            },
            { 
              title: "Số lượng", 
              dataIndex: "quantity",
              align: "right",
              render: qty => qty?.toLocaleString() || '0',
              sorter: (a, b) => a.quantity - b.quantity
            },
            { 
              title: "Đơn vị", 
              dataIndex: "unitId",
              render: unitId => {
                const unit = units.find(u => u.id === unitId);
                return unit ? unit.unitName : `ID: ${unitId}`;
              }
            },
            { 
              title: "Đơn giá", 
              dataIndex: "price", 
              align: "right",
              render: price => price ? price.toLocaleString('vi-VN') + ' đ' : '',
              sorter: (a, b) => (a.price || 0) - (b.price || 0)
            },
            { 
              title: "Mã phiếu", 
              dataIndex: "referenceCode" 
            },
            { 
              title: "Mô tả", 
              dataIndex: "description",
              ellipsis: true
            },
            { 
              title: "Ngày tạo", 
              dataIndex: "createdAt", 
              render: formatDate,
              sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
            },
            { 
              title: "Trạng thái", 
              dataIndex: "approvalStatus", 
              render: status => {
                if (!status) return null;
                const statusMap = {
                  'Pending': { color: 'orange', text: 'Chờ duyệt' },
                  'Approved': { color: 'green', text: 'Đã duyệt' },
                  'Rejected': { color: 'red', text: 'Đã từ chối' }
                };
                const config = statusMap[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
              }
            }
          ]}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Tổng cộng ${total} giao dịch` 
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default InventoryTransactions;