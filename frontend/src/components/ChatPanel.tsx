"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Props {
  model: "qwen" | "deepseek" | "gemini";
  enableSearch: boolean;
  onEnableSearchChange: (v: boolean) => void;
}

export default function ChatPanel({ model, enableSearch, onEnableSearchChange }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef(model);

  const fetchHistory = useCallback(async (m: "qwen" | "deepseek" | "gemini") => {
    try {
      const data = await api.getChatHistory(m);
      setMessages(data.map((m) => ({ ...m, role: m.role === "user" ? "user" as const : "assistant" as const })));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (model !== modelRef.current) {
      modelRef.current = model;
      fetchHistory(model);
    }
  }, [model, fetchHistory]);

  useEffect(() => {
    fetchHistory(model);
  }, [model, fetchHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    const tempUser: ChatMsg = { id: Date.now(), role: "user", content: msg, created_at: "" };
    setMessages((prev) => [...prev, tempUser]);
    try {
      const res = await api.sendChatMessage(model, msg, enableSearch);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { id: Date.now(), role: "user", content: msg, created_at: "" },
        { id: Date.now() + 1, role: "assistant", content: res.reply, created_at: "" },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { id: Date.now(), role: "user", content: msg, created_at: "" },
        { id: Date.now() + 1, role: "assistant", content: `发送失败: ${e.message}`, created_at: "" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1, overflow: "hidden",
    }}>
      {/* 对话区域 */}
      <div ref={containerRef} style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 40, color: "var(--text-muted)", fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>💬</div>
            <p>开始与 AI 交流</p>
            <p style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>询问行情走势、操作建议等</p>
          </div>
        )}
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} style={{
              display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}>
              <div style={{
                maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
                fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                background: isUser ? "var(--accent)" : "rgba(255,255,255,0.06)",
                color: isUser ? "#fff" : "var(--text-primary)",
                borderBottomRightRadius: isUser ? 4 : 12,
                borderBottomLeftRadius: isUser ? 12 : 4,
              }}>
                {m.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{
              padding: "10px 14px", borderRadius: 12, fontSize: 13,
              background: "rgba(255,255,255,0.06)", color: "var(--text-muted)",
            }}>
              <span className="loading-spinner" style={{ marginRight: 8 }} />
              {enableSearch ? "联网搜索中..." : "思考中..."}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
        {/* 联网搜索开关 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => onEnableSearchChange(!enableSearch)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 20, fontSize: 12,
              border: enableSearch ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: enableSearch ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: enableSearch ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <span style={{
              width: 28, height: 16, borderRadius: 8,
              background: enableSearch ? "var(--accent)" : "var(--border)",
              position: "relative", transition: "background 0.2s",
            }}>
              <span style={{
                position: "absolute", top: 2,
                left: enableSearch ? 14 : 2,
                width: 12, height: 12, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
              }} />
            </span>
            联网搜索
          </button>
          {enableSearch && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.7 }}>
              实时获取行情与新闻
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题... (Enter 发送)"
            rows={2}
            style={{
              flex: 1, resize: "none", fontSize: 13,
              padding: "8px 12px", lineHeight: 1.5,
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{ alignSelf: "flex-end", padding: "8px 16px", fontSize: 13 }}
          >
            {enableSearch ? "🔍 发送" : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
