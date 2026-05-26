"""AI 对话服务 — 支持千问/DeepSeek/Gemini 多轮对话 + 联网搜索"""
import json
import time
import requests
from datetime import datetime
from config import DASHSCOPE_API_KEY, DEEPSEEK_API_KEY, GOOGLE_API_KEY
from dashscope import Generation


SYSTEM_PROMPT = """你是一位拥有 20 年经验的 A 股交易高手，精通技术指标分析（MACD/KDJ/RSI/布林带/均线等）和行业资讯解读。你每天与用户交流持仓股票的行情走势，给出操作建议。用户正在与你进行持续对话，请结合上下文回答问题。

注意：A 股买卖以"手"为单位，1 手 = 100 股，即买入或卖出的股数必须是 100 的整数倍。给出操作建议时请遵循此规则。"""


def get_current_time_str() -> str:
    """返回当前北京时间字符串"""
    now = datetime.now()
    return now.strftime("%Y年%m月%d日 %H:%M:%S（北京时间）")


INVESTMENT_STYLE_PROMPTS = {
    "short_term": (
        "\n\n【用户投资风格：短线交易】"
        "你是一位短线交易专家。用户偏好短线交易，关注日内波动、短期技术信号和事件驱动机会。\n"
        "- 回答时重点关注：短期买卖点、日内/周内走势判断、技术指标（MACD/KDJ/RSI）的短线信号、资金流向、消息面催化\n"
        "- 建议具体到：何时买入、何时止盈止损（给出明确价位）\n"
        "- 提醒短线风险：高波动、高换手、追高被套的风险\n"
        "- 语气直接果断，避免空泛的长期展望"
    ),
    "long_term": (
        "\n\n【用户投资风格：长线投资】"
        "你是一位价值投资和长期投资专家。用户偏好长线投资，关注公司基本面、行业趋势和长期成长空间。\n"
        "- 回答时重点关注：公司基本面分析、行业景气度、估值合理性、长期成长逻辑、政策红利\n"
        "- 建议具体到：分批建仓策略、长期持有逻辑、价值锚定（PE/PB/ROE 等）\n"
        "- 提醒长线风险：行业衰退、估值泡沫、黑天鹅事件\n"
        "- 语气稳健理性，避免鼓励追涨杀跌"
    ),
}


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
                profit_val = ((current - p["cost_price"]) / p["cost_price"] * 100) if p["cost_price"] > 0 else 0
                lines.append(
                    f"{p['name']}({p['symbol']}): 现价 {current}, "
                    f"今日涨跌 {change:+.2f}%, "
                    f"成本 {p['cost_price']}, 盈亏 {profit_val:+.2f}%, "
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


def build_market_data_table(positions: list[dict]) -> str:
    """构建格式化的实时行情数据表 — 以表格形式呈现，让模型能清晰识别为已提供的数据"""
    if not positions:
        return ""
    rows = []
    for p in positions:
        try:
            from services.quote_service import get_realtime_quote, get_daily_kline
            from services.indicator_service import calc_indicators
            quote = get_realtime_quote(p["symbol"])
            if quote:
                current = quote["current_price"]
                change = quote.get("change_pct", 0)
                open_p = quote.get("open_price", "--")
                high = quote.get("high_price", "--")
                low = quote.get("low_price", "--")
                volume = quote.get("volume", 0)
                profit_val = ((current - p["cost_price"]) / p["cost_price"] * 100) if p["cost_price"] > 0 else 0
                kline = get_daily_kline(p["symbol"])
                indicators = calc_indicators(kline)
                ma5 = indicators.get("ma5", "--")
                ma20 = indicators.get("ma20", "--")
                macd_dif = indicators.get("macd_dif", "--")
                rsi = indicators.get("rsi", "--")
                boll_upper = indicators.get("boll_upper", "--")
                boll_lower = indicators.get("boll_lower", "--")
                trend_5d = indicators.get("trend_5d", "--")
                vol_ratio = indicators.get("vol_ratio", "--")
                rows.append(f"""【{p['name']}（{p['symbol']}）】
  现价: {current} | 今日: {change:+.2f}% | 开盘: {open_p} | 最高: {high} | 最低: {low} | 成交量: {volume:.0f}手
  成本: {p['cost_price']} | 盈亏: {profit_val:+.2f}% | 持有: {p['shares']}股
  均线: MA5={ma5} MA20={ma20} | MACD-DIF={macd_dif} | RSI={rsi}
  布林带: 上轨={boll_upper} 下轨={boll_lower} | 近5日趋势: {trend_5d:+.2f}% | 量比: {vol_ratio}""")
            else:
                rows.append(f"【{p['name']}（{p['symbol']}）】行情获取失败")
        except Exception as e:
            rows.append(f"【{p['name']}（{p['symbol']}）】行情获取失败 ({e})")
    return "\n".join(rows)


def build_chat_messages(
    positions_context: str,
    history: list[dict],
    user_message: str,
    search_context: str = "",
    investment_style: str | None = None,
    market_data: str = "",
) -> list[dict]:
    """构建对话消息列表"""
    system = SYSTEM_PROMPT + f"\n\n【当前时间】{get_current_time_str()}\n\n【用户当前持仓】\n{positions_context}"
    if market_data:
        system += f"\n\n【以下为已获取的实时行情数据 — 请直接引用这些数据回答，无需要求用户提供】\n{market_data}"
    if investment_style and investment_style in INVESTMENT_STYLE_PROMPTS:
        system += INVESTMENT_STYLE_PROMPTS[investment_style]
    if search_context:
        system += f"\n\n【实时搜索资讯】\n{search_context}"
    messages = [{"role": "system", "content": system}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages


_EMPTY_TOKENS = {"input": 0, "output": 0, "total": 0}


def _chat_with_qwen(messages: list[dict], enable_search: bool = False) -> tuple[str, dict]:
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
            tokens = {"input": 0, "output": 0, "total": 0}
            try:
                tokens = {
                    "input": response.usage.input_tokens,
                    "output": response.usage.output_tokens,
                    "total": response.usage.total_tokens,
                }
            except Exception:
                pass
            return response.output.choices[0].message.content.strip(), tokens
    except Exception as e:
        print(f"千问对话失败: {e}")
    return "抱歉，千问暂时无法回复，请稍后再试。", _EMPTY_TOKENS


def _chat_with_deepseek(messages: list[dict], search_context: str = "") -> tuple[str, dict]:
    if not DEEPSEEK_API_KEY:
        return "请先配置 DEEPSEEK_API_KEY 环境变量。", _EMPTY_TOKENS
    try:
        from openai import OpenAI
        client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        if search_context:
            messages = list(messages)
            messages[0] = {
                "role": "system",
                "content": messages[0]["content"] + f"\n\n【实时搜索资讯】\n{search_context}",
            }
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            temperature=0.7,
        )
        tokens = {"input": 0, "output": 0, "total": 0}
        try:
            tokens = {
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }
        except Exception:
            pass
        return response.choices[0].message.content.strip(), tokens
    except ImportError:
        return "请先安装 openai 包: pip install openai", _EMPTY_TOKENS
    except Exception as e:
        print(f"DeepSeek 对话失败: {e}")
        return "抱歉，DeepSeek 暂时无法回复，请稍后再试。", _EMPTY_TOKENS


def _chat_with_gemini(messages: list[dict], search_context: str = "") -> tuple[str, dict]:
    if not GOOGLE_API_KEY:
        return "请先配置 GOOGLE_API_KEY 环境变量。", _EMPTY_TOKENS
    try:
        from google import genai
        client = genai.Client(api_key=GOOGLE_API_KEY)

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
        tokens = {"input": 0, "output": 0, "total": 0}
        try:
            tokens = {
                "input": response.usage_metadata.prompt_token_count,
                "output": response.usage_metadata.candidates_token_count,
                "total": response.usage_metadata.total_token_count,
            }
        except Exception:
            pass
        return response.text.strip(), tokens
    except ImportError:
        return "请先安装 google-genai 包: pip install google-genai", _EMPTY_TOKENS
    except Exception as e:
        print(f"Gemini 对话失败: {e}")
        return "抱歉，Gemini 暂时无法回复，请稍后再试。", _EMPTY_TOKENS


def chat(
    model: str,
    positions_context: str,
    history: list[dict],
    user_message: str,
    enable_search: bool = False,
    positions: list[dict] = None,
    investment_style: str | None = None,
) -> tuple[str, dict]:
    """发起一轮对话，返回 (回复文本, token信息)"""
    search_context = ""
    if enable_search and positions:
        symbols = [p["symbol"] for p in positions]
        names = [p["name"] for p in positions]
        search_context = get_realtime_market_context(positions)

    # 千问和 DeepSeek 始终注入实时行情数据（无论是否开启联网搜索）
    market_data = ""
    if model in ("qwen", "deepseek") and positions:
        market_data = build_market_data_table(positions)

    if model == "deepseek":
        return _chat_with_deepseek(
            build_chat_messages(positions_context, history, user_message, search_context, investment_style, market_data),
            search_context,
        )
    if model == "gemini":
        return _chat_with_gemini(
            build_chat_messages(positions_context, history, user_message, search_context, investment_style, market_data),
            search_context,
        )
    return _chat_with_qwen(
        build_chat_messages(positions_context, history, user_message, search_context, investment_style, market_data),
        enable_search=enable_search,
    )


# ==================== 流式输出 ====================

def chat_stream(
    model: str,
    positions_context: str,
    history: list[dict],
    user_message: str,
    enable_search: bool = False,
    positions: list[dict] = None,
    investment_style: str | None = None,
):
    """发起一轮对话，流式返回文本 chunks"""
    search_context = ""
    if enable_search and positions:
        search_context = get_realtime_market_context(positions)

    # 千问和 DeepSeek 始终注入实时行情数据（无论是否开启联网搜索）
    market_data = ""
    if model in ("qwen", "deepseek") and positions:
        market_data = build_market_data_table(positions)

    messages = build_chat_messages(
        positions_context, history, user_message, search_context, investment_style, market_data
    )

    if model == "deepseek":
        yield from _stream_deepseek(messages, search_context)
    elif model == "gemini":
        yield from _stream_gemini(messages, search_context)
    else:
        yield from _stream_qwen(messages, enable_search=enable_search)


def _stream_qwen(messages: list[dict], enable_search: bool = False):
    """千问流式对话 — DashScope 流式返回的是累积内容，需要 yield 增量 delta"""
    try:
        import dashscope
        dashscope.api_key = DASHSCOPE_API_KEY
        kwargs = {
            "model": "qwen-max",
            "messages": messages,
            "temperature": 0.7,
            "result_format": "message",
            "stream": True,
            "incremental_output": True,
        }
        if enable_search:
            kwargs["enable_search"] = True
        responses = Generation.call(**kwargs)
        for response in responses:
            if response.status_code == 200:
                try:
                    content = response.output.choices[0].message.content
                    if content:
                        yield content
                except Exception:
                    pass
    except Exception as e:
        print(f"千问流式对话失败: {e}")
        yield "抱歉，千问暂时无法回复，请稍后再试。"


def _stream_deepseek(messages: list[dict], search_context: str = ""):
    """DeepSeek 流式对话"""
    from openai import OpenAI
    if not DEEPSEEK_API_KEY:
        yield "请先配置 DEEPSEEK_API_KEY 环境变量。"
        return
    try:
        client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        if search_context:
            messages = list(messages)
            messages[0] = {
                "role": "system",
                "content": messages[0]["content"] + f"\n\n【实时搜索资讯】\n{search_context}",
            }
        stream = client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            temperature=0.7,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
    except ImportError:
        yield "请先安装 openai 包: pip install openai"
    except Exception as e:
        print(f"DeepSeek 流式对话失败: {e}")
        yield "抱歉，DeepSeek 暂时无法回复，请稍后再试。"


def _stream_gemini(messages: list[dict], search_context: str = ""):
    """Gemini 流式对话"""
    from google import genai
    if not GOOGLE_API_KEY:
        yield "请先配置 GOOGLE_API_KEY 环境变量。"
        return
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
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
        for chunk in client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=contents,
        ):
            if chunk.text:
                yield chunk.text
    except ImportError:
        yield "请先安装 google-genai 包: pip install google-genai"
    except Exception as e:
        print(f"Gemini 流式对话失败: {e}")
        yield "抱歉，Gemini 暂时无法回复，请稍后再试。"
