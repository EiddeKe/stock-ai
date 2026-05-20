"use client";
import { useState } from "react";

interface Props {
  position: { id: number; name: string; symbol: string; cost_price: number; shares: number };
  onClose: () => void;
  onSubmit: (id: number, data: { name: string; cost_price: number; shares: number }) => void;
}

export default function EditPositionModal({ position: p, onClose, onSubmit }: Props) {
  const [name, setName] = useState(p.name);
  const [costPrice, setCostPrice] = useState(String(p.cost_price));
  const [shares, setShares] = useState(String(p.shares));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costPrice || !shares) return;
    onSubmit(p.id, { name, cost_price: parseFloat(costPrice), shares: parseInt(shares) });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="animate-fade-in-up card"
        style={{ width: "100%", maxWidth: 420, padding: 0, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>修改持仓 — {p.name}</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                调整成本价和持股数量后，盈亏将自动重新计算
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
              股票名称
            </label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
              股票代码 <span style={{ opacity: 0.5 }}>（不可修改）</span>
            </label>
            <input className="input" value={p.symbol} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
                成本价
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
                持股数量
              </label>
              <input
                className="input"
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
