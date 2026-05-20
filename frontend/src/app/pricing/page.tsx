"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plan, subscriptionApi, getUser, getToken } from "@/lib/api";
import UserMenu from "@/components/UserMenu";
import SubscriptionModal from "@/components/SubscriptionModal";

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [currentPlanCode, setCurrentPlanCode] = useState<string | null>(null);

  useEffect(() => {
    subscriptionApi.getPlans().then(setPlans).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    subscriptionApi.getMySubscription().then((data) => {
      if (data.has_subscription && data.subscription?.plan) {
        setCurrentPlanCode(data.subscription.plan.code);
      }
    }).catch(() => {});
  }, []);

  const getPrice = (plan: Plan) =>
    billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;

  const handleSubscribe = (plan: Plan) => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    setSelectedPlan(plan);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <header className="glass" style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 12px", display: "flex", alignItems: "center", height: 60, justifyContent: "space-between", flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
            }}>A</div>
            <h1 style={{ fontSize: 16, fontWeight: 700 }}>
              <span className="gradient-text">StockAI</span>
              <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>交易指导助手</span>
            </h1>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/stock-analysis" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>返回分析</Link>
            {getUser() && <UserMenu />}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px 48px 20px" }}>
        {/* 标题 */}
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
            <span className="gradient-text">选择适合你的套餐</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 500, margin: "0 auto" }}>
            AI 驱动的 A 股分析，帮你做出更明智的交易决策
          </p>
        </div>

        {/* 月付/年付切换 */}
        <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                style={{
                  padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                  background: billingCycle === cycle ? "var(--accent)" : "transparent",
                  color: billingCycle === cycle ? "#fff" : "var(--text-secondary)",
                  border: "none", position: "relative",
                }}
              >
                {cycle === "monthly" ? "月付" : "年付"}
                {cycle === "yearly" && (
                  <span style={{
                    position: "absolute", top: -8, right: -8, fontSize: 10, fontWeight: 700,
                    background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff",
                    padding: "2px 6px", borderRadius: 4,
                  }}>省2个月</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 套餐卡片 */}
        {loading ? (
          <div style={{ display: "grid", gap: 24, maxWidth: 900, margin: "0 auto" }} className="grid-responsive-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card skeleton" style={{ height: 380 }} />
            ))}
          </div>
        ) : (
          <div className="animate-fade-in-up grid-responsive-3" style={{ display: "grid", gap: 24, maxWidth: 900, margin: "0 auto" }}>
            {plans.map((plan) => {
              const isCurrent = currentPlanCode === plan.code;
              const isPopular = plan.code === "pro";
              const price = getPrice(plan);

              return (
                <div
                  key={plan.id}
                  className="card animate-fade-in"
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    borderColor: isPopular ? "var(--accent)" : undefined,
                    boxShadow: isPopular ? "0 0 30px var(--accent-glow)" : undefined,
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  {isPopular && (
                    <div style={{
                      background: "linear-gradient(135deg, var(--accent), #7c3aed)",
                      color: "#fff", textAlign: "center", padding: "6px 0",
                      fontSize: 12, fontWeight: 700, letterSpacing: 1,
                    }}>
                      最受欢迎
                    </div>
                  )}
                  <div style={{ padding: isPopular ? "24px 24px 0" : "28px 24px 0", flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, minHeight: 36 }}>{plan.description}</p>

                    <div style={{ marginBottom: 24 }}>
                      {price === 0 ? (
                        <span style={{ fontSize: 36, fontWeight: 800 }}>免费</span>
                      ) : (
                        <>
                          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>¥</span>
                          <span style={{ fontSize: 40, fontWeight: 800 }}>{price}</span>
                          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>/{billingCycle === "monthly" ? "月" : "年"}</span>
                        </>
                      )}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                          <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 14 }}>✓</span>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: "0 24px 24px" }}>
                    {isCurrent ? (
                      <button className="btn btn-outline" disabled style={{ width: "100%" }}>当前套餐</button>
                    ) : price === 0 ? (
                      <Link href="/stock-analysis" style={{ display: "block" }}>
                        <button className="btn btn-outline" style={{ width: "100%" }}>开始使用</button>
                      </Link>
                    ) : (
                      <button className="btn btn-primary" onClick={() => handleSubscribe(plan)} style={{ width: "100%" }}>
                        立即订阅
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 功能对比表 */}
        <div className="animate-fade-in-up" style={{ marginTop: 64, maxWidth: 900, margin: "64px auto 0" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>
            <span className="gradient-text">功能对比</span>
          </h3>
          <div className="card table-wrapper" style={{ overflow: "hidden" }}>
            <div className="table-wrapper">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["功能", "免费版", "专业版", "旗舰版"].map((h) => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: h === "功能" ? "left" : "center", color: h === "功能" ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: 700, background: h !== "功能" ? "rgba(99, 102, 241, 0.05)" : "transparent" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["AI 分析次数", "3次/天", "无限制", "无限制"],
                  ["可用模型", "千问", "千问/DeepSeek/Gemini", "千问/DeepSeek/Gemini"],
                  ["技术指标", "基础", "深度", "深度 + 自定义"],
                  ["热门推荐", "✓", "✓ + 行业洞察", "✓ + 行业洞察"],
                  ["AI 联网搜索", "✗", "✓", "✓"],
                  ["分析优先级", "普通", "普通", "优先"],
                  ["专属客服", "✗", "✗", "✓"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < 6 ? "1px solid rgba(42, 53, 72, 0.5)" : "none" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{
                        padding: "12px 20px",
                        textAlign: j === 0 ? "left" : "center",
                        color: j === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: j === 0 ? 600 : 400,
                      }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </main>

      {selectedPlan && (
        <SubscriptionModal
          planCode={selectedPlan.code}
          planName={selectedPlan.name}
          billingCycle={billingCycle}
          price={getPrice(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            setCurrentPlanCode(selectedPlan.code);
          }}
        />
      )}
    </div>
  );
}
