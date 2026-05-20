"""AI 分析服务 - 通义千问 & DeepSeek & Gemini"""
import json
from dashscope import Generation
import dashscope
from config import DASHSCOPE_API_KEY, DEEPSEEK_API_KEY, GOOGLE_API_KEY


def build_analysis_prompt(
    symbol: str,
    name: str,
    current_price: float,
    cost_price: float,
    shares: int,
    indicators: dict,
) -> str:
    """构建统一的分析 prompt"""
    profit_pct = round((current_price - cost_price) / cost_price * 100, 2)
    profit_amount = round((current_price - cost_price) * shares, 2)

    return f"""你是一位有20年经验的A股短线交易专家。请根据以下数据给出操作建议：

【股票信息】
- 股票：{name}({symbol})
- 当前价：{current_price}
- 持仓成本：{cost_price}
- 持仓盈亏：{profit_pct}% ({profit_amount}元)
- 持股数量：{shares}

【技术指标（日线）】
- MACD: DIF={indicators.get('macd_dif', 'N/A')}, DEA={indicators.get('macd_dea', 'N/A')}, 柱={indicators.get('macd_hist', 'N/A')}
- KDJ: K={indicators.get('kdj_k', 'N/A')}, D={indicators.get('kdj_d', 'N/A')}, J={indicators.get('kdj_j', 'N/A')}
- RSI(14): {indicators.get('rsi', 'N/A')}
- 均线: MA5={indicators.get('ma5', 'N/A')}, MA10={indicators.get('ma10', 'N/A')}, MA20={indicators.get('ma20', 'N/A')}
- 布林带: 上轨={indicators.get('boll_upper', 'N/A')}, 中轨={indicators.get('boll_mid', 'N/A')}, 下轨={indicators.get('boll_lower', 'N/A')}

【近期走势】
- 近5日涨跌：{indicators.get('trend_5d', 'N/A')}%
- 近10日涨跌：{indicators.get('trend_10d', 'N/A')}%
- 今日量比：{indicators.get('vol_ratio', 'N/A')}

请以严格的JSON格式返回（不要包含任何其他文字）：
{{
  "suggestion": "买入/加仓/持有/减仓/卖出（五选一）",
  "confidence": 0到100的整数,
  "reason": "2-3句话的简明分析理由",
  "risk_tip": "风险提示，1-2句话"
}}"""


def analyze_stock(
    symbol: str,
    name: str,
    current_price: float,
    cost_price: float,
    shares: int,
    indicators: dict,
    model: str = "qwen",
) -> dict:
    """调用 LLM 分析股票并给出建议"""
    prompt = build_analysis_prompt(symbol, name, current_price, cost_price, shares, indicators)

    if model == "deepseek":
        return _analyze_with_deepseek(prompt)
    if model == "gemini":
        return _analyze_with_gemini(prompt)
    return _analyze_with_qwen(prompt)


def _analyze_with_qwen(prompt: str) -> dict:
    """通义千问分析"""
    dashscope.api_key = DASHSCOPE_API_KEY

    try:
        response = Generation.call(
            model="qwen-max",
            messages=[
                {"role": "system", "content": "你是一位专业的A股交易分析师，擅长技术分析。请用JSON格式回答。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            result_format="message",
        )

        if response.status_code == 200:
            content = response.output.choices[0].message.content.strip()
            return _parse_json(content)
    except Exception as e:
        print(f"千问分析出错: {e}")

    return _fallback_result("AI分析（千问）接口调用失败")


def _analyze_with_deepseek(prompt: str) -> dict:
    """DeepSeek 分析（OpenAI 兼容接口）"""
    if not DEEPSEEK_API_KEY:
        return _fallback_result("未配置 DeepSeek API Key")

    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
        )
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {"role": "system", "content": "你是一位专业的A股交易分析师，擅长技术分析。请用JSON格式回答。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        content = response.choices[0].message.content.strip()
        return _parse_json(content)
    except ImportError:
        return _fallback_result("未安装 openai 库，请 pip install openai")
    except Exception as e:
        print(f"DeepSeek分析出错: {e}")
        return _fallback_result(f"DeepSeek API 调用失败: {e}")


def _analyze_with_gemini(prompt: str) -> dict:
    """Gemini 分析"""
    if not GOOGLE_API_KEY:
        return _fallback_result("未配置 Google Gemini API Key")

    try:
        from google import genai
        client = genai.Client(api_key=GOOGLE_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"role": "user", "parts": [{"text": "你是一位专业的A股交易分析师，擅长技术分析。请用JSON格式回答。"}]},
                {"role": "model", "parts": [{"text": "好的，我会用JSON格式返回分析结果。"}]},
                {"role": "user", "parts": [{"text": prompt}]},
            ],
        )
        content = response.text.strip()
        return _parse_json(content)
    except ImportError:
        return _fallback_result("未安装 google-genai 库，请 pip install google-genai")
    except Exception as e:
        print(f"Gemini分析出错: {e}")
        return _fallback_result(f"Gemini API 调用失败: {e}")


def _parse_json(content: str) -> dict:
    """从 LLM 响应中提取 JSON"""
    if "```" in content:
        content = content.split("```json")[-1].split("```")[0].strip()
    elif "{" in content:
        content = content[content.find("{"):content.rfind("}") + 1]
    return json.loads(content)


def _fallback_result(reason: str) -> dict:
    return {
        "suggestion": "持有",
        "confidence": 50,
        "reason": reason,
        "risk_tip": "技术面分析仅供参考，请结合自身判断。",
    }
