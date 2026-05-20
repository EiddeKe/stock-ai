"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

export default function UsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userPage, setUserPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        adminApi.getUsageStats(),
        adminApi.getUsageByUser(userPage),
      ]);
      setStats(s);
      setUserStats(u);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userPage]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>加载中...</div>;

  const byModel = stats?.by_model || {};
  const byAction = stats?.by_action_type || {};
  const maxModelVal = Math.max(...Object.values(byModel).map(Number), 1);

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>用量统计</h2>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>平台 AI 调用量与用户用量明细</p>

      {/* 总览卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard label="今日调用量" value={stats.today_total_calls} icon="⚡" />
        <StatCard label="本月调用量" value={stats.month_total_calls} icon="📅" />
        <StatCard label="本月总成本" value={`¥${stats.month_total_cost}`} icon="💰" />
        <StatCard label="历史总调用量" value={stats.total_calls} icon="📊" />
      </div>

      {/* 按调用类型分布 */}
      {Object.keys(byAction).length > 0 && (
        <div className="card animate-fade-in" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>今日调用类型分布</h3>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end", height: 140 }}>
            {Object.entries(byAction as Record<string, number>).map(([type, count]) => (
              <div key={type} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{count}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 按模型分布 */}
      {Object.keys(byModel).length > 0 && (
        <div className="card animate-fade-in" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>模型调用量分布</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>历史累计</p>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end", height: 180 }}>
            {Object.entries(byModel as Record<string, number>).map(([model, count]) => {
              const colors: Record<string, string> = {
                qwen: "linear-gradient(180deg, var(--accent), rgba(99,102,241,0.3))",
                deepseek: "linear-gradient(180deg, #22c55e, rgba(34,197,94,0.3))",
                gemini: "linear-gradient(180deg, #f59e0b, rgba(245,158,11,0.3))",
              };
              return (
                <div key={model} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{count}</div>
                  <div style={{ height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <div style={{
                      width: "100%", maxWidth: 80, borderRadius: "6px 6px 0 0",
                      background: colors[model] || "var(--text-muted)",
                      height: `${(count / maxModelVal) * 100}%`,
                      transition: "height 0.5s ease",
                    }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{model}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 用户用量明细表 */}
      <div className="card animate-fade-in" style={{ marginTop: 24, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>用户用量明细</h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
          共 {userStats?.total ?? 0} 个用户 · 第 {userPage} / {Math.ceil((userStats?.total ?? 0) / 20)} 页
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["ID", "账号", "昵称", "今日调用", "总调用量", "总成本", "模型分布"].map((h, i) => (
                <th key={h} style={{
                  textAlign: i >= 3 ? "right" : "left",
                  padding: "12px 12px",
                  color: "var(--text-muted)", fontWeight: 600, fontSize: 12,
                  whiteSpace: i === 6 ? "nowrap" : undefined,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {userStats?.users?.map((u: any) => (
              <tr key={u.user_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{u.user_id}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontWeight: 500 }}>{u.account}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-primary)" }}>{u.nickname}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>{u.today_calls}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{u.total_calls}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "#f59e0b" }}>¥{u.total_cost}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {Object.entries((u.by_model || {}) as Record<string, number>).map(([m, c]) => (
                      <span key={m} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 4,
                        background: m === "qwen" ? "rgba(99,102,241,0.15)" : m === "deepseek" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                        color: m === "qwen" ? "var(--accent)" : m === "deepseek" ? "#22c55e" : "#f59e0b",
                        border: `1px solid ${m === "qwen" ? "rgba(99,102,241,0.3)" : m === "deepseek" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                      }}>
                        {m}: {c}
                      </span>
                    ))}
                    {Object.keys(u.by_model || {}).length === 0 && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>--</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 分页 */}
        {userStats && (userStats.total ?? 0) > 20 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage <= 1} style={{ fontSize: 13, padding: "6px 14px" }}>上一页</button>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{userPage} / {Math.ceil(userStats.total / 20)}</span>
            <button className="btn btn-outline" onClick={() => setUserPage(p => p + 1)} disabled={userPage >= Math.ceil(userStats.total / 20)} style={{ fontSize: 13, padding: "6px 14px" }}>下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="card animate-fade-in" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
