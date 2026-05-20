"use client";
import { useState } from "react";

interface Props {
  onClose: () => void;
  onSubmit: (data: { symbol: string; name: string; cost_price: number; shares: number }) => void;
}

export default function AddPositionModal({ onClose, onSubmit }: Props) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [shares, setShares] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !name || !costPrice || !shares) return;
    onSubmit({ symbol, name, cost_price: parseFloat(costPrice), shares: parseInt(shares) });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="animate-fade-in-up card"
        style={{ width: "100%", maxWidth: 420, padding: 0, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 模态框头部 */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>添加持仓</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                输入你的持仓股票，AI 将为你分析
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

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
                股票代码
              </label>
              <input
                className="input"
                placeholder="如 600519"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
                股票名称
              </label>
              <input
                className="input"
                placeholder="如 贵州茅台"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>
                买入成本价
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="1800.00"
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
                placeholder="100"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              取消
            </button>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
