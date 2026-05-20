"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

export default function RecommendationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/stock-analysis");
  }, [router]);

  return (
    <AuthGuard>
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>跳转中...</div>
      </div>
    </AuthGuard>
  );
}
