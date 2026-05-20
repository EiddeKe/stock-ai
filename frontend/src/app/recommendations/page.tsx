"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import UserMenu from "@/components/UserMenu";

interface StockRecommendation {
  symbol: string;
  name: string;
  current_price: number;
  change_pct: number;
  recommend_reason: string;
  risk_tip: string;
}

interface SectorRecommendation {
  sector_name: string;
  sector_change_pct: number;
  recommend_reason: string;
  growth_potential: string;
  policy_support: string;
  risk_warning: string;
  recommend_score: number;
  stock_recommendations: StockRecommendation[];
}

type ModelType = "qwen" | "deepseek";

const MODEL_CONFIG: Record<ModelType, { label: string; icon: string }> = {
  qwen: { label: "千问推荐", icon: "✦" },
  deepseek: { label: "DeepSeek推荐", icon: "◆" },
};

export default function RecommendationsPage() {
  const router = useRouter();
  const [sectors, setSectors] = useState<SectorRecommendation[]>([]);
  const [qwenSectors, setQwenSectors] = useState<SectorRecommendation[]>([]);
  const [deepseekSectors, setDeepseekSectors] = useState<SectorRecommendation[]>([]);
  const [activeModel, setActiveModel] = useState<ModelType>("qwen");
  const [loading, setLoading] = useState(false);
  const [deepseekLoading, setDeepseekLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  const fetchRecommendations = useCallback(async (model: ModelType, isSwitch = false) => {
    if (!isSwitch) {
      setLoading(true);
    } else {
      setDeepseekLoading(true);
    }
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/recommendations?model=${model}`);
      if (!res.ok) throw new Error("获取推荐数据失败");
      const json = await res.json();
      if (model === "qwen") {
        setQwenSectors(json.data || []);
      } else {
        setDeepseekSectors(json.data || []);
      }
      setSectors(model === "qwen" ? (json.data || []) : deepseekSectors);
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (!isSwitch) {
        setLoading(false);
      } else {
        setDeepseekLoading(false);
      }
      setPageLoaded(true);
    }
  }, [deepseekSectors]);

  // 页面加载时自动获取千问推荐
  useEffect(() => {
    fetchRecommendations("qwen");
  }, [fetchRecommendations]);

  const handleModelSwitch = (model: ModelType) => {
    setActiveModel(model);
    setExpandedSector(null);

    if (model === "qwen") {
      setSectors(qwenSectors);
    } else {
      // DeepSeek：按需加载
      if (deepseekSectors.length > 0) {
        setSectors(deepseekSectors);
      } else {
        fetchRecommendations("deepseek", true);
      }
    }
  };

  // 确保切换模型后数据同步
  useEffect(() => {
    if (activeModel === "qwen") {
      setSectors(qwenSectors);
    } else if (activeModel === "deepseek" && deepseekSectors.length > 0) {
      setSectors(deepseekSectors);
    }
  }, [activeModel, qwenSectors, deepseekSectors]);

  const isLoading = activeModel === "deepseek" ? deepseekLoading : loading;
  const currentSectors = activeModel === "qwen" ? qwenSectors : deepseekSectors;

  return (
    <AuthGuard>
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* 顶部导航 */}
      <header className="glass" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
            }}>
              A
            </div>
            <h1
              style={{ fontSize: 16, fontWeight: 700, cursor: "pointer" }}
              onClick={() => router.push("/")}
            >
              <span className="gradient-text">StockAI</span>
              <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>交易指导助手</span>
            </h1>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            <a
              href="/stock-analysis"
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: "transparent", color: "var(--text-secondary)", textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              📊 持仓分析
            </a>
            <a
              href="/recommendations"
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: "var(--success)", color: "#fff", textDecoration: "none",
              }}
            >
              🔥 热门推荐
            </a>
          </nav>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <UserMenu />
            {/* 模型切换 Tab */}
            <div style={{
              display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3,
              border: "1px solid var(--border)",
            }}>
              {(["qwen", "deepseek"] as ModelType[]).map((model) => {
                const cfg = MODEL_CONFIG[model];
                const isActive = activeModel === model;
                const isLoading = model === "deepseek" && deepseekLoading;
                return (
                  <button
                    key={model}
                    onClick={() => handleModelSwitch(model)}
                    style={{
                      padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.2s",
                      background: isActive ? "var(--accent)" : "transparent",
                      color: isActive ? "#fff" : "var(--text-secondary)",
                      border: isActive ? "none" : "1px solid transparent",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? (
                      <><span className="loading-spinner" style={{ marginRight: 4 }} /> 分析中</>
                    ) : (
                      <>{cfg.icon} {cfg.label}</>
                    )}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-outline" onClick={() => fetchRecommendations(activeModel, activeModel === "deepseek")} disabled={loading}>
              ⟳ 刷新
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        {/* 页面标题 */}
        <div className="animate-fade-in" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            🔥 <span className="gradient-text">热门推荐</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)", marginLeft: 12 }}>
              — {MODEL_CONFIG[activeModel].label}
            </span>
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            基于实时行业数据和 AI 分析，推荐成长潜力大、稳定性高的行业和个股
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="animate-fade-in" style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--up)", fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* 加载状态 */}
        {isLoading ? (
          <div style={{ display: "grid", gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: 24, height: 180 }}>
                <div className="skeleton" style={{ width: 120, height: 20, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: "80%", height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: "40%", height: 14 }} />
              </div>
            ))}
          </div>
        ) : currentSectors.length === 0 ? (
          <div className="animate-fade-in" style={{
            textAlign: "center", padding: "80px 20px",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔥</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
              暂无推荐数据
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
              请确保在交易时间段内使用，或在非交易时间刷新获取最新数据
            </p>
            <button className="btn btn-primary" onClick={() => fetchRecommendations(activeModel, activeModel === "deepseek")}>
              重新获取
            </button>
          </div>
        ) : (
          /* 行业推荐卡片 */
          <div style={{ display: "grid", gap: 20 }}>
            {currentSectors.map((sector, i) => (
              <div
                key={i}
                className="card animate-fade-in-up"
                style={{ padding: 24, animationDelay: `${i * 0.08}s` }}
              >
                {/* 行业头部 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{sector.sector_name}</h3>
                    <span
                      style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                        background: sector.sector_change_pct >= 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                        color: sector.sector_change_pct >= 0 ? "var(--up)" : "var(--down)",
                        border: `1px solid ${sector.sector_change_pct >= 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                      }}
                    >
                      {sector.sector_change_pct >= 0 ? "+" : ""}{sector.sector_change_pct}%
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>推荐指数</span>
                    <span
                      style={{
                        fontSize: 14, fontWeight: 700,
                        color: sector.recommend_score >= 70 ? "var(--up)" : sector.recommend_score >= 50 ? "#f59e0b" : "var(--down)",
                      }}
                    >
                      {sector.recommend_score}
                    </span>
                  </div>
                </div>

                {/* 推荐理由 */}
                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                  <InfoBlock label="推荐理由" value={sector.recommend_reason} color="var(--text-primary)" />
                  <InfoBlock label="成长潜力" value={sector.growth_potential} color="var(--accent)" />
                  <InfoBlock label="政策环境" value={sector.policy_support} color="#10b981" />
                </div>

                {/* 风险提示 */}
                <div style={{
                  padding: "10px 14px", borderRadius: 8, fontSize: 13,
                  background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)",
                  color: "#f59e0b", marginBottom: 16,
                }}>
                  ⚠ {sector.risk_warning}
                </div>

                {/* 展开/收起个股 */}
                {sector.stock_recommendations && sector.stock_recommendations.length > 0 && (
                  <>
                    <button
                      onClick={() => setExpandedSector(expandedSector === sector.sector_name ? null : sector.sector_name)}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                        borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
                        color: "var(--text-secondary)", width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <span>📋 推荐个股 ({sector.stock_recommendations.length}只)</span>
                      <span style={{ transform: expandedSector === sector.sector_name ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>
                        ▼
                      </span>
                    </button>

                    {expandedSector === sector.sector_name && (
                      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                        {sector.stock_recommendations.map((stock, j) => (
                          <div
                            key={j}
                            style={{
                              padding: "12px 16px", borderRadius: 8,
                              background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{stock.name}</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{stock.symbol}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>¥{stock.current_price}</span>
                                <span
                                  style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: stock.change_pct >= 0 ? "var(--up)" : "var(--down)",
                                  }}
                                >
                                  {stock.change_pct >= 0 ? "+" : ""}{stock.change_pct}%
                                </span>
                              </div>
                            </div>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.5 }}>
                              {stock.recommend_reason}
                            </p>
                            <p style={{ fontSize: 12, color: "#f59e0b" }}>
                              风险：{stock.risk_tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}

function InfoBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      <p style={{ fontSize: 13.5, color, lineHeight: 1.6, margin: "4px 0 0 0" }}>{value}</p>
    </div>
  );
}
