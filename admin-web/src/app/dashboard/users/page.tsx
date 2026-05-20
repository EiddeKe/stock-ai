"use client";
import { useState, useEffect, useCallback } from "react";
import { adminApi, UserInfo } from "@/lib/api";

export default function UsersPage() {
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
      const res: any = await adminApi.listUsers(page, keyword);
      setUsers(res.users);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = () => { setKeyword(searchInput); setPage(1); };
  const totalPages = Math.ceil(total / 20);

  const openCreate = () => { setEditUser(null); setFormAccount(""); setFormPassword(""); setFormNickname(""); setShowModal(true); };
  const openEdit = (u: UserInfo) => { setEditUser(u); setFormAccount(u.account); setFormPassword(""); setFormNickname(u.nickname); setShowModal(true); };

  const handleSubmit = async () => {
    setError("");
    if (!formNickname.trim()) { setError("昵称不能为空"); return; }
    if (!editUser && !formAccount.trim()) { setError("账号不能为空"); return; }
    if (!editUser && !formPassword) { setError("密码不能为空"); return; }
    try {
      if (editUser) {
        const body: Record<string, string> = { nickname: formNickname };
        if (formAccount !== editUser.account) body.account = formAccount;
        if (formPassword) body.password = formPassword;
        await adminApi.updateUser(editUser.id, body);
      } else {
        await adminApi.createUser({ account: formAccount, password: formPassword, nickname: formNickname });
      }
      setShowModal(false);
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (u: UserInfo) => {
    if (!confirm(`确认删除用户「${u.nickname}」？该用户的持仓和对话记录也会被删除。`)) return;
    try { await adminApi.deleteUser(u.id); fetchUsers(); } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>用户管理</h2>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>管理系统中的所有注册用户</p>

      <div className="animate-fade-in" style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <input className="input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="搜索账号或昵称..." style={{ width: 260, fontSize: 14, padding: "8px 12px" }} />
          <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
          {keyword && <button className="btn btn-outline" onClick={() => { setKeyword(""); setSearchInput(""); setPage(1); }}>清除</button>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>共 {total} 个用户</span>
          <button className="btn btn-success" onClick={openCreate}>＋ 新增用户</button>
        </div>
      </div>

      {error && <div className="animate-fade-in" style={{ marginBottom: 20, padding: "8px 12px", borderRadius: 8, fontSize: 13, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--up)" }}>{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>加载中...</div>
      ) : users.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>暂无用户数据</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ID", "账号", "昵称", "注册时间", "操作"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 4 ? "right" : "left", padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
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
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px", borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-outline" onClick={() => setPage(page - 1)} disabled={page <= 1} style={{ fontSize: 13, padding: "6px 14px" }}>上一页</button>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{page} / {totalPages}</span>
              <button className="btn btn-outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages} style={{ fontSize: 13, padding: "6px 14px" }}>下一页</button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(false)}>
          <div className="card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ width: 400, padding: 32, background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editUser ? "编辑用户" : "新增用户"}</h3>
            <div style={{ display: "grid", gap: 16 }}>
              {!editUser && <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>账号</label><input className="input" value={formAccount} onChange={(e) => setFormAccount(e.target.value)} placeholder="手机号或邮箱" /></div>}
              <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>昵称</label><input className="input" value={formNickname} onChange={(e) => setFormNickname(e.target.value)} placeholder="用户昵称" /></div>
              <div><label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>密码{editUser ? "（留空不修改）" : ""}</label><input className="input" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder={editUser ? "留空不修改" : "至少 6 位"} /></div>
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
