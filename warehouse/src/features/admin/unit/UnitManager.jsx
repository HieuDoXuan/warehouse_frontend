import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../../../components/common/Button/Button.tsx";
import { Table } from "../../../components/common/Table/Table.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./UnitManager.module.scss";

const API_UNIT = "https://localhost:7193/Unit";

const initialForm = {
  unitCode: "",
  unitName: "",
  description: "",
};

const UnitManager = () => {
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách đơn vị tính
  const fetchUnits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_UNIT}/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnits(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách đơn vị!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Thêm hoặc cập nhật đơn vị
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      if (editingId) {
        await axios.put(`${API_UNIT}/update/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Cập nhật đơn vị thành công!");
      } else {
        await axios.post(`${API_UNIT}/add`, {
          ...form,
          createdBy: JSON.parse(localStorage.getItem("currentUser") || "{}").id || null,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Thêm đơn vị thành công!");
      }
      setForm(initialForm);
      setEditingId(null);
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác!");
    }
  };

  // Sửa đơn vị
  const handleEdit = (unit) => {
    setForm({
      unitCode: unit.unitCode,
      unitName: unit.unitName,
      description: unit.description || "",
    });
    setEditingId(unit.id);
  };

  // Xoá mềm
  const handleSoftDelete = async (id) => {
    if (!window.confirm("Xác nhận xoá mềm đơn vị này?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_UNIT}/soft-delete/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Đã xoá mềm đơn vị!");
      fetchUnits();
    } catch (err) {
      toast.error("Lỗi khi xoá mềm!");
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_UNIT}/reactivate/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Kích hoạt lại thành công!");
      fetchUnits();
    } catch (err) {
      toast.error("Lỗi khi kích hoạt lại!");
    }
  };

  // Xoá cứng
  const handleHardDelete = async (id) => {
    if (!window.confirm("Xác nhận xoá hẳn đơn vị này?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_UNIT}/hard-delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Đã xoá đơn vị khỏi hệ thống!");
      fetchUnits();
    } catch (err) {
      toast.error("Lỗi khi xoá cứng!");
    }
  };

  const columns = [
    { key: "unitCode", title: "Mã đơn vị" },
    { key: "unitName", title: "Tên đơn vị" },
    { key: "description", title: "Mô tả", render: v => v || "—" },
    { key: "status", title: "Trạng thái", render: v => v === "Active" ? <span className={styles.active}>Hoạt động</span> : <span className={styles.inactive}>Ngừng</span> },
    {
      key: "actions",
      title: "Thao tác",
      render: (v, row) => (
        <div className={styles.actionButtons}>
          <Button size="small" variant="info" onClick={() => handleEdit(row)}>Sửa</Button>
          {row.status === "Active" ? (
            <Button size="small" variant="danger" onClick={() => handleSoftDelete(row.id)}>Xoá mềm</Button>
          ) : (
            <Button size="small" variant="success" onClick={() => handleReactivate(row.id)}>Kích hoạt</Button>
          )}
          <Button size="small" variant="danger" onClick={() => handleHardDelete(row.id)}>Xoá cứng</Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.unitManager}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h1>Quản lý đơn vị tính</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Mã đơn vị</label>
          <input
            type="text"
            value={form.unitCode}
            onChange={e => setForm(f => ({ ...f, unitCode: e.target.value.toUpperCase() }))}
            required
            maxLength={20}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Tên đơn vị</label>
          <input
            type="text"
            value={form.unitName}
            onChange={e => setForm(f => ({ ...f, unitName: e.target.value }))}
            required
            maxLength={100}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Mô tả</label>
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
        data={units}
        columns={columns}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
};

export default UnitManager;