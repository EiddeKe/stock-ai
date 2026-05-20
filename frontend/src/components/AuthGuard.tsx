"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import LoginModal from "@/components/LoginModal";
import TermsAgreementModal from "@/components/TermsAgreementModal";
import InvestmentStyleModal from "@/components/InvestmentStyleModal";

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      // 未登录 → 跳转首页并弹出登录框
      router.replace("/");
      setTimeout(() => setShowLogin(true), 300);
    } else {
      setChecked(true);
      // 已登录，检查是否同意协议
      setTermsModalOpen(true);
    }
  }, [router]);

  const handleLogin = () => {
    setShowLogin(false);
    // 登录后也检查协议同意状态
    setTermsModalOpen(true);
    window.location.reload();
  };

  const handleTermsAgreed = () => {
    setTermsModalOpen(false);
    setStyleModalOpen(true);
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
      {termsModalOpen && <TermsAgreementModal onAgreed={handleTermsAgreed} />}
      {styleModalOpen && <InvestmentStyleModal onDone={() => setStyleModalOpen(false)} />}
    </>
  );
}
