"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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

type PageTab = "analysis" | "recommendations";
type ModelType = "qwen" | "deepseek" | "gemini";

const MODEL_CONFIG: Record<ModelType, { label: string; icon: string }> = {
  qwen: { label: "千问", icon: "✦" },
  deepseek: { label: "DeepSeek", icon: "◆" },
  gemini: { label: "Gemini", icon: "●" },
};

const CHAT_WIDTH = 350;
const CHAT_WIDTH_MIN = 280;

export default function StockAnalysisPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}><span className="loading-spinner" /></div>}>
      <StockAnalysisContent />
    </Suspense>
  );
}

function StockAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "recommendations" ? "recommendations" : "analysis";
  const [activeTab, setActiveTab] = useState<PageTab>(initialTab);

  return (
    <AuthGuard>
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* 顶部导航 */}
      <header className="glass" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", padding: "8px 12px 0", display: "flex", flexDirection: "column", height: 68 }}>
          {/* 上行：Logo + Tab + UserMenu */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            {/* 左侧 Logo + 导航链接 */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => router.push("/")}
              >
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
                  <span className="hide-mobile" style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>交易指导助手</span>
                </h1>
              </div>

              {/* 页面 Tab 切换 — 药丸分段控件 */}
              <nav style={{
                display: "flex", alignItems: "center",
                background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3,
                border: "1px solid var(--border)",
              }}>
                {([
                  { key: "analysis" as PageTab, label: "持仓分析", emoji: "📊" },
                  { key: "recommendations" as PageTab, label: "热门推荐", emoji: "🔥" },
                ]).map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        router.replace(tab.key === "analysis" ? "/stock-analysis" : "/stock-analysis?tab=recommendations");
                      }}
                      style={{
                        padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.25s ease",
                        background: isActive ? "var(--accent)" : "transparent",
                        color: isActive ? "#fff" : "var(--text-secondary)",
                        border: "none",
                        boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
                      }}
                      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = "var(--text-primary)"; } }}
                      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = "var(--text-secondary)"; } }}
                    >
                      {tab.emoji} {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 右侧 UserMenu */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区：根据 Tab 切换 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", paddingTop: 68 }}>
        {activeTab === "analysis" ? (
          <AnalysisTabContent />
        ) : (
          <RecommendationsTabContent />
        )}
      </div>

      {/* 底部免责声明 */}
      <footer style={{
        padding: "10px 20px", borderTop: "1px solid var(--border)",
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
    </AuthGuard>
  );
}

/* ============================================================
 * 持仓分析 Tab 内容
 * ============================================================ */
function AnalysisTabContent() {
  const { isMobile } = useMediaQuery();
  const [positions, setPositions] = useState<Position[]>([]);
  const [qwenAnalyses, setQwenAnalyses] = useState<AnalysisResult[]>([]);
  const [deepseekAnalyses, setDeepseekAnalyses] = useState<AnalysisResult[]>([]);
  const [geminiAnalyses, setGeminiAnalyses] = useState<AnalysisResult[]>([]);
  const [activeModel, setActiveModel] = useState<ModelType>("qwen");
  const [chatModel, setChatModel] = useState<ModelType>("qwen");
  const [qwenEnableSearch, setQwenEnableSearch] = useState(false);
  const [deepseekEnableSearch, setDeepseekEnableSearch] = useState(false);
  const [geminiEnableSearch, setGeminiEnableSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deepseekLoading, setDeepseekLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPositionId, setEditPositionId] = useState<number | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(isMobile);
  const [chatWidth, setChatWidth] = useState(CHAT_WIDTH);
  const dragging = useRef(false);
  const hasLoadedOnce = useRef(false);
  const router = useRouter();

  const analyses = activeModel === "qwen" ? qwenAnalyses : activeModel === "deepseek" ? deepseekAnalyses : geminiAnalyses;
  const hasDeepseek = deepseekAnalyses.length > 0;
  const hasGemini = geminiAnalyses.length > 0;

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

  useEffect(() => {
    fetchPositions(false);
    hasLoadedOnce.current = true;
  }, [fetchPositions]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasLoadedOnce.current) {
        fetchPositions(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // 拖拽调整聊天面板宽度
  useEffect(() => {
    if (isMobile) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.max(CHAT_WIDTH_MIN, Math.min(window.innerWidth * 0.75, e.clientX));
      setChatWidth(newWidth);
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isMobile]);

  const streamingStarted = useRef(false);

  // 用户发送消息时展开到50%屏宽，流式结束后保持当前宽度
  const handleStreamingLength = useCallback((len: number) => {
    if (isMobile || chatCollapsed) return;
    if (len > 0 && !streamingStarted.current) {
      streamingStarted.current = true;
      setChatWidth(window.innerWidth * 0.5);
    } else if (len === 0) {
      streamingStarted.current = false;
    }
  }, [isMobile, chatCollapsed]);

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
      setGeminiAnalyses([]);
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
      setGeminiAnalyses([]);
    } catch (e: any) {
      if (e.message.includes("已达上限")) {
        if (confirm("每日分析次数已达上限，是否前往升级套餐？")) {
          router.push("/pricing");
        }
      } else {
        alert(e.message);
      }
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

  const handleAnalyzeGemini = async () => {
    if (hasGemini) return;
    setGeminiLoading(true);
    try {
      const results = await api.analyzeAll("gemini");
      setGeminiAnalyses(results);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleModelSwitch = (model: ModelType) => {
    setActiveModel(model);
    if (model === "deepseek" && !hasDeepseek) {
      handleAnalyzeDeepSeek();
    }
    if (model === "gemini" && !hasGemini) {
      handleAnalyzeGemini();
    }
  };

  const editPosition = positions.find((p) => p.id === editPositionId);

  const totalProfit = positions.reduce((s, p) => s + (p.profit_amount ?? 0), 0);
  const totalValue = positions.reduce((s, p) => s + ((p.current_price ?? p.cost_price) * p.shares), 0);
  const bestStock = positions.length > 0
    ? positions.reduce((a, b) => (a.profit_pct ?? -999) > (b.profit_pct ?? -999) ? a : b)
    : null;

  return (
    <>
      {/* 左侧 AI 对话面板 */}
      {!chatCollapsed && (
        <div style={isMobile ? {
          position: "fixed", top: 68, left: 0, right: 0, bottom: 0, zIndex: 60,
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "var(--bg-primary)",
        } : {
          width: chatWidth, minWidth: CHAT_WIDTH_MIN, maxWidth: "75vw",
          flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden",
          borderRight: "none", position: "relative",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
          }}>
            {(["qwen", "deepseek", "gemini"] as ModelType[]).map((model) => {
              const cfg = MODEL_CONFIG[model];
              const isActive = chatModel === model;
              return (
                <button
                  key={model}
                  onClick={() => setChatModel(model)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600,
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
          <ChatPanel
            model={chatModel}
            enableSearch={chatModel === "qwen" ? qwenEnableSearch : chatModel === "deepseek" ? deepseekEnableSearch : geminiEnableSearch}
            onEnableSearchChange={chatModel === "qwen" ? setQwenEnableSearch : chatModel === "deepseek" ? setDeepseekEnableSearch : setGeminiEnableSearch}
            onStreamingLength={handleStreamingLength}
          />
          {/* 收起按钮 */}
          <button
            onClick={() => setChatCollapsed(true)}
            style={isMobile ? {
              position: "absolute", bottom: 16, right: 16,
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            } : {
              position: "absolute", top: "50%", right: -8, transform: "translateY(-50%)",
              width: 20, height: 48, borderRadius: "0 4px 4px 0",
              background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "none",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", zIndex: 10,
            }}
            title="收起对话"
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            {isMobile ? "✕" : "◀"}
          </button>
          {/* 拖拽手柄 */}
          {!isMobile && (
            <div
              onMouseDown={(e) => {
                dragging.current = true;
                e.preventDefault();
              }}
              style={{
                position: "absolute", top: 0, right: 0, bottom: 0,
                width: 6, cursor: "col-resize", zIndex: 20,
              }}
            />
          )}
        </div>
      )}

      {/* 拖拽遮罩 + 收起后的展开按钮 */}
      {chatCollapsed && (
        <button
          onClick={() => setChatCollapsed(false)}
          style={isMobile ? {
            position: "fixed", bottom: 16, left: 16, zIndex: 40,
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            color: "var(--text-muted)", cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          } : {
            position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 40,
            width: 20, height: 48, borderRadius: "0 4px 4px 0",
            background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "none",
            color: "var(--text-muted)", cursor: "pointer", fontSize: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
          title="展开对话"
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          {isMobile ? "💬" : "▶"}
        </button>
      )}

      {/* 右侧持仓与分析 */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : "24px 20px" }}>
        {error && (
          <div className="animate-fade-in" style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--up)", fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {positions.length > 0 && (
          <div className="animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                <span className="gradient-text">持仓分析</span>
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>管理持仓，AI 实时分析建议</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>交易不靠直觉，AI 实时客观分析，决策更从容</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={handleAnalyzeAll} disabled={analyzing || positions.length === 0}>
                {analyzing ? <><span className="loading-spinner" /> AI 分析中...</> : <>✦ 智能分析</>}
              </button>
              <button className="btn btn-success" onClick={() => setShowAddModal(true)}>
                ＋ 添加持仓
              </button>
            </div>
          </div>
        )}

        {positions.length > 0 && (
          <div className="animate-fade-in grid-responsive-4" style={{ marginBottom: 24 }}>
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

        {(qwenAnalyses.length > 0 || deepseekAnalyses.length > 0 || geminiAnalyses.length > 0) && (
          <div className="animate-fade-in">
            <div style={{
              display: "flex", gap: 8, marginBottom: 20,
              background: "var(--bg-primary)", borderRadius: 10, padding: 4,
              border: "1px solid var(--border)", width: "fit-content",
            }}>
              {(["qwen", "deepseek", "gemini"] as ModelType[]).map((model) => {
                const cfg = MODEL_CONFIG[model];
                const isActive = activeModel === model;
                const isLoading = model === "deepseek" ? deepseekLoading : model === "gemini" ? geminiLoading : false;
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
                      <><span className="loading-spinner" style={{ marginRight: 6 }} /> {cfg.label}中</>
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
    </>
  );
}

/* ============================================================
 * 热门推荐 Tab 内容
 * ============================================================ */
function RecommendationsTabContent() {
  const { isMobile } = useMediaQuery();
  const [sectors, setSectors] = useState<SectorRecommendation[]>([]);
  const [qwenSectors, setQwenSectors] = useState<SectorRecommendation[]>([]);
  const [deepseekSectors, setDeepseekSectors] = useState<SectorRecommendation[]>([]);
  const [geminiSectors, setGeminiSectors] = useState<SectorRecommendation[]>([]);
  const [activeModel, setActiveModel] = useState<ModelType>("qwen");
  const [loading, setLoading] = useState(false);
  const [deepseekLoading, setDeepseekLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchRecommendations = useCallback(async (model: ModelType, isSwitch = false) => {
    if (!isSwitch) {
      setLoading(true);
    } else {
      if (model === "deepseek") setDeepseekLoading(true);
      if (model === "gemini") setGeminiLoading(true);
    }
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/recommendations?model=${model}`);
      if (!res.ok) throw new Error("获取推荐数据失败");
      const json = await res.json();
      if (model === "qwen") {
        setQwenSectors(json.data || []);
      } else if (model === "deepseek") {
        setDeepseekSectors(json.data || []);
      } else {
        setGeminiSectors(json.data || []);
      }
      setSectors(model === "qwen" ? (json.data || []) : model === "deepseek" ? deepseekSectors : geminiSectors);
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (!isSwitch) {
        setLoading(false);
      } else {
        if (model === "deepseek") setDeepseekLoading(false);
        if (model === "gemini") setGeminiLoading(false);
      }
    }
  }, [deepseekSectors, geminiSectors]);

  useEffect(() => {
    if (!hasLoadedOnce.current) {
      fetchRecommendations("qwen");
      hasLoadedOnce.current = true;
    }
  }, [fetchRecommendations]);

  const handleModelSwitch = (model: ModelType) => {
    setActiveModel(model);
    setExpandedSector(null);
    if (model === "qwen") {
      setSectors(qwenSectors);
    } else if (model === "deepseek") {
      if (deepseekSectors.length > 0) {
        setSectors(deepseekSectors);
      } else {
        fetchRecommendations("deepseek", true);
      }
    } else {
      if (geminiSectors.length > 0) {
        setSectors(geminiSectors);
      } else {
        fetchRecommendations("gemini", true);
      }
    }
  };

  useEffect(() => {
    if (activeModel === "qwen") {
      setSectors(qwenSectors);
    } else if (activeModel === "deepseek" && deepseekSectors.length > 0) {
      setSectors(deepseekSectors);
    } else if (activeModel === "gemini" && geminiSectors.length > 0) {
      setSectors(geminiSectors);
    }
  }, [activeModel, qwenSectors, deepseekSectors, geminiSectors]);

  const isLoading = activeModel === "deepseek" ? deepseekLoading : activeModel === "gemini" ? geminiLoading : loading;
  const currentSectors = activeModel === "qwen" ? qwenSectors : activeModel === "deepseek" ? deepseekSectors : geminiSectors;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : "24px 20px" }}>
      {/* 内容区工具栏：模型切换 + 刷新 */}
      <div className="animate-fade-in" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24,
        padding: "12px 16px", borderRadius: 12,
        background: "var(--bg-card)", border: "1px solid var(--border)",
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
            🔥 <span className="gradient-text">热门推荐</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            基于实时数据和 AI 分析，推荐潜力行业和个股 — {MODEL_CONFIG[activeModel].label}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 模型切换 */}
          <div style={{
            display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3,
            border: "1px solid var(--border)",
          }}>
            {(["qwen", "deepseek", "gemini"] as ModelType[]).map((model) => {
              const cfg = MODEL_CONFIG[model];
              const isActive = activeModel === model;
              const isLoading = (model === "deepseek" && deepseekLoading) || (model === "gemini" && geminiLoading);
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
                    <>{cfg.icon} {cfg.label === "千问" ? "千问推荐" : cfg.label === "DeepSeek" ? "DeepSeek推荐" : "Gemini推荐"}</>
                  )}
                </button>
              );
            })}
          </div>
          {/* 刷新按钮 */}
          <button className="btn btn-outline" onClick={() => fetchRecommendations(activeModel, activeModel !== "qwen")} disabled={loading} style={{ fontSize: 13, padding: "6px 14px" }}>
            {loading ? <span className="loading-spinner" /> : "⟳ 刷新"}
          </button>
        </div>
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
          <button className="btn btn-primary" onClick={() => fetchRecommendations(activeModel, activeModel !== "qwen")}>
            重新获取
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {currentSectors.map((sector, i) => (
            <div
              key={sector.sector_name + i}
              className="card animate-fade-in-up"
              style={{ padding: 24, animationDelay: `${i * 0.08}s` }}
            >
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

              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                <InfoBlock label="推荐理由" value={sector.recommend_reason} color="var(--text-primary)" />
                <InfoBlock label="成长潜力" value={sector.growth_potential} color="var(--accent)" />
                <InfoBlock label="政策环境" value={sector.policy_support} color="#10b981" />
              </div>

              <div style={{
                padding: "10px 14px", borderRadius: 8, fontSize: 13,
                background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)",
                color: "#f59e0b", marginBottom: 16,
              }}>
                ⚠ {sector.risk_warning}
              </div>

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
    </div>
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

function InfoBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      <p style={{ fontSize: 13.5, color, lineHeight: 1.6, margin: "4px 0 0 0" }}>{value}</p>
    </div>
  );
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

interface StockRecommendation {
  symbol: string;
  name: string;
  current_price: number;
  change_pct: number;
  recommend_reason: string;
  risk_tip: string;
}
