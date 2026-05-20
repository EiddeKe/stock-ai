"use client";

export default function PrivacyPage() {
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
          <span className="gradient-text">隐私政策</span>
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 40 }}>最后更新日期：2026年5月20日</p>

        <div style={{ lineHeight: 1.8, color: "var(--text-secondary)", fontSize: 15 }}>
          <Section title="一、引言">
            <p>我们非常重视您的隐私。本政策旨在帮助您了解我们如何收集、使用、存储和保护您的个人信息，以及您享有的权利。请您在使用本平台前仔细阅读本政策。</p>
          </Section>

          <Section title="二、我们收集的信息">
            <SubSection title="2.1 注册信息">
              <p>当您注册本平台时，我们收集以下信息：</p>
              <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
                <li><strong>手机号或邮箱</strong>：用于账号创建和身份验证</li>
                <li><strong>昵称</strong>：用于平台展示和个性化服务</li>
                <li><strong>密码</strong>：加密存储后用于身份验证，我们不保存明文密码</li>
              </ul>
            </SubSection>

            <SubSection title="2.2 持仓信息">
              <p>当您使用持仓分析功能时，我们收集以下信息：</p>
              <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
                <li><strong>股票代码和名称</strong>：用于查询实时行情</li>
                <li><strong>买入成本价和数量</strong>：用于计算盈亏和生成分析建议</li>
                <li><strong>买入日期</strong>：用于持仓时长统计</li>
              </ul>
            </SubSection>

            <SubSection title="2.3 使用记录">
              <p>当您使用 AI 分析或对话功能时，我们收集以下信息：</p>
              <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
                <li><strong>AI 模型名称</strong>：记录您使用的模型（千问、DeepSeek、Gemini）</li>
                <li><strong>操作类型</strong>：分析或对话</li>
                <li><strong>Token 消耗和成本</strong>：用于用量统计和预算控制</li>
                <li><strong>对话内容</strong>：您发送的消息及 AI 回复内容，保存在对话历史中</li>
              </ul>
            </SubSection>

            <SubSection title="2.4 技术信息">
              <p>在您使用本平台时，我们自动收集以下技术信息：</p>
              <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
                <li><strong>IP 地址</strong>：用于安全防护和限流</li>
                <li><strong>请求时间和频率</strong>：用于限流控制</li>
                <li><strong>浏览器和设备信息</strong>：用于优化前端兼容性</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="三、我们如何使用信息">
            <p>我们使用收集的个人信息用于以下目的：</p>
            <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
              <li>提供、维护和优化本平台服务</li>
              <li>验证用户身份，保障账号安全</li>
              <li>生成 AI 股票分析建议和对话回复</li>
              <li>用量统计、计费、预算管理和安全风控</li>
              <li>响应您的咨询和反馈</li>
              <li>遵守适用法律法规的要求</li>
            </ul>
          </Section>

          <Section title="四、信息共享与第三方服务" highlight>
            <p><strong>重要告知 — 关于数据向第三方 AI 服务的传输：</strong></p>
            <p>4.1 当您使用 AI 分析或对话功能时，您输入的以下信息将被发送至第三方 AI 服务提供商的服务器：</p>
            <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
              <li>您的持仓信息（股票代码、名称、成本价、数量）</li>
              <li>您发送的对话消息</li>
              <li>AI 对话上下文（最近的对话历史）</li>
            </ul>
            <p>4.2 本平台使用的第三方 AI 服务包括：</p>
            <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
              <li><strong>阿里云 DashScope（通义千问）</strong>：数据处理受阿里云服务条款约束</li>
              <li><strong>OpenAI 兼容接口（DeepSeek）</strong>：数据发送至 DeepSeek 服务器</li>
              <li><strong>Google Generative AI（Gemini）</strong>：数据可能传输至 Google 位于境外的服务器</li>
            </ul>
            <p>4.3 第三方 AI 服务提供商将按照其各自的隐私政策处理您的数据。我们建议您阅读各服务商的隐私政策以了解其数据处理方式。</p>
            <p>4.4 除上述 AI 服务外，我们<strong>不会</strong>将您的个人信息出售、出租或以其他方式共享给任何第三方。</p>
            <p>4.5 以下情形除外：</p>
            <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
              <li>遵守法律法规或司法/行政机关的合法要求</li>
              <li>保护本平台及用户的合法权益</li>
              <li>在合并、收购或资产转让过程中涉及的数据转移</li>
            </ul>
          </Section>

          <Section title="五、数据存储与安全">
            <p>5.1 您的个人信息存储在中国境内的服务器中。</p>
            <p>5.2 我们采用行业通用的安全措施（如 HTTPS 加密传输、密码 bcrypt 加密存储、JWT 认证令牌等）来保护您的个人信息。</p>
            <p>5.3 虽然我们采取了合理的安全措施，但无法保证信息的绝对安全。我们建议您妥善保管账号密码，定期修改密码。</p>
          </Section>

          <Section title="六、您的权利">
            <p>根据《中华人民共和国个人信息保护法》，您享有以下权利：</p>
            <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
              <li><strong>查阅权</strong>：您有权查阅我们收集的您的个人信息</li>
              <li><strong>更正权</strong>：您有权要求更正不准确或不完整的个人信息</li>
              <li><strong>删除权</strong>：在特定情形下，您有权要求删除您的个人信息</li>
              <li><strong>撤回同意权</strong>：您有权随时撤回对本政策的同意</li>
              <li><strong>注销权</strong>：您有权注销您的账号</li>
            </ul>
            <p>如您希望行使上述权利，请通过平台反馈渠道联系我们。</p>
          </Section>

          <Section title="七、未成年人保护">
            <p>本平台不向未满 18 周岁的未成年人提供服务。如果您是未成年人的监护人，发现未成年人在未经您同意的情况下使用了本平台服务，请及时与我们联系。</p>
          </Section>

          <Section title="八、政策更新">
            <p>我们可能会不时更新本政策。更新后的政策将在本平台公布，重大变更将通过显著方式（如弹窗、站内消息）通知您。继续使用本平台即表示您接受更新后的政策。</p>
          </Section>

          <Section title="九、联系我们">
            <p>如您对本政策有任何疑问或意见，请通过平台反馈渠道联系我们。我们将在合理期限内回复您的请求。</p>
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

function SubSection({ title, children }: {
  title: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>{title}</h3>
      {children}
    </div>
  );
}
