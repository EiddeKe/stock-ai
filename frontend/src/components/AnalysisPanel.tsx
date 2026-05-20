"use client";

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

const suggestionConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  "买入": { color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", icon: "🟢", label: "买入" },
  "加仓": { color: "#16a34a", bg: "rgba(22, 163, 74, 0.15)", icon: "📈", label: "加仓" },
  "持有": { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", icon: "⏸", label: "持有" },
  "减仓": { color: "#f97316", bg: "rgba(249, 115, 22, 0.15)", icon: "📉", label: "减仓" },
  "卖出": { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", icon: "🔴", label: "卖出" },
};

const MODEL_LABELS: Record<string, string> = {
  qwen: "通义千问",
  deepseek: "DeepSeek",
};

export default function AnalysisPanel({ results, model = "qwen" }: { results: AnalysisResult[]; model?: string }) {
  const buyCount = results.filter((r) => r.suggestion === "买入" || r.suggestion === "加仓").length;
  const holdCount = results.filter((r) => r.suggestion === "持有").length;
  const sellCount = results.filter((r) => r.suggestion === "卖出" || r.suggestion === "减仓").length;

  return (
    <div className="animate-fade-in">
      {/* 分析结果头部 */}
      <div className="card" style={{
        marginBottom: 20, padding: "20px 24px",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.05))",
        border: "1px solid rgba(99, 102, 241, 0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              {MODEL_LABELS[model] || "AI"} 智能分析
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              基于技术指标 + AI 推理，分析 {results.length} 只持仓股票
            </p>
          </div>
          <div style={{ fontSize: 24 }}>🤖</div>
        </div>

        {/* 建议汇总 */}
        <div style={{ display: "flex", gap: 12 }}>
          <SummaryBadge count={buyCount} label="建议买入/加仓" color="var(--suggestion-buy)" />
          <SummaryBadge count={holdCount} label="建议持有" color="var(--suggestion-hold)" />
          <SummaryBadge count={sellCount} label="建议减仓/卖出" color="var(--suggestion-sell)" />
        </div>
      </div>

      {/* 分析结果列表 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {results.map((r, i) => {
          const cfg = suggestionConfig[r.suggestion] || suggestionConfig["持有"];
          return (
            <div
              key={r.symbol}
              className="card animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.08}s`,
                borderLeft: `3px solid ${cfg.color}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{r.name}</h3>
                    <span style={{
                      fontSize: 12, fontFamily: "SF Mono, Menlo, monospace",
                      color: "var(--text-muted)",
                    }}>
                      {r.symbol}
                    </span>
                  </div>
                  <div style={{
                    padding: "4px 12px", borderRadius: 6, fontSize: 14, fontWeight: 700,
                    background: cfg.bg, color: cfg.color,
                  }}>
                    {cfg.icon} {cfg.label}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>置信度</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>
                    {r.confidence}%
                  </div>
                </div>
              </div>

              {/* 价格对比条 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                borderRadius: 8, background: "var(--bg-primary)", marginBottom: 12,
                fontSize: 13,
              }}>
                <span style={{ color: "var(--text-muted)" }}>现价</span>
                <span style={{ fontWeight: 600, fontFamily: "SF Mono, Menlo, monospace" }}>
                  ¥{r.current_price.toFixed(2)}
                </span>
                <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>→</span>
                <span style={{ color: "var(--text-muted)" }}>成本</span>
                <span style={{ fontWeight: 600, fontFamily: "SF Mono, Menlo, monospace" }}>
                  ¥{r.cost_price.toFixed(2)}
                </span>
                <span style={{ marginLeft: "auto", fontWeight: 700, color: r.profit_pct >= 0 ? "var(--up)" : "var(--down)" }}>
                  {r.profit_pct >= 0 ? "+" : ""}{r.profit_pct}%
                </span>
              </div>

              {/* 分析理由 */}
              <p style={{
                fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7,
                padding: "10px 14px", borderRadius: 8, background: "var(--bg-primary)",
                marginBottom: 8,
              }}>
                {r.reason}
              </p>

              {/* 风险提示 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "var(--text-muted)", opacity: 0.7,
              }}>
                <span>⚠</span>
                <span>{r.risk_tip}</span>
              </div>

              {/* 置信度进度条 */}
              <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: "var(--bg-primary)" }}>
                <div style={{
                  height: "100%", borderRadius: 2, width: `${r.confidence}%`,
                  background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{
      flex: 1, padding: "10px 16px", borderRadius: 8,
      background: "var(--bg-primary)", border: "1px solid var(--border)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}
