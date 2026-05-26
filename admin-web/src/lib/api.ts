const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request(url: string, options?: RequestInit) {
  const token = localStorage.getItem("admin_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchUrl = `${API_BASE}${url}`;
  console.log('[api] request:', fetchUrl);

  let res;
  try {
    res = await fetch(fetchUrl, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });
  } catch (e: any) {
    console.error('[api] fetch failed:', e.message);
    throw new Error(`网络请求失败: ${e.message}`);
  }

  if (!res.ok) {
    console.error('[api] error response:', res.status, res.statusText);
    if (res.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail || "请求失败");
  }
  return res.json();
}

export interface PlanInput {
  name: string;
  code: string;
  price_monthly: number;
  price_yearly: number;
  description?: string;
  features: string[];
  ai_calls_per_day: number;
  max_models: number;
  priority: number;
  is_active?: boolean;
}

export interface AdminPlan {
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
  is_active: boolean;
  created_at: string;
}

export interface UserInfo {
  id: number;
  account: string;
  nickname: string;
  created_at: string;
  updated_at: string | null;
  last_login: string | null;
}

export interface AdminInfo {
  id: number;
  account: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const adminApi = {
  // 认证
  login: (account: string, password: string) =>
    request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ account, password }),
    }) as Promise<{ token: string; account: string; role: string }>,

  getMyInfo: () => request("/api/admin/me") as Promise<AdminInfo>,

  // 用户管理
  listUsers: (page: number, keyword: string) =>
    request(`/api/admin/users?page=${page}&page_size=20&keyword=${encodeURIComponent(keyword)}`),
  createUser: (data: { account: string; password: string; nickname: string }) =>
    request("/api/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: Partial<{ account: string; password: string; nickname: string }>) =>
    request(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request(`/api/admin/users/${id}`, { method: "DELETE" }),

  // 套餐管理
  listPlans: () => request("/api/admin/plans") as Promise<AdminPlan[]>,
  createPlan: (data: PlanInput) =>
    request("/api/admin/plans", { method: "POST", body: JSON.stringify(data) }) as Promise<AdminPlan>,
  updatePlan: (id: number, data: Partial<PlanInput>) =>
    request(`/api/admin/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }) as Promise<AdminPlan>,
  deletePlan: (id: number) =>
    request(`/api/admin/plans/${id}`, { method: "DELETE" }),

  // 用量统计
  getUsageStats: () => request("/api/admin/plans/stats"),
  getUsageByUser: (page: number) =>
    request(`/api/admin/plans/stats/users?page=${page}&page_size=20`),
};

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function isAdminLoggedIn(): boolean {
  return !!localStorage.getItem("admin_token");
}

export function logoutAdmin() {
  localStorage.removeItem("admin_token");
}
