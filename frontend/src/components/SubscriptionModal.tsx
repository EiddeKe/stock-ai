"use client";
import { useState } from "react";
import { subscriptionApi } from "@/lib/api";

interface Props {
  planCode: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  price: number;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "confirm" | "paying" | "done";

export default function SubscriptionModal({ planCode, planName, billingCycle, price, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [error, setError] = useState("");

  const handlePay = async () => {
    setError("");
    setStep("paying");
    try {
      await subscriptionApi.activateSubscription(planCode, billingCycle);
      setStep("done");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setStep("confirm");
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "calc(100% - 32px)", maxWidth: 400, borderRadius: 16, padding: "32px 28px", background: "var(--bg-secondary)", border: "1px solid var(--border)", boxShadow: "0 16px 64px rgba(0,0,0,0.4)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {step === "confirm" && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>
              <span className="gradient-text">确认支付</span>
            </h2>
            <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>套餐</span>
                <span style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600 }}>{planName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>周期</span>
                <span style={{ color: "var(--text-primary)", fontSize: 14 }}>{billingCycle === "monthly" ? "月付" : "年付"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>金额</span>
                <span style={{ color: "var(--accent)", fontSize: 18, fontWeight: 700 }}>¥{price}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>支付方式</span>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>微信支付（MVP 模拟支付）</span>
              </div>
            </div>
            {error && (
              <div style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 8, fontSize: 13, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--up)" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn" onClick={onClose} style={{ flex: 1, padding: "12px 0" }}>取消</button>
              <button className="btn btn-primary" onClick={handlePay} style={{ flex: 1, padding: "12px 0" }}>确认支付</button>
            </div>
          </>
        )}

        {step === "paying" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>处理中...</p>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34, 197, 94, 0.1)", border: "2px solid rgba(34, 197, 94, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, color: "#22c55e" }}>✓</div>
            <p style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}>订阅成功！</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>正在跳转...</p>
          </div>
        )}
      </div>
    </div>
  );
}
