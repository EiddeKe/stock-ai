const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = "admin123";

async function request(url: string, options?: RequestInit) {
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
}

export const adminApi = {
  listUsers: (page: number, keyword: string) =>
    request(`/api/admin/users?page=${page}&page_size=20&keyword=${encodeURIComponent(keyword)}`),
  createUser: (data: { account: string; password: string; nickname: string }) =>
    request("/api/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: Partial<{ account: string; password: string; nickname: string }>) =>
    request(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request(`/api/admin/users/${id}`, { method: "DELETE" }),

  listPlans: () => request("/api/admin/plans") as Promise<AdminPlan[]>,
  createPlan: (data: PlanInput) =>
    request("/api/admin/plans", { method: "POST", body: JSON.stringify(data) }) as Promise<AdminPlan>,
  updatePlan: (id: number, data: Partial<PlanInput>) =>
    request(`/api/admin/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }) as Promise<AdminPlan>,
  deletePlan: (id: number) =>
    request(`/api/admin/plans/${id}`, { method: "DELETE" }),

  getUsageStats: () => request("/api/admin/plans/stats"),
};

export function loginAdmin(password: string): boolean {
  if (password === ADMIN_TOKEN) {
    localStorage.setItem("admin_token", ADMIN_TOKEN);
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  return !!localStorage.getItem("admin_token");
}

export function logoutAdmin() {
  localStorage.removeItem("admin_token");
}
