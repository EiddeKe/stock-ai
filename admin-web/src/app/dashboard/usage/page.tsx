"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

export default function UsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsageStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>加载中...</div>;

  const byType = stats?.by_action_type || {};
  const totalCalls = stats?.today_total_calls || 0;
  const maxVal = Math.max(...Object.values(byType).map(Number), 1);

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>用量统计</h2>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>今日平台 AI 调用量统计</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard label="今日总调用量" value={totalCalls} icon="⚡" />
        <StatCard label="Analysis 调用" value={byType["analysis"] || 0} icon="🔍" />
        <StatCard label="Chat 调用" value={byType["chat"] || 0} icon="💬" />
        <StatCard label="活跃订阅" value={stats?.active_subscriptions ?? 0} icon="🎫" />
      </div>

      {/* 调用量柱状图 */}
      {Object.keys(byType).length > 0 && (
        <div className="card animate-fade-in" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>调用类型分布</h3>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end", height: 180 }}>
            {Object.entries(byType).map(([type, count]: [string, number]) => (
              <div key={type} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{count}</div>
                <div style={{ height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{
                    width: "100%", maxWidth: 80, borderRadius: "6px 6px 0 0",
                    background: type === "analysis" ? "linear-gradient(180deg, var(--accent), rgba(99,102,241,0.3))" : "linear-gradient(180deg, #22c55e, rgba(34,197,94,0.3))",
                    height: `${(count / maxVal) * 100}%`,
                    transition: "height 0.5s ease",
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{type}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{totalCalls > 0 ? ((count / totalCalls) * 100).toFixed(1) : 0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalCalls === 0 && (
        <div className="card animate-fade-in" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📈</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>今日暂无调用数据，用户开始使用后会自动统计</p>
        </div>
      )}

      {/* 订阅概览 */}
      <div className="card animate-fade-in" style={{ marginTop: 24, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>平台概览</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>总用户数</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.total_users ?? 0}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>活跃订阅数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{stats?.active_subscriptions ?? 0}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>订阅转化率</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>{stats?.total_users > 0 ? ((stats.active_subscriptions / stats.total_users) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
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
