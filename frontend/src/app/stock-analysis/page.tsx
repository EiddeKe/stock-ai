"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import PositionCard from "@/components/PositionCard";
import AddPositionModal from "@/components/AddPositionModal";
import EditPositionModal from "@/components/EditPositionModal";
import AnalysisPanel from "@/components/AnalysisPanel";
import ChatPanel from "@/components/ChatPanel";
import AuthGuard from "@/components/AuthGuard";
import UserMenu from "@/components/UserMenu";

interface Position {
  id: number;
  symbol: string;
  name: string;
  cost_price: number;
  shares: number;
  buy_date: string;
  current_price?: number;
  profit_pct?: number;
  profit_amount?: number;
  change_pct?: number;
}

interface AnalysisResult {
  symbol: string;
  name: string;
  current_price: number;
  cost_price: number;
  profit_pct: number;
  suggestion: string;
  confidence: number;
  reason: string;
  risk_tip: string;
}

type ModelType = "qwen" | "deepseek";

const MODEL_CONFIG: Record<ModelType, { label: string; icon: string }> = {
  qwen: { label: "千问分析", icon: "✦" },
  deepseek: { label: "DeepSeek分析", icon: "◆" },
};

export default function StockAnalysisPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [qwenAnalyses, setQwenAnalyses] = useState<AnalysisResult[]>([]);
  const [deepseekAnalyses, setDeepseekAnalyses] = useState<AnalysisResult[]>([]);
  const [activeModel, setActiveModel] = useState<ModelType>("qwen");
  const [chatModel, setChatModel] = useState<ModelType>("qwen");
  const [qwenEnableSearch, setQwenEnableSearch] = useState(false);
  const [deepseekEnableSearch, setDeepseekEnableSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deepseekLoading, setDeepseekLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPositionId, setEditPositionId] = useState<number | null>(null);
  const hasLoadedOnce = useRef(false);

  const analyses = activeModel === "qwen" ? qwenAnalyses : deepseekAnalyses;
  const hasDeepseek = deepseekAnalyses.length > 0;

  const fetchPositions = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const data = await api.getPositions();
      setPositions(data);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 页面加载时自动获取持仓数据（首次加载显示骨架屏）
  useEffect(() => {
    fetchPositions(false);
    hasLoadedOnce.current = true;
  }, [fetchPositions]);

  // 每 30 秒静默刷新（不显示骨架屏，只更新数值）
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasLoadedOnce.current) {
        fetchPositions(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  const handleAdd = async (data: { symbol: string; name: string; cost_price: number; shares: number }) => {
    try {
      await api.addPosition(data);
      setShowAddModal(false);
      fetchPositions();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEdit = async (id: number, data: { name: string; cost_price: number; shares: number }) => {
    try {
      await api.updatePosition(id, data);
      setEditPositionId(null);
      // 静默刷新，不清空分析结果
      fetchPositions(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该持仓？")) return;
    try {
      await api.deletePosition(id);
      setQwenAnalyses([]);
      setDeepseekAnalyses([]);
      setActiveModel("qwen");
      fetchPositions();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    try {
      const results = await api.analyzeAll("qwen");
      setQwenAnalyses(results);
      setActiveModel("qwen");
      setDeepseekAnalyses([]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeDeepSeek = async () => {
    if (hasDeepseek) return;
    setDeepseekLoading(true);
    try {
      const results = await api.analyzeAll("deepseek");
      setDeepseekAnalyses(results);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeepseekLoading(false);
    }
  };

  const handleModelSwitch = (model: ModelType) => {
    setActiveModel(model);
    if (model === "deepseek" && !hasDeepseek) {
      handleAnalyzeDeepSeek();
    }
  };

  const editPosition = positions.find((p) => p.id === editPositionId);

  // 汇总统计
  const totalProfit = positions.reduce((s, p) => s + (p.profit_amount ?? 0), 0);
  const totalCost = positions.reduce((s, p) => s + p.cost_price * p.shares, 0);
  const totalValue = positions.reduce((s, p) => s + ((p.current_price ?? p.cost_price) * p.shares), 0);
  const bestStock = positions.length > 0
    ? positions.reduce((a, b) => (a.profit_pct ?? -999) > (b.profit_pct ?? -999) ? a : b)
    : null;

  return (
    <AuthGuard>
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* 顶部导航 — 固定定位 */}
      <header className="glass" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 60,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
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
                background: "var(--accent)", color: "#fff", textDecoration: "none",
              }}
            >
              持仓分析
            </a>
            <a
              href="/recommendations"
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: "transparent", color: "var(--text-secondary)", textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              🔥 热门推荐
            </a>
          </nav>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <UserMenu />
            <button className="btn btn-outline" onClick={() => fetchPositions(false)} disabled={loading}>
              {loading ? <span className="loading-spinner" /> : "⟳ 刷新"}
            </button>
            {refreshing && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>刷新中...</span>
            )}
            <button className="btn btn-primary" onClick={handleAnalyzeAll} disabled={analyzing || positions.length === 0}>
              {analyzing ? <><span className="loading-spinner" /> AI 分析中...</> : <>✦ 智能分析</>}
            </button>
            <button className="btn btn-success" onClick={() => setShowAddModal(true)}>
              ＋ 添加持仓
            </button>
          </div>
        </div>
      </header>

      {/* 主内容：左侧对话 + 右侧持仓 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", paddingTop: 60 }}>
        {/* 左侧 AI 对话面板 */}
        <div style={{
          width: 350, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden",
          borderRight: "1px solid var(--border)",
        }}>
          {/* 对话模型切换 Tab */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
          }}>
            {(["qwen", "deepseek"] as ModelType[]).map((model) => {
              const cfg = MODEL_CONFIG[model];
              const isActive = chatModel === model;
              return (
                <button
                  key={model}
                  onClick={() => setChatModel(model)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                    background: isActive ? "var(--accent)" : "transparent",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    border: isActive ? "none" : "1px solid var(--border)",
                  }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
            <button
              onClick={async () => {
                if (!confirm("确认清空对话历史？")) return;
                try { await api.clearChatHistory(chatModel); } catch {}
              }}
              style={{
                marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6,
                color: "var(--text-muted)", border: "1px solid var(--border)",
                background: "transparent", cursor: "pointer",
              }}
            >
              清空
            </button>
          </div>
          {/* 对话内容 */}
          <ChatPanel
            model={chatModel}
            enableSearch={chatModel === "qwen" ? qwenEnableSearch : deepseekEnableSearch}
            onEnableSearchChange={chatModel === "qwen" ? setQwenEnableSearch : setDeepseekEnableSearch}
          />
        </div>

        {/* 右侧持仓与分析 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
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

          {/* 统计仪表盘 */}
          {positions.length > 0 && (
            <div className="animate-fade-in" style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24,
            }}>
              <StatCard label="持仓数量" value={`${positions.length} 只`} icon="📊" />
              <StatCard label="总市值" value={`¥${totalValue.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="💰" />
              <StatCard
                label="总盈亏"
                value={`${totalProfit >= 0 ? "+" : ""}¥${totalProfit.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                isUp={totalProfit >= 0}
                icon={totalProfit >= 0 ? "📈" : "📉"}
              />
              <StatCard
                label="最佳表现"
                value={bestStock ? `${bestStock.name} ${bestStock.profit_pct != null ? (bestStock.profit_pct >= 0 ? "+" : "") + bestStock.profit_pct + "%" : "--"}` : "--"}
                isUp={(bestStock?.profit_pct ?? 0) >= 0}
                icon="🏆"
              />
            </div>
          )}

          {/* 持仓列表 */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ height: 180 }}>
                  <div className="skeleton" style={{ width: 80, height: 18, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 50, height: 14, marginBottom: 20 }} />
                  <div className="skeleton" style={{ width: "100%", height: 40 }} />
                </div>
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="animate-fade-in" style={{
              textAlign: "center", padding: "80px 20px",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📊</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                暂无持仓股票
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
                添加你的持仓股票，AI 将为你提供实时分析和操作建议
              </p>
              <button className="btn btn-success" onClick={() => setShowAddModal(true)}>
                ＋ 添加第一只股票
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: analyses.length > 0 ? 24 : 0,
            }}>
              {positions.map((p, i) => (
                <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <PositionCard position={p} onDelete={handleDelete} onEdit={(id) => setEditPositionId(id)} />
                </div>
              ))}
            </div>
          )}

          {/* AI 分析结果（带模型切换 Tab） */}
          {(qwenAnalyses.length > 0 || deepseekAnalyses.length > 0) && (
            <div className="animate-fade-in">
              {/* 模型切换 Tab */}
              <div style={{
                display: "flex", gap: 8, marginBottom: 20,
                background: "var(--bg-primary)", borderRadius: 10, padding: 4,
                border: "1px solid var(--border)", width: "fit-content",
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
                        padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s",
                        background: isActive ? "var(--accent)" : "transparent",
                        color: isActive ? "#fff" : "var(--text-secondary)",
                        border: isActive ? "none" : "1px solid transparent",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      {isLoading ? (
                        <><span className="loading-spinner" style={{ marginRight: 6 }} /> {cfg.label}分析中</>
                      ) : (
                        <>{cfg.icon} {cfg.label}</>
                      )}
                    </button>
                  );
                })}
              </div>

              <AnalysisPanel results={analyses} model={activeModel} />
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddPositionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}

      {editPosition && (
        <EditPositionModal
          position={editPosition}
          onClose={() => setEditPositionId(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
    </AuthGuard>
  );
}

function StatCard({ label, value, isUp, icon }: {
  label: string; value: string; isUp?: boolean; icon: string;
}) {
  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700,
        color: isUp === undefined ? "var(--text-primary)" : isUp ? "var(--up)" : "var(--down)",
      }}>
        {value}
      </div>
    </div>
  );
}
