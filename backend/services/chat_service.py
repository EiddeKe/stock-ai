"""AI 对话服务 — 支持千问/DeepSeek/Gemini 多轮对话 + 联网搜索"""
import json
import time
import requests
from config import DASHSCOPE_API_KEY, DEEPSEEK_API_KEY, GOOGLE_API_KEY
from dashscope import Generation


SYSTEM_PROMPT = """你是一位拥有 20 年经验的 A 股交易高手，精通技术指标分析（MACD/KDJ/RSI/布林带/均线等）和行业资讯解读。你每天与用户交流持仓股票的行情走势，给出操作建议。用户正在与你进行持续对话，请结合上下文回答问题。"""


def search_latest_news(symbols: list[str], names: list[str]) -> str:
    """获取持仓股票的最新资讯（通过 Sina/腾讯财经）"""
    news_parts = []
    for symbol, name in zip(symbols, names):
        try:
            # 从新浪财经获取个股新闻
            url = f"https://news.finance.sina.com.cn/stock/search?query={symbol}"
            r = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                "Referer": "https://finance.sina.com.cn",
            }, timeout=5)
            # 解析 HTML 中的新闻标题
            import re
            pattern = r'<a[^>]*href="[^"]*"[^>]*>(.*?)</a>'
            matches = re.findall(pattern, r.text)
            titles = []
            for m in matches:
                clean = re.sub(r'<[^>]+>', '', m).strip()
                if clean and 5 < len(clean) < 100 and symbol in clean or name in clean:
                    titles.append(clean)
            if titles:
                news_parts.append(f"【{name}({symbol}) 最新资讯】\n" + "\n".join(f"- {t}" for t in titles[:3]))
        except Exception:
            pass
    return "\n".join(news_parts) if news_parts else ""


def get_realtime_market_context(positions: list[dict]) -> str:
    """获取持仓的详细实时行情上下文（用于 DeepSeek 联网模式）"""
    lines = []
    for p in positions:
        try:
            from services.quote_service import get_realtime_quote, get_daily_kline
            from services.indicator_service import calc_indicators
            quote = get_realtime_quote(p["symbol"])
            if quote:
                current = quote["current_price"]
                change = quote.get("change_pct", 0)
                lines.append(
                    f"{p['name']}({p['symbol']}): 现价 {current}, "
                    f"今日涨跌 {change:+.2f}%, "
                    f"成本 {p['cost_price']}, 盈亏 {((current - p['cost_price']) / p['cost_price'] * 100):+.2f}%, "
                    f"持有 {p['shares']} 股"
                )
                # 获取技术指标
                kline = get_daily_kline(p["symbol"])
                indicators = calc_indicators(kline)
                if indicators:
                    lines.append(
                        f"  技术指标: MACD DIF={indicators.get('macd_dif','--')}, "
                        f"RSI={indicators.get('rsi','--')}"
                    )
        except Exception as e:
            lines.append(f"{p['name']}({p['symbol']}): 行情获取失败 ({e})")
    return "\n".join(lines)


def build_chat_messages(
    positions_context: str,
    history: list[dict],
    user_message: str,
    search_context: str = "",
) -> list[dict]:
    """构建对话消息列表"""
    system = SYSTEM_PROMPT + f"\n\n【用户当前持仓】\n{positions_context}"
    if search_context:
        system += f"\n\n【实时搜索资讯】\n{search_context}"
    messages = [{"role": "system", "content": system}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages


def _chat_with_qwen(messages: list[dict], enable_search: bool = False) -> str:
    try:
        import dashscope
        dashscope.api_key = DASHSCOPE_API_KEY
        kwargs = {
            "model": "qwen-max",
            "messages": messages,
            "temperature": 0.7,
            "result_format": "message",
        }
        if enable_search:
            kwargs["enable_search"] = True
        response = Generation.call(**kwargs)
        if response.status_code == 200:
            return response.output.choices[0].message.content.strip()
    except Exception as e:
        print(f"千问对话失败: {e}")
    return "抱歉，千问暂时无法回复，请稍后再试。"


def _chat_with_deepseek(messages: list[dict], search_context: str = "") -> str:
    if not DEEPSEEK_API_KEY:
        return "请先配置 DEEPSEEK_API_KEY 环境变量。"
    try:
        from openai import OpenAI
        client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        # 有搜索上下文时，更新 system prompt
        if search_context:
            messages = list(messages)
            messages[0] = {
                "role": "system",
                "content": messages[0]["content"] + f"\n\n【实时搜索资讯】\n{search_context}",
            }
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=messages,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except ImportError:
        return "请先安装 openai 包: pip install openai"
    except Exception as e:
        print(f"DeepSeek 对话失败: {e}")
        return "抱歉，DeepSeek 暂时无法回复，请稍后再试。"


def _chat_with_gemini(messages: list[dict], search_context: str = "") -> str:
    if not GOOGLE_API_KEY:
        return "请先配置 GOOGLE_API_KEY 环境变量。"
    try:
        from google import genai
        client = genai.Client(api_key=GOOGLE_API_KEY)

        # 将 OpenAI 风格消息转为 Gemini 格式
        contents = []
        system_text = messages[0]["content"] if messages else ""
        if search_context:
            system_text += f"\n\n【实时搜索资讯】\n{search_context}"
        if system_text:
            contents.append({"role": "user", "parts": [{"text": system_text}]})
            contents.append({"role": "model", "parts": [{"text": "好的，我会结合上下文进行回答。"}]})

        for m in messages[1:]:
            contents.append({
                "role": "user" if m["role"] == "user" else "model",
                "parts": [{"text": m["content"]}],
            })

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
        )
        return response.text.strip()
    except ImportError:
        return "请先安装 google-genai 包: pip install google-genai"
    except Exception as e:
        print(f"Gemini 对话失败: {e}")
        return "抱歉，Gemini 暂时无法回复，请稍后再试。"


def chat(
    model: str,
    positions_context: str,
    history: list[dict],
    user_message: str,
    enable_search: bool = False,
    positions: list[dict] = None,
) -> str:
    """发起一轮对话"""
    search_context = ""
    if enable_search and positions:
        # 联网模式：获取实时资讯
        symbols = [p["symbol"] for p in positions]
        names = [p["name"] for p in positions]
        search_context = get_realtime_market_context(positions)

    if model == "deepseek":
        return _chat_with_deepseek(
            build_chat_messages(positions_context, history, user_message, search_context),
            search_context,
        )
    if model == "gemini":
        return _chat_with_gemini(
            build_chat_messages(positions_context, history, user_message, search_context),
            search_context,
        )
    return _chat_with_qwen(
        build_chat_messages(positions_context, history, user_message, search_context),
        enable_search=enable_search,
    )
