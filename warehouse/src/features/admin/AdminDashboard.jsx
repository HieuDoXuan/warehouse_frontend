import React, { useState, useEffect } from 'react';
import 'antd/dist/reset.css';
import styles from './AdminDashboard.module.scss';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Table } from 'antd';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    lowStockItems: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
    fetchInventoryData();
  }, []);

  const fetchStats = async () => {
    setStats({
      totalProducts: 1250,
      totalCategories: 25,
      totalOrders: 450,
      lowStockItems: 15
    });
  };

  const fetchRecentActivities = async () => {
    setRecentActivities([
      { date: '2025-05-27', type: 'import', quantity: 100 },
      { date: '2025-05-26', type: 'export', quantity: 50 },
    ]);
  };

  const fetchInventoryData = async () => {
    setInventoryData([
      { month: 'Jan', imports: 400, exports: 240 },
      { month: 'Feb', imports: 300, exports: 139 },
      { month: 'Mar', imports: 200, exports: 980 },
      { month: 'Apr', imports: 278, exports: 390 },
      { month: 'May', imports: 189, exports: 480 },
    ]);
  };

  const activityColumns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <span className={type === 'import' ? styles.importTag : styles.exportTag}>
          {type === 'import' ? 'Nhập kho' : 'Xuất kho'}
        </span>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
  ];

  return (
    <div className={styles.dashboardContent}>
      <h1 className={styles.dashboardTitle}>Bảng Điều Khiển Quản Trị Viên</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-box"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Tổng Sản Phẩm</h3>
            <p>{stats.totalProducts.toLocaleString()}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-tags"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Danh Mục</h3>
            <p>{stats.totalCategories}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Đơn Hàng</h3>
            <p>{stats.totalOrders.toLocaleString()}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Sắp Hết Hàng</h3>
            <p>{stats.lowStockItems}</p>
          </div>
        </div>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.chartSection}>
          <div className={styles.chartCard}>
            <h2>Biểu Đồ Xuất Nhập Kho</h2>
            <div className={styles.chartContent}>
              <LineChart width={800} height={300} data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="imports" stroke="#8884d8" name="Nhập kho" />
                <Line type="monotone" dataKey="exports" stroke="#82ca9d" name="Xuất kho" />
              </LineChart>
            </div>
          </div>
        </div>
        <div className={styles.activitySection}>
          <div className={styles.activityCard}>
            <h2>Hoạt Động Gần Đây</h2>
            <Table 
              columns={activityColumns}
              dataSource={recentActivities}
              pagination={{ pageSize: 5 }}
              className={styles.activityTable}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;