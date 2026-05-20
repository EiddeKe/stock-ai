"use client";
import { useState, useEffect, useCallback } from "react";
import { adminApi, AdminPlan, PlanInput } from "@/lib/api";

export default function PlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<AdminPlan | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", code: "", price_monthly: 0, price_yearly: 0, description: "", features: "", ai_calls_per_day: 0, max_models: 1, priority: 0, is_active: true });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listPlans();
      setPlans(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditPlan(null);
    setForm({ name: "", code: "", price_monthly: 0, price_yearly: 0, description: "", features: "", ai_calls_per_day: 0, max_models: 1, priority: 0, is_active: true });
    setShowModal(true);
  };

  const openEdit = (p: AdminPlan) => {
    setEditPlan(p);
    setForm({ name: p.name, code: p.code, price_monthly: p.price_monthly, price_yearly: p.price_yearly, description: p.description || "", features: p.features.join("\n"), ai_calls_per_day: p.ai_calls_per_day, max_models: p.max_models, priority: p.priority, is_active: p.is_active });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) { setError("套餐名称不能为空"); return; }
    if (!editPlan && !form.code.trim()) { setError("Code 不能为空"); return; }
    try {
      const data: PlanInput = {
        ...form,
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      };
      if (editPlan) {
        await adminApi.updatePlan(editPlan.id, data);
      } else {
        await adminApi.createPlan(data);
      }
      setShowModal(false);
      fetchPlans();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggle = async (p: AdminPlan) => {
    try {
      await adminApi.updatePlan(p.id, { is_active: !p.is_active });
      fetchPlans();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>套餐管理</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>管理用户订阅套餐和定价</p>
        </div>
        <button className="btn btn-success" onClick={openCreate}>＋ 新增套餐</button>
      </div>

      {error && <div className="animate-fade-in" style={{ marginBottom: 20, padding: "8px 12px", borderRadius: 8, fontSize: 13, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--up)" }}>{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>加载中...</div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>暂无套餐数据</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {plans.map((p, i) => (
            <div key={p.id} className="card animate-fade-in" style={{ display: "flex", alignItems: "stretch", gap: 20, padding: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{p.name}</h3>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: p.is_active ? "rgba(34, 197, 94, 0.1)" : "rgba(100, 116, 139, 0.1)", color: p.is_active ? "#22c55e" : "var(--text-muted)", border: `1px solid ${p.is_active ? "rgba(34, 197, 94, 0.3)" : "var(--border)"}` }}>{p.is_active ? "已上架" : "已下架"}</span>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "rgba(99, 102, 241, 0.1)", color: "var(--accent)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>{p.code}</span>
                </div>
                <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>月付 <b style={{ color: "var(--accent)" }}>¥{p.price_monthly}</b></span>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>年付 <b style={{ color: "var(--accent)" }}>¥{p.price_yearly}</b></span>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>每日调用 <b style={{ color: p.ai_calls_per_day === -1 ? "#22c55e" : "var(--text-primary)" }}>{p.ai_calls_per_day === -1 ? "无限制" : p.ai_calls_per_day + " 次"}</b></span>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>模型 <b style={{ color: "var(--text-primary)" }}>{p.max_models}</b></span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.features.map((f, j) => (
                    <span key={j} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>✓ {f}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", flexShrink: 0 }}>
                <button onClick={() => openEdit(p)} className="btn btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>编辑</button>
                <button onClick={() => handleToggle(p)} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--border)", background: "transparent", color: p.is_active ? "var(--up)" : "#22c55e" }}>{p.is_active ? "下架" : "上架"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(false)}>
          <div className="card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ width: 480, padding: 32, background: "var(--bg-secondary)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editPlan ? "编辑套餐" : "新增套餐"}</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>名称</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：专业版" /></div>
              {!editPlan && <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Code</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如：pro" /></div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>月付价格（元）</label><input className="input" type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} /></div>
                <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>年付价格（元）</label><input className="input" type="number" value={form.price_yearly} onChange={(e) => setForm({ ...form, price_yearly: Number(e.target.value) })} /></div>
              </div>
              <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>每日调用次数（-1=无限）</label><input className="input" type="number" value={form.ai_calls_per_day} onChange={(e) => setForm({ ...form, ai_calls_per_day: Number(e.target.value) })} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>最大模型数</label><input className="input" type="number" value={form.max_models} onChange={(e) => setForm({ ...form, max_models: Number(e.target.value) })} /></div>
                <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>排序权重</label><input className="input" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
              </div>
              <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>功能特性（每行一个）</label><textarea className="input" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={4} placeholder={"每日 3 次 AI 分析\n1 个 AI 模型\n基础技术指标"} style={{ resize: "vertical", minHeight: 80 }} /></div>
              <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>描述</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="套餐描述" /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} id="isActive" />
                <label htmlFor="isActive" style={{ fontSize: 13, color: "var(--text-secondary)" }}>上架</label>
              </div>
              {error && <span style={{ fontSize: 13, color: "var(--up)" }}>{error}</span>}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleSubmit}>{editPlan ? "保存" : "创建"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
