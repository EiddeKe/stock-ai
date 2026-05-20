"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAdminLoggedIn, logoutAdmin } from "@/lib/api";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  const { isMobile, isTablet } = useMediaQuery();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  // Mobile: sidebar hidden by default, overlay when open
  if (isMobile) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", background: "var(--bg-primary)" }}>
        {/* Mobile top bar */}
        <header className="glass" style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 56, borderBottom: "1px solid var(--border)",
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}
          >
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>A</div>
            <span style={{ fontSize: 14, fontWeight: 700 }}><span className="gradient-text">StockAI</span></span>
          </div>
          <button
            onClick={() => { logoutAdmin(); router.push("/login"); }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}
          >
            退出
          </button>
        </header>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, top: 56, zIndex: 90, background: "rgba(0,0,0,0.5)" }}
              onClick={() => setSidebarOpen(false)}
            />
            <aside style={{
              position: "fixed", top: 56, left: 0, bottom: 0, width: 260, zIndex: 100,
              background: "var(--bg-secondary)", borderRight: "1px solid var(--border)",
              display: "flex", flexDirection: "column",
              animation: "fadeIn 0.2s ease-out",
            }}>
              <nav style={{ flex: 1, padding: "12px 0" }}>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 20px", fontSize: 15, fontWeight: 500,
                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                        background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        textDecoration: "none", transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    );
  }

  // Tablet: icon-only sidebar
  const sidebarWidth = isTablet ? 60 : 220;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* 左侧导航栏 */}
      <aside style={{ width: sidebarWidth, flexShrink: 0, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "width 0.2s ease" }}>
        {/* Logo */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>A</div>
          {!isTablet && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}><span className="gradient-text">StockAI</span></div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>管理后台</div>
            </div>
          )}
        </div>

        {/* 导航链接 */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                title={item.label}
                style={{
                  display: "flex", alignItems: "center",
                  justifyContent: isTablet ? "center" : "flex-start",
                  gap: 10, padding: isTablet ? "12px 0" : "10px 20px",
                  fontSize: 14, fontWeight: 500,
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                  borderRight: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                  textDecoration: "none", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: isTablet ? 20 : 16 }}>{item.icon}</span>
                {!isTablet && item.label}
              </Link>
            );
          })}
        </nav>

        {/* 退出登录 */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => { logoutAdmin(); router.push("/login"); }}
            style={{
              width: "100%", padding: isTablet ? "8px 0" : "8px 0",
              textAlign: "center", borderRadius: 8, fontSize: 13,
              color: "var(--text-muted)", background: "transparent",
              border: "1px solid var(--border)", cursor: "pointer",
            }}
            title="退出登录"
          >
            {isTablet ? "🚪" : "退出登录"}
          </button>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
    </div>
  );
}
