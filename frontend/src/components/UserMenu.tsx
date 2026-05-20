"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { subscriptionApi } from "@/lib/api";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [subInfo, setSubInfo] = useState<string>("免费版");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    subscriptionApi.getMySubscription().then((data) => {
      if (data.has_subscription && data.subscription?.plan) {
        const exp = new Date(data.subscription.expire_at).toLocaleDateString("zh-CN");
        setSubInfo(`${data.subscription.plan.name} | 到期 ${exp}`);
      }
    }).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "4px 10px",
          borderRadius: 8, border: "1px solid var(--border)",
          background: "transparent", color: "var(--text-primary)", cursor: "pointer",
          fontSize: 13, fontWeight: 600,
        }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 12, fontWeight: 700,
        }}>
          {user.nickname.charAt(0)}
        </span>
        {user.nickname}
        <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="animate-fade-in" style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          minWidth: 180, borderRadius: 12, padding: "8px 0",
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", zIndex: 100,
        }}>
          <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{user.nickname}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.account}</div>
          </div>
          <Link
            href="/pricing"
            style={{ display: "block", padding: "8px 16px", fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}
            onClick={() => setOpen(false)}
          >
            我的订阅
          </Link>
          <div style={{ padding: "0 16px 4px", fontSize: 11, color: "var(--text-muted)" }}>{subInfo}</div>
          <button
            onClick={() => { logout(); setOpen(false); window.location.href = "/"; }}
            style={{
              width: "100%", padding: "8px 16px", textAlign: "left",
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--up)",
            }}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
