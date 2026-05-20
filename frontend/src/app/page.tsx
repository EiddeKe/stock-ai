"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getToken, getEnvInfo } from "@/lib/api";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [envInfo, setEnvInfo] = useState<{ env: string; database_type: string; is_prod: boolean } | null>(null);

  useEffect(() => {
    getEnvInfo().then(setEnvInfo);
  }, []);

  const handleCardClick = (path: string) => {
    if (getToken()) {
      router.push(path);
    } else {
      setShowLogin(true);
    }
  };

  const handleLogin = () => {
    setShowLogin(false);
    router.push("/stock-analysis");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* 顶部导航 — 未登录时按钮灰化 */}
      <header className="glass" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
            }}>
              A
            </div>
            <h1 style={{ fontSize: 16, fontWeight: 700 }}>
              <span className="gradient-text">StockAI</span>
              <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>交易指导助手</span>
            </h1>
          </div>

          {/* 环境标识 — 仅非生产时显示 */}
          {envInfo && !envInfo.is_prod && (
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
              background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#f59e0b",
            }}>
              ⚠ {envInfo.env.toUpperCase()} / {envInfo.database_type}
            </span>
          )}
          {envInfo && envInfo.is_prod && (
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
              background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e",
            }}>
              ● 生产环境 / {envInfo.database_type}
            </span>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        {/* 欢迎标题 */}
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            <span className="gradient-text">AI 驱动 · 智能交易</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 500, margin: "0 auto" }}>
            基于 AI 大模型分析，结合技术指标与市场数据，为你提供专业的 A 股交易建议
          </p>
        </div>

        {/* 功能入口 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {/* 持仓分析 */}
          <div
            className="card animate-fade-in-up"
            style={{ cursor: "pointer", padding: 32, transition: "transform 0.2s, box-shadow 0.2s" }}
            onClick={() => handleCardClick("/stock-analysis")}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99, 102, 241, 0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>持仓分析</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              添加你的持仓股票，AI 将实时获取行情数据并结合技术指标分析，给出操作建议
            </p>
            <div style={{ marginTop: 20, fontSize: 13, color: "var(--accent)" }}>
              → 进入持仓分析
            </div>
          </div>

          {/* 热门推荐 */}
          <div
            className="card animate-fade-in-up"
            style={{ cursor: "pointer", padding: 32, transition: "transform 0.2s, box-shadow 0.2s", animationDelay: "0.1s" }}
            onClick={() => handleCardClick("/stock-analysis?tab=recommendations")}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(16, 185, 129, 0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔥</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>热门推荐</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              基于实时行业数据，推荐成长潜力大、稳定性高的行业和个股，附详细分析理由
            </p>
            <div style={{ marginTop: 20, fontSize: 13, color: "var(--success)" }}>
              → 浏览热门推荐
            </div>
          </div>
        </div>
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}

      {/* 底部免责声明 */}
      <footer style={{
        padding: "16px 20px", borderTop: "1px solid var(--border)",
        background: "rgba(0,0,0,0.2)", textAlign: "center",
      }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          ⚠ 免责声明：本平台仅提供信息分析服务，AI 生成内容仅供参考，不构成任何投资建议。
          平台不提供任何股票交易操作功能。用户应独立判断，平台不对投资盈亏承担责任。
          <a href="/terms" target="_blank" style={{ color: "var(--accent)", textDecoration: "none" }}> 用户协议</a>
          <a href="/privacy" target="_blank" style={{ color: "var(--accent)", textDecoration: "none", marginLeft: 8 }}> 隐私政策</a>
        </p>
      </footer>
    </div>
  );
}
