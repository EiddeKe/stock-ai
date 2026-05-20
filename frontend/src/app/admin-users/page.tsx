"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = "admin123";

interface UserInfo {
  id: number;
  account: string;
  nickname: string;
  created_at: string;
  updated_at: string | null;
}

interface ListResponse {
  total: number;
  users: UserInfo[];
}

async function adminRequest(url: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail || "请求失败");
  }
  return res.json();
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserInfo | null>(null);
  const [formAccount, setFormAccount] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res: ListResponse = await adminRequest(
        `/api/admin/users?page=${page}&page_size=20&keyword=${encodeURIComponent(keyword)}`
      );
      setUsers(res.users);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
  };

  const handleDelete = async (user: UserInfo) => {
    if (!confirm(`确认删除用户「${user.nickname}」？该用户的持仓和对话记录也会被删除。`)) return;
    try {
      await adminRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openCreate = () => {
    setEditUser(null);
    setFormAccount("");
    setFormPassword("");
    setFormNickname("");
    setShowModal(true);
  };

  const openEdit = (user: UserInfo) => {
    setEditUser(user);
    setFormAccount(user.account);
    setFormPassword("");
    setFormNickname(user.nickname);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setError("");
    if (!formNickname.trim()) {
      setError("昵称不能为空");
      return;
    }
    if (!editUser && !formAccount.trim()) {
      setError("账号不能为空");
      return;
    }
    if (!editUser && !formPassword) {
      setError("密码不能为空");
      return;
    }

    try {
      if (editUser) {
        const body: Record<string, string> = { nickname: formNickname };
        if (formAccount !== editUser.account) body.account = formAccount;
        if (formPassword) body.password = formPassword;
        await adminRequest(`/api/admin/users/${editUser.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await adminRequest("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({ account: formAccount, password: formPassword, nickname: formNickname }),
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* 顶部导航 */}
      <header className="glass" style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
            }}>A</div>
            <h1 style={{ fontSize: 16, fontWeight: 700, cursor: "pointer" }} onClick={() => router.push("/")}>
              <span className="gradient-text">StockAI</span>
              <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>用户管理</span>
            </h1>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            <a href="/" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: "transparent", color: "var(--text-secondary)", textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>首页</a>
            <a href="/stock-analysis" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: "transparent", color: "var(--text-secondary)", textDecoration: "none" }}>持仓分析</a>
            <a href="/stock-analysis?tab=recommendations" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: "transparent", color: "var(--text-secondary)", textDecoration: "none" }}>热门推荐</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        {/* 操作栏 */}
        <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              className="input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜索账号或昵称..."
              style={{ width: 260, fontSize: 14, padding: "8px 12px" }}
            />
            <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
            {keyword && (
              <button className="btn btn-outline" onClick={() => { setKeyword(""); setSearchInput(""); setPage(1); }}>清除</button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>共 {total} 个用户</span>
            <button className="btn btn-success" onClick={openCreate}>＋ 新增用户</button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="animate-fade-in" style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 10,
            background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--up)", fontSize: 14,
          }}>{error}</div>
        )}

        {/* 表格 */}
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>加载中...</div>
        ) : users.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            暂无用户数据
          </div>
        ) : (
          <div className="card table-wrapper" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrapper">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>ID</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>账号</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>昵称</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>注册时间</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{u.id}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 500 }}>{u.account}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-primary)" }}>{u.nickname}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>{u.created_at}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button onClick={() => openEdit(u)} style={{ marginRight: 8, fontSize: 13, padding: "4px 12px", borderRadius: 6, cursor: "pointer", background: "var(--accent)", color: "#fff", border: "none" }}>编辑</button>
                      <button onClick={() => handleDelete(u)} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 6, cursor: "pointer", background: "rgba(239, 68, 68, 0.15)", color: "var(--up)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px", borderTop: "1px solid var(--border)" }}>
                <button className="btn btn-outline" onClick={() => setPage(page - 1)} disabled={page <= 1} style={{ fontSize: 13, padding: "6px 14px" }}>上一页</button>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{page} / {totalPages}</span>
                <button className="btn btn-outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages} style={{ fontSize: 13, padding: "6px 14px" }}>下一页</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowModal(false)}>
          <div className="card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
            width: "calc(100% - 32px)", maxWidth: 400, padding: 32, background: "var(--bg-secondary)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {editUser ? "编辑用户" : "新增用户"}
            </h3>
            <div style={{ display: "grid", gap: 16 }}>
              {!editUser && (
                <div>
                  <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>账号（手机号/邮箱）</label>
                  <input className="input" value={formAccount} onChange={(e) => setFormAccount(e.target.value)} placeholder="13800138000 或 user@example.com" />
                </div>
              )}
              <div>
                <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>昵称</label>
                <input className="input" value={formNickname} onChange={(e) => setFormNickname(e.target.value)} placeholder="用户昵称" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                  密码{editUser ? "（留空不修改）" : ""}
                </label>
                <input className="input" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder={editUser ? "留空不修改" : "至少 6 位"} />
              </div>
              {error && <span style={{ fontSize: 13, color: "var(--up)" }}>{error}</span>}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleSubmit}>{editUser ? "保存" : "创建"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
