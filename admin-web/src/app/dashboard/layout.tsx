"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAdminLoggedIn, logoutAdmin } from "@/lib/api";

const NAV_ITEMS = [
  { path: "/dashboard", label: "仪表盘", icon: "📊" },
  { path: "/dashboard/users", label: "用户管理", icon: "👥" },
  { path: "/dashboard/plans", label: "套餐管理", icon: "🎫" },
  { path: "/dashboard/usage", label: "用量统计", icon: "📈" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* 左侧导航栏 */}
      <aside style={{ width: 220, flexShrink: 0, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        {/* Logo */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>A</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}><span className="gradient-text">StockAI</span></div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>管理后台</div>
          </div>
        </div>

        {/* 导航链接 */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 20px", fontSize: 14, fontWeight: 500,
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                  borderRight: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                  textDecoration: "none", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 退出登录 */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => { logoutAdmin(); router.push("/login"); }}
            style={{ width: "100%", padding: "8px 0", textAlign: "center", borderRadius: 8, fontSize: 13, color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
    </div>
  );
}
