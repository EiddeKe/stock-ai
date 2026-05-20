"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsageStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>加载中...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>仪表盘</h2>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>系统运行概览</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        <StatCard label="总用户数" value={stats?.total_users ?? 0} icon="👥" />
        <StatCard label="活跃订阅" value={stats?.active_subscriptions ?? 0} icon="🎫" />
        <StatCard label="今日调用量" value={stats?.today_total_calls ?? 0} icon="⚡" />
        <StatCard label="今日新增用户" value={0} icon="📝" />
      </div>

      {/* 今日调用量分布 */}
      {stats?.by_action_type && Object.keys(stats.by_action_type).length > 0 && (
        <div className="card animate-fade-in" style={{ marginTop: 32, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>今日调用量分布</h3>
          <div style={{ display: "flex", gap: 32 }}>
            {Object.entries(stats.by_action_type as Record<string, number>).map(([type, count]) => (
              <div key={type} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{
                    width: 60, borderRadius: "6px 6px 0 0",
                    background: "linear-gradient(180deg, var(--accent), rgba(99, 102, 241, 0.3))",
                    height: `${Math.max(20, (count / Math.max(...(Object.values(stats.by_action_type) as number[]))) * 100)}px`,
                    transition: "height 0.5s ease",
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{type}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!stats?.today_total_calls || stats.today_total_calls === 0) && (
        <div className="card animate-fade-in" style={{ marginTop: 32, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📊</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>今日暂无调用数据</p>
        </div>
      )}
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
