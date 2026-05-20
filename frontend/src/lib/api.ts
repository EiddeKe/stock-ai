const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Position {
  id: number;
  symbol: string;
  name: string;
  cost_price: number;
  shares: number;
  buy_date: string;
  current_price?: number;
  profit_pct?: number;
  profit_amount?: number;
}

interface AnalysisResult {
  symbol: string;
  name: string;
  current_price: number;
  cost_price: number;
  profit_pct: number;
  suggestion: string;
  confidence: number;
  reason: string;
  risk_tip: string;
}

async function request(url: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail || "请求失败");
  }
  return res.json();
}

export const api = {
  getPositions: () => request("/api/positions") as Promise<Position[]>,
  addPosition: (data: { symbol: string; name: string; cost_price: number; shares: number }) =>
    request("/api/positions", { method: "POST", body: JSON.stringify(data) }) as Promise<Position>,
  updatePosition: (id: number, data: Partial<{ name: string; cost_price: number; shares: number }>) =>
    request(`/api/positions/${id}`, { method: "PUT", body: JSON.stringify(data) }) as Promise<Position>,
  deletePosition: (id: number) =>
    request(`/api/positions/${id}`, { method: "DELETE" }),
  analyzeAll: (model: "qwen" | "deepseek" = "qwen") =>
    request(`/api/analysis/all?model=${model}`, { method: "POST" }) as Promise<AnalysisResult[]>,
  analyzeSingle: (symbol: string, model: "qwen" | "deepseek" = "qwen") =>
    request(`/api/analysis/${symbol}?model=${model}`, { method: "POST" }) as Promise<AnalysisResult>,
  getChatHistory: (model: "qwen" | "deepseek") =>
    request(`/api/chat?model=${model}`) as Promise<{ id: number; model: string; role: string; content: string; created_at: string }[]>,
  sendChatMessage: (model: "qwen" | "deepseek", message: string, enableSearch: boolean = false) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ model, message, enable_search: enableSearch }),
    }) as Promise<{ reply: string }>,
  clearChatHistory: (model: "qwen" | "deepseek") =>
    request(`/api/chat?model=${model}`, { method: "DELETE" }),
};

export async function login(account: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail || "登录失败");
  }
  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function register(account: string, password: string, nickname: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password, nickname }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail || "注册失败");
  }
  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) as { id: number; account: string; nickname: string } : null;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}
