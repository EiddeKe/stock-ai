"use client";
import { useState, useEffect } from "react";
import { fetchMe, agreeTermsApi } from "@/lib/api";

interface Props {
  onAgreed: () => void;
}

export default function TermsAgreementModal({ onAgreed }: Props) {
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetchMe().then((me) => {
      if (!me.agreed_terms_at) {
        setShow(true);
      } else {
        onAgreed();
      }
    }).catch(() => onAgreed());
  }, [onAgreed]);

  if (!show) return null;

  const handleConfirm = async () => {
    if (!agree) return;
    setLoading(true);
    try {
      await agreeTermsApi();
      setShow(false);
      onAgreed();
    } catch {
      alert("记录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="animate-fade-in" style={{
        width: "calc(100% - 32px)", maxWidth: 480, borderRadius: 16, padding: "32px 28px",
        background: "var(--bg-secondary)", border: "1px solid var(--border)",
        boxShadow: "0 16px 64px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
          <span className="gradient-text">服务协议与隐私政策</span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
          为保护您的权益，请阅读以下协议并确认
        </p>

        {/* 摘要 */}
        <div style={{
          padding: 16, borderRadius: 10, fontSize: 13, lineHeight: 1.7,
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", marginBottom: 20,
        }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>核心提示：</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>本平台仅提供 AI 分析参考，<strong style={{ color: "var(--up)" }}>不构成任何投资建议</strong></li>
            <li>平台不提供任何股票交易操作功能</li>
            <li>AI 生成内容需用户自行甄别，平台不对投资盈亏承担责任</li>
            <li>您的数据可能被发送至第三方 AI 服务（DashScope、Google 等）</li>
          </ul>
        </div>

        {/* 复选框 */}
        <label style={{
          display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13,
          color: "var(--text-secondary)", marginBottom: 24, cursor: "pointer", lineHeight: 1.6,
        }}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ marginTop: 3, accentColor: "var(--accent)", width: 16, height: 16 }}
          />
          <span>
            我已仔细阅读并同意
            <a href="/terms" target="_blank" style={{ color: "var(--accent)", textDecoration: "none", margin: "0 2px" }}>《用户协议》</a>
            （含投资风险提示）和
            <a href="/privacy" target="_blank" style={{ color: "var(--accent)", textDecoration: "none", margin: "0 2px" }}>《隐私政策》</a>
            （含第三方数据传输出告知）
          </span>
        </label>

        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!agree || loading}
          style={{ width: "100%", padding: "12px 0", fontSize: 15 }}
        >
          {loading ? "记录中..." : "同意并继续"}
        </button>
      </div>
    </div>
  );
}
