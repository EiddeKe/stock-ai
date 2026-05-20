"use client";
import { useState } from "react";
import { login, register, getUser } from "@/lib/api";

interface Props {
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ onClose, onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!nickname.trim()) { setError("请输入昵称"); return; }
      if (password !== confirmPwd) { setError("两次密码不一致"); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(account, password);
      } else {
        await register(account, password, nickname);
      }
      // 触发 auth 更新
      getUser();
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380, borderRadius: 16, padding: "32px 28px",
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          boxShadow: "0 16px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* 标题 */}
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>
          <span className="gradient-text">
            {mode === "login" ? "欢迎回来" : "创建账号"}
          </span>
        </h2>

        {/* Tab 切换 */}
        <div style={{ display: "flex", marginBottom: 24, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3 }}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setAccount(""); setPassword(""); setNickname(""); setConfirmPwd(""); }}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 14, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--text-secondary)",
                border: "none",
              }}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            marginBottom: 16, padding: "8px 12px", borderRadius: 8, fontSize: 13,
            background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--up)",
          }}>
            {error}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="昵称"
              style={{ width: "100%", marginBottom: 12, fontSize: 14 }}
            />
          )}
          <input
            className="input"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="手机号或邮箱"
            style={{ width: "100%", marginBottom: 12, fontSize: 14 }}
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            style={{ width: "100%", marginBottom: mode === "register" ? 12 : 20, fontSize: 14 }}
          />
          {mode === "register" && (
            <input
              className="input"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="确认密码"
              style={{ width: "100%", marginBottom: 20, fontSize: 14 }}
            />
          )}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !account.trim() || !password.trim()}
            style={{ width: "100%", padding: "12px 0", fontSize: 15 }}
          >
            {loading ? (mode === "login" ? "登录中..." : "注册中...") : mode === "login" ? "登 录" : "注 册"}
          </button>
        </form>

        {/* 底部提示 */}
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 16, marginBottom: 0 }}>
          {mode === "login" ? "还没有账号？" : "已有账号？"}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setAccount(""); setPassword(""); setNickname(""); setConfirmPwd(""); }}
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, padding: 0 }}
          >
            {mode === "login" ? "立即注册" : "去登录"}
          </button>
        </p>
      </div>
    </div>
  );
}
