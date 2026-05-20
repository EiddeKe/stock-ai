"use client";
import { useState, useEffect } from "react";
import { getInvestmentStyle, setInvestmentStyle } from "@/lib/api";

interface Props {
  onDone: () => void;
}

export default function InvestmentStyleModal({ onDone }: Props) {
  const [selected, setSelected] = useState<"short_term" | "long_term" | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    getInvestmentStyle().then((style) => {
      if (style) {
        onDone();
      } else {
        setShow(true);
      }
    }).catch(() => onDone());
  }, [onDone]);

  if (!show) return null;

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await setInvestmentStyle(selected);
      setShow(false);
      onDone();
    } catch {
      alert("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="animate-fade-in" style={{
        width: "calc(100% - 32px)", maxWidth: 480, borderRadius: 16, padding: "32px 28px",
        background: "var(--bg-secondary)", border: "1px solid var(--border)",
        boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          <span className="gradient-text">选择你的投资风格</span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
          AI 将根据你的投资风格提供更有针对性的建议
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setSelected("short_term")}
            style={{
              padding: 20, borderRadius: 12, cursor: "pointer", textAlign: "center",
              background: selected === "short_term" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
              border: selected === "short_term" ? "2px solid var(--accent)" : "1px solid var(--border)",
              color: "var(--text-primary)", transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>短线</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              关注短期波动<br />技术指标买卖点<br />日内/周内操作
            </div>
          </button>
          <button
            onClick={() => setSelected("long_term")}
            style={{
              padding: 20, borderRadius: 12, cursor: "pointer", textAlign: "center",
              background: selected === "long_term" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
              border: selected === "long_term" ? "2px solid var(--accent)" : "1px solid var(--border)",
              color: "var(--text-primary)", transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏔️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>长线</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              关注公司基本面<br />行业趋势与估值<br />长期持有策略
            </div>
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!selected || loading}
          style={{ width: "100%", padding: "12px 0", fontSize: 15 }}
        >
          {loading ? "保存中..." : "确认"}
        </button>
      </div>
    </div>
  );
}
