"use client";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* 顶部导航 */}
      <header className="glass" style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 20px",
          display: "flex", alignItems: "center", height: 60,
        }}>
          <a href="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            textDecoration: "none", color: "inherit",
          }}>
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
          </a>
        </div>
      </header>

      {/* 内容区 */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          <span className="gradient-text">用户协议</span>
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 40 }}>最后更新日期：2026年5月20日</p>

        <div style={{ lineHeight: 1.8, color: "var(--text-secondary)", fontSize: 15 }}>
          <Section title="一、协议的接受">
            <p>欢迎您使用 StockAI 交易指导助手（以下简称"本平台"）。本平台由运营方独立提供。当您注册、登录或使用本平台服务时，即表示您已阅读、理解并同意接受本协议的全部内容。如果您不同意本协议的任何内容，请立即停止使用本平台服务。</p>
          </Section>

          <Section title="二、服务说明">
            <p>2.1 本平台基于 AI 大模型技术，为用户提供股票行情分析、技术面解读及操作建议参考。</p>
            <p>2.2 本平台<strong style={{ color: "var(--text-primary)" }}>不提供</strong>任何股票交易操作功能，用户无法通过本平台进行买卖下单。</p>
            <p>2.3 本平台提供的 AI 分析结果（包括但不限于"买入""卖出""加仓""减仓""持有"等建议）仅由人工智能算法基于输入的技术指标和市场数据生成，<strong style={{ color: "var(--up)" }}>不构成任何投资建议或投资咨询意见</strong>。</p>
          </Section>

          <Section title="三、投资风险提示" highlight>
            <p><strong>⚠ 重要声明 — 请仔细阅读以下内容：</strong></p>
            <p>3.1 AI 生成的分析内容（包括操作建议、价格预测、风险评估等）基于公开市场数据和技术指标，<strong>不具有证券投资咨询资质</strong>，仅供参考用途。</p>
            <p>3.2 本平台及运营方<strong>不具备</strong>中国证监会核发的证券投资咨询业务资格，本平台的任何分析内容<strong>不应被理解为</strong>任何形式的投资建议。</p>
            <p>3.3 您应独立判断 AI 输出内容的参考价值，结合自身风险承受能力、投资经验和市场情况做出决策。</p>
            <p>3.4 <strong>平台不对任何因使用本平台服务而产生的投资盈亏承担法律责任或经济赔偿</strong>，包括但不限于：</p>
            <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
              <li>因采纳 AI 建议导致的投资亏损</li>
              <li>因数据延迟、模型误差产生的决策偏差</li>
              <li>因系统故障、网络中断造成的信息缺失</li>
              <li>因市场极端行情导致的分析结果偏离</li>
            </ul>
            <p>3.5 股市投资有风险，入市需谨慎。过去的市场表现不代表未来走势，AI 分析结果同样不保证准确性或适用性。</p>
          </Section>

          <Section title="四、用户注册与账号">
            <p>4.1 您需要提供真实有效的手机号或邮箱进行注册，并确保账号信息的准确性和及时性。</p>
            <p>4.2 您应妥善保管账号和密码，对账号下的所有操作行为承担责任。</p>
            <p>4.3 本平台不对因用户自身原因（如密码泄露、账号被盗等）导致的损失承担责任。</p>
          </Section>

          <Section title="五、服务使用规范">
            <p>5.1 您不得利用本平台从事任何违反中国法律法规的行为。</p>
            <p>5.2 您不得对本平台进行反向工程、反编译、爬虫抓取或其他未经授权的技术操作。</p>
            <p>5.3 您不得滥用本平台服务（如高频恶意请求、利用系统漏洞等），否则本平台有权限制或终止您的服务权限。</p>
          </Section>

          <Section title="六、知识产权">
            <p>6.1 本平台的所有内容（包括但不限于软件、代码、设计、文字、图片、数据等）均受知识产权法保护。</p>
            <p>6.2 未经本平台运营方书面许可，您不得复制、修改、传播、展示或以其他形式使用本平台的内容。</p>
          </Section>

          <Section title="七、隐私保护">
            <p>7.1 本平台重视用户隐私保护。关于数据收集、使用和保护的具体内容，请参阅我们的 <a href="/privacy" style={{ color: "var(--accent)" }}>《隐私政策》</a>。</p>
          </Section>

          <Section title="八、免责条款">
            <p>8.1 本平台按"现状"提供服务，不保证服务 uninterrupted 或完全无错误。</p>
            <p>8.2 本平台对因不可抗力（如自然灾害、网络故障、政府行为等）造成的服务中断不承担责任。</p>
            <p>8.3 本平台有权随时修改、暂停或终止服务，无需事先通知用户。</p>
          </Section>

          <Section title="九、协议变更">
            <p>本平台有权根据国家法律法规变化或业务发展需要修改本协议。修改后的协议将在本平台公布，并自公布之日起生效。继续使用本平台服务即视为接受修改后的协议。</p>
          </Section>

          <Section title="十、争议解决">
            <p>因本协议引起的或与本协议有关的任何争议，双方应友好协商解决；协商不成的，任何一方均可向本平台运营方所在地有管辖权的人民法院提起诉讼。</p>
          </Section>

          <Section title="十一、联系方式">
            <p>如您对本协议有任何疑问或意见，请通过平台反馈渠道联系我们。</p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, highlight, children }: {
  title: string; highlight?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{
      marginBottom: 32, padding: highlight ? "20px 24px" : 0,
      borderRadius: highlight ? 12 : 0,
      background: highlight ? "rgba(245, 158, 11, 0.05)" : "transparent",
      border: highlight ? "1px solid rgba(245, 158, 11, 0.15)" : "none",
    }}>
      <h2 style={{
        fontSize: 18, fontWeight: 600, marginBottom: 16,
        color: highlight ? "#f59e0b" : "var(--text-primary)",
      }}>{title}</h2>
      {children}
    </div>
  );
}
