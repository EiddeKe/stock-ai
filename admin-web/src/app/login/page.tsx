"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi, setAdminToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!account.trim()) { setError("请输入账号"); return; }
    if (!password.trim()) { setError("请输入密码"); return; }

    setLoading(true);
    try {
      const res = await adminApi.login(account.trim(), password);
      if (!res.token) {
        setError("登录响应异常：未获取到token");
        return;
      }
      setAdminToken(res.token);
      router.push("/dashboard");
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        className="animate-fade-in"
        style={{ width: "calc(100% - 32px)", maxWidth: 380, borderRadius: 16, padding: "32px 28px", background: "var(--bg-secondary)", border: "1px solid var(--border)", boxShadow: "0 16px 64px rgba(0,0,0,0.4)" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 auto 12px" }}>A</div>
          <h2 className="gradient-text" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>StockAI 管理后台</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>请输入管理员账号密码</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 8, fontSize: 13, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--up)" }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="管理员账号"
            style={{ width: "100%", marginBottom: 12, fontSize: 14 }}
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            style={{ width: "100%", marginBottom: 20, fontSize: 14 }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !password.trim()} style={{ width: "100%", padding: "12px 0", fontSize: 15 }}>
            {loading ? "验证中..." : "登 录"}
          </button>
        </form>
      </div>
    </div>
  );
}
