"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAdmin } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) { setError("请输入密码"); return; }

    setLoading(true);
    try {
      if (loginAdmin(password)) {
        router.push("/dashboard");
      } else {
        setError("密码错误");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        className="animate-fade-in"
        style={{ width: 380, borderRadius: 16, padding: "32px 28px", background: "var(--bg-secondary)", border: "1px solid var(--border)", boxShadow: "0 16px 64px rgba(0,0,0,0.4)" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 auto 12px" }}>A</div>
          <h2 className="gradient-text" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>StockAI 管理后台</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>请输入管理员密码</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 8, fontSize: 13, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--up)" }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理员密码"
            style={{ width: "100%", marginBottom: 20, fontSize: 14 }}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !password.trim()} style={{ width: "100%", padding: "12px 0", fontSize: 15 }}>
            {loading ? "验证中..." : "登 录"}
          </button>
        </form>
      </div>
    </div>
  );
}
