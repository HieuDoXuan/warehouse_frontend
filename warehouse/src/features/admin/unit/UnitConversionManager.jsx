import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../../../components/common/Button/Button.tsx";
import { Table } from "../../../components/common/Table/Table.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./UnitConversionManager.module.scss";

const API_UNIT_CONVERSION = "https://localhost:7193/UnitConversion";
const API_UNIT = "https://localhost:7193/Unit/list";

const initialForm = {
  fromUnitId: "",
  toUnitId: "",
  conversionRate: "",
  description: "",
};

const UnitConversionManager = () => {
  const [conversions, setConversions] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách đơn vị và quy đổi
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const [unitRes, convRes] = await Promise.all([
        axios.get(API_UNIT, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_UNIT_CONVERSION}/list`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUnits(unitRes.data);
      setConversions(convRes.data);
    } catch (err) {
      toast.error("Không thể tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Thêm hoặc cập nhật quy đổi
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      if (editingId) {
        await axios.put(`${API_UNIT_CONVERSION}/update/${editingId}`, {
          ...form,
          updatedBy: JSON.parse(localStorage.getItem("currentUser") || "{}").id || null,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Cập nhật quy đổi thành công!");
      } else {
        await axios.post(`${API_UNIT_CONVERSION}/add`, {
          ...form,
          createdBy: JSON.parse(localStorage.getItem("currentUser") || "{}").id || null,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Thêm quy đổi thành công!");
      }
      setForm(initialForm);
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  // Sửa quy đổi
  const handleEdit = (conv) => {
    setForm({
      fromUnitId: conv.fromUnitId,
      toUnitId: conv.toUnitId,
      conversionRate: conv.conversionRate,
      description: conv.description || "",
    });
    setEditingId(conv.id);
  };

  // Xoá quy đổi
  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xoá quy đổi này?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const updatedBy = JSON.parse(localStorage.getItem("currentUser") || "{}").id || null;
      await axios.delete(`${API_UNIT_CONVERSION}/delete/${id}`, {
        params: { updatedBy },
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Đã xoá quy đổi!");
      fetchData();
    } catch (err) {
      toast.error("Lỗi khi xoá!");
    }
  };

  // Helper lấy tên đơn vị từ id
  const getUnitName = (id) => {
    const u = units.find(x => x.id === id);
    return u ? `${u.unitName} (${u.unitCode})` : id;
  };

  const columns = [
    { key: "fromUnitId", title: "Đơn vị gốc", render: v => getUnitName(v) },
    { key: "toUnitId", title: "Đơn vị quy đổi", render: v => getUnitName(v) },
    { key: "conversionRate", title: "Tỷ lệ quy đổi" },
    { key: "description", title: "Ghi chú", render: v => v || "—" },
    {
      key: "actions",
      title: "Thao tác",
      render: (v, row) => (
        <div className={styles.actionButtons}>
          <Button size="small" variant="info" onClick={() => handleEdit(row)}>Sửa</Button>
          <Button size="small" variant="danger" onClick={() => handleDelete(row.id)}>Xoá</Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.unitConversionManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h1>Quản lý đơn vị chuyển đổi</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Đơn vị gốc</label>
          <select
            value={form.fromUnitId}
            onChange={e => setForm(f => ({ ...f, fromUnitId: Number(e.target.value) }))}
            required
          >
            <option value="">-- Chọn --</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.unitName} ({u.unitCode})</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Đơn vị quy đổi</label>
          <select
            value={form.toUnitId}
            onChange={e => setForm(f => ({ ...f, toUnitId: Number(e.target.value) }))}
            required
          >
            <option value="">-- Chọn --</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.unitName} ({u.unitCode})</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Tỷ lệ quy đổi</label>
          <input
            type="number"
            min="0.0001"
            step="any"
            value={form.conversionRate}
            onChange={e => setForm(f => ({ ...f, conversionRate: e.target.value }))}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Ghi chú</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={255}
          />
        </div>
        <div className={styles.formActions}>
          <Button type="submit" variant="primary">{editingId ? "Cập nhật" : "Thêm mới"}</Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={() => { setForm(initialForm); setEditingId(null); }}>
              Huỷ
            </Button>
          )}
        </div>
      </form>
      <Table
        data={conversions}
        columns={columns}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
};

export default UnitConversionManager;