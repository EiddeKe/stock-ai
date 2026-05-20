"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import LoginModal from "@/components/LoginModal";

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      // 未登录 → 跳转首页并弹出登录框
      router.replace("/");
      setTimeout(() => setShowLogin(true), 300);
    } else {
      setChecked(true);
    }
  }, [router]);

  const handleLogin = () => {
    setShowLogin(false);
    window.location.reload();
  };

  if (!checked) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <span className="loading-spinner" style={{ marginRight: 8 }} />
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>加载中...</span>
      </div>
    );
  }

  return (
    <>
      {children}
      {showLogin && <LoginModal onClose={() => router.push("/")} onLogin={handleLogin} />}
    </>
  );
}
