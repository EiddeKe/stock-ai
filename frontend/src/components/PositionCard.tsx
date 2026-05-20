"use client";

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

interface Props {
  position: Position;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export default function PositionCard({ position: p, onDelete, onEdit }: Props) {
  const isUp = (p.profit_pct ?? 0) >= 0;
  const profitColor = isUp ? "var(--up)" : "var(--down)";
  const profitBg = isUp ? "var(--up-bg)" : "var(--down-bg)";
  const profitGlow = isUp ? "var(--up-glow)" : "var(--down-glow)";
  const dayChangePct = p.change_pct ?? 0;
  const dayIsUp = dayChangePct >= 0;
  const dayChangeColor = dayIsUp ? "var(--up)" : "var(--down)";

  return (
    <div className="card" style={{
      borderLeft: `3px solid ${profitColor}`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 盈亏背景光 */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 100, height: 100, borderRadius: "50%",
        background: `radial-gradient(circle, ${profitGlow}, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* 头部：股票名 + 代码 + 今日涨跌 */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, position: "relative" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
            {p.change_pct != null && (
              <span style={{
                fontSize: 13, fontWeight: 600,
                fontFamily: "SF Mono, Menlo, monospace",
                color: dayChangeColor,
              }}>
                {dayIsUp ? "+" : ""}{dayChangePct}%
              </span>
            )}
          </div>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "SF Mono, Menlo, monospace" }}>
            {p.symbol}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onEdit(p.id)}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 6,
              color: "var(--text-muted)", border: "1px solid var(--border)",
              background: "transparent", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = "var(--accent)";
              (e.target as HTMLElement).style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = "var(--text-muted)";
              (e.target as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            编辑
          </button>
          <button
            onClick={() => onDelete(p.id)}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 6,
              color: "var(--text-muted)", border: "1px solid var(--border)",
              background: "transparent", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = "var(--up)";
              (e.target as HTMLElement).style.borderColor = "var(--up)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = "var(--text-muted)";
              (e.target as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            删除
          </button>
        </div>
      </div>

      {/* 核心数据：现价 vs 成本 */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, position: "relative",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>成本价</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "SF Mono, Menlo, monospace" }}>
            ¥{p.cost_price.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>现价</div>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: profitColor,
            fontFamily: "SF Mono, Menlo, monospace",
          }}>
            {p.current_price != null ? `¥${p.current_price.toFixed(2)}` : "--"}
          </div>
        </div>
      </div>

      {/* 盈亏信息 */}
      {p.profit_pct != null && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", borderRadius: 8, background: profitBg,
          position: "relative",
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: profitColor }}>
            {isUp ? "+" : ""}{p.profit_pct}%
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: profitColor }}>
            {isUp ? "+" : ""}¥{p.profit_amount?.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* 底部信息 */}
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 12,
        fontSize: 11, color: "var(--text-muted)", position: "relative",
      }}>
        <span>持有 {p.shares.toLocaleString()} 股</span>
        {p.buy_date && (
          <span>买入 {new Date(p.buy_date).toLocaleDateString("zh-CN")}</span>
        )}
      </div>
    </div>
  );
}
