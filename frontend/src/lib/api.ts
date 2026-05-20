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
  analyzeAll: (model: "qwen" | "deepseek" | "gemini" = "qwen") =>
    request(`/api/analysis/all?model=${model}`, { method: "POST" }) as Promise<AnalysisResult[]>,
  analyzeSingle: (symbol: string, model: "qwen" | "deepseek" | "gemini" = "qwen") =>
    request(`/api/analysis/${symbol}?model=${model}`, { method: "POST" }) as Promise<AnalysisResult>,
  getChatHistory: (model: "qwen" | "deepseek" | "gemini") =>
    request(`/api/chat?model=${model}`) as Promise<{ id: number; model: string; role: string; content: string; created_at: string }[]>,
  sendChatMessage: (model: "qwen" | "deepseek" | "gemini", message: string, enableSearch: boolean = false) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ model, message, enable_search: enableSearch }),
    }) as Promise<{ reply: string }>,
  clearChatHistory: (model: "qwen" | "deepseek" | "gemini") =>
    request(`/api/chat?model=${model}`, { method: "DELETE" }),
};

// 流式发送消息
export function sendChatMessageStream(
  model: "qwen" | "deepseek" | "gemini",
  message: string,
  enableSearch: boolean,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): AbortController {
  const controller = new AbortController();
  const token = getToken();

  fetch(`/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ model, message, enable_search: enableSearch }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "请求失败" }));
        onError(err.detail || "请求失败");
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) { onError("浏览器不支持流式响应"); return; }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) { onError(data.content); return; }
            if (data.done) { onDone(); return; }
            if (data.content) onChunk(data.content);
          } catch {}
        }
      }
    })
    .catch((e) => {
      if (e.name !== "AbortError") onError(e.message);
    });

  return controller;
}

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

export async function register(account: string, password: string, nickname: string, agreeTerms: boolean) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password, nickname, agree_terms: agreeTerms }),
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
  return raw ? JSON.parse(raw) as { id: number; account: string; nickname: string; investment_style?: string | null } : null;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

// 记录同意协议
export async function agreeTermsApi() {
  const token = getToken();
  await fetch(`${API_BASE}/api/auth/me/agree-terms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

// 获取用户信息（含协议同意状态）
export async function fetchMe() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("获取用户信息失败");
  return res.json() as Promise<{ id: number; account: string; nickname: string; agreed_terms_at: string | null; investment_style: string | null }>;
}

// 获取投资风格
export async function getInvestmentStyle(): Promise<string | null> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/auth/me/investment-style`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.investment_style as string | null;
}

// 设置投资风格
export async function setInvestmentStyle(style: "short_term" | "long_term") {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/auth/me/investment-style`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ investment_style: style }),
  });
  if (!res.ok) throw new Error("保存投资风格失败");
  return res.json();
}

// --- 订阅相关 ---

export interface Plan {
  id: number;
  name: string;
  code: string;
  price_monthly: number;
  price_yearly: number;
  description: string | null;
  features: string[];
  ai_calls_per_day: number;
  max_models: number;
  priority: number;
}

export interface SubscriptionInfo {
  has_subscription: boolean;
  subscription: {
    id: number;
    plan: { id: number; name: string; code: string; ai_calls_per_day: number; max_models: number } | null;
    status: string;
    start_at: string;
    expire_at: string;
    amount_paid: number;
    auto_renew: boolean;
  } | null;
}

export interface UsageStats {
  today_calls: number;
  daily_limit: number;
  is_limited: boolean;
  remaining: number;
  plan_name: string;
  plan_code: string;
}

export const subscriptionApi = {
  getPlans: () => request("/api/subscription/plans") as Promise<Plan[]>,
  getMySubscription: () => request("/api/subscription") as Promise<SubscriptionInfo>,
  activateSubscription: (planCode: string, billingCycle: "monthly" | "yearly") =>
    request("/api/subscription/activate", {
      method: "POST",
      body: JSON.stringify({ plan_code: planCode, billing_cycle: billingCycle }),
    }),
  getUsage: () => request("/api/subscription/usage") as Promise<UsageStats>,
};

// --- 环境信息 ---
export async function getEnvInfo(): Promise<{ env: string; database_type: string; is_prod: boolean }> {
  const res = await fetch(`${API_BASE}/api/env`);
  if (!res.ok) return { env: "unknown", database_type: "unknown", is_prod: false };
  return res.json();
}
