"""热门行业 & 股票推荐服务（基于新浪概念数据源）"""
import json
import time
import requests
from dashscope import Generation
import dashscope
from config import DASHSCOPE_API_KEY, DEEPSEEK_API_KEY, GOOGLE_API_KEY
from services.indicator_service import calc_indicators
from services.quote_service import get_daily_kline


def get_hot_sectors() -> list[dict]:
    """通过新浪概念板块 API 获取热门行业（按涨跌幅排序）"""
    for retry in range(3):
        try:
            url = "http://vip.stock.finance.sina.com.cn/q/view/newFLJK.php?param=class"
            r = requests.get(url, headers={"Referer": "http://finance.sina.com.cn"}, timeout=10)
            text = r.text.strip().rstrip(";")
            data_str = text.split("=", 1)[1].strip()
            data = json.loads(data_str)

            items = []
            for key, val in data.items():
                parts = val.split(",")
                if len(parts) >= 12:
                    items.append({
                        "name": parts[1],
                        "code": key,
                        "change_pct": round(float(parts[5]), 2),
                        "leading_stock": parts[8].replace("sz", "").replace("sh", ""),
                        "leading_name": parts[12],
                        "leading_price": round(float(parts[9]), 2),
                    })

            items.sort(key=lambda x: x["change_pct"], reverse=True)
            return items[:10]
        except Exception as e:
            print(f"获取新浪概念板块失败 (尝试 {retry+1}/3): {e}")
            if retry < 2:
                time.sleep(2)
    return []


def get_sector_stocks(sector_code: str, sector_name: str, limit: int = 5) -> list[dict]:
    """获取概念板块内个股（新浪概念数据已包含龙头股信息）"""
    try:
        # 重新获取概念列表，从中提取该板块的成分股
        url = "http://vip.stock.finance.sina.com.cn/q/view/newFLJK.php?param=class"
        r = requests.get(url, headers={"Referer": "http://finance.sina.com.cn"}, timeout=10)
        text = r.text.strip().rstrip(";")
        data_str = text.split("=", 1)[1].strip()
        data = json.loads(data_str)

        if sector_code not in data:
            return []

        val = data[sector_code]
        parts = val.split(",")

        # 从新浪数据中提取板块内活跃个股
        # 数据格式中只有龙头股信息，我们用龙头股+新浪实时行情获取更多相关股票
        leading_symbol = parts[8].replace("sz", "").replace("sh", "")
        leading_name = parts[12]
        leading_price = float(parts[9])
        change_pct = round(float(parts[5]), 2)

        # 取龙头股作为推荐
        return [{
            "symbol": leading_symbol,
            "name": leading_name,
            "current_price": leading_price,
            "change_pct": change_pct,
        }]
    except Exception as e:
        print(f"获取板块成分股失败 {sector_code}: {e}")
        return []


def build_sector_prompt(sector_name: str, sector_change: float, stocks: list[dict]) -> str:
    """构建行业推荐的 prompt"""
    stocks_str = "\n".join([
        f"- {s['name']}({s['symbol']}): 现价{s['current_price']}, 涨跌幅{s['change_pct']}%"
        + (f", MACD DIF={s.get('macd_dif','N/A')}, RSI={s.get('rsi','N/A')}" if s.get('macd_dif') else "")
        for s in stocks
    ])

    return f"""你是一位有20年经验的A股行业研究专家。请根据以下数据推荐行业及个股：

【行业板块】
- 行业/概念名称：{sector_name}
- 板块涨跌幅：{sector_change}%

【板块内活跃个股】
{stocks_str}

请从以下角度分析并推荐该行业及个股：
1. 该行业当前的景气度、政策环境、成长潜力
2. 为什么该行业值得关注（2-3个核心理由）
3. 板块内哪些个股值得重点关注

请以严格的JSON格式返回（不要包含任何其他文字）：
{{
  "sector_name": "{sector_name}",
  "sector_change_pct": {sector_change},
  "recommend_reason": "行业整体推荐理由，2-3句话",
  "growth_potential": "成长潜力分析，1-2句话",
  "policy_support": "政策环境分析，1-2句话",
  "risk_warning": "行业风险提示，1-2句话",
  "recommend_score": 0到100的整数（推荐强度）,
  "stock_recommendations": [
    {{
      "symbol": "股票代码",
      "name": "股票名称",
      "recommend_reason": "个股推荐理由，1-2句话",
      "risk_tip": "个股风险提示，1句话"
    }}
  ]
}}"""


def _analyze_sector_qwen(prompt: str, sector_name: str, sector_change: float, stocks: list[dict]) -> dict:
    """通义千问分析行业推荐"""
    try:
        response = Generation.call(
            model="qwen-max",
            messages=[
                {"role": "system", "content": "你是一位专业的A股行业研究分析师，擅长基本面分析和技术面结合。请用JSON格式回答。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            result_format="message",
        )

        if response.status_code == 200:
            content = response.output.choices[0].message.content.strip()
            if "```" in content:
                content = content.split("```json")[-1].split("```")[0].strip()
            elif "{" in content:
                content = content[content.find("{"):content.rfind("}") + 1]
            return json.loads(content)
    except Exception as e:
        print(f"千问分析行业失败: {e}")
    return _fallback_sector(sector_name, sector_change, stocks)


def _analyze_sector_deepseek(prompt: str, sector_name: str, sector_change: float, stocks: list[dict]) -> dict:
    """DeepSeek 分析行业推荐"""
    if not DEEPSEEK_API_KEY:
        return _fallback_sector(sector_name, sector_change, stocks)

    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
        )
        response = client.chat.completions.create(
            model="deepseek-v4-pro",
            messages=[
                {"role": "system", "content": "你是一位专业的A股行业研究分析师，擅长基本面分析和技术面结合。请用JSON格式回答。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        content = response.choices[0].message.content.strip()
        if "```" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        elif "{" in content:
            content = content[content.find("{"):content.rfind("}") + 1]
        return json.loads(content)
    except ImportError:
        return _fallback_sector(sector_name, sector_change, stocks)
    except Exception as e:
        print(f"DeepSeek分析行业失败: {e}")
        return _fallback_sector(sector_name, sector_change, stocks)


def _analyze_sector_gemini(prompt: str, sector_name: str, sector_change: float, stocks: list[dict]) -> dict:
    """Gemini 分析行业推荐"""
    if not GOOGLE_API_KEY:
        return _fallback_sector(sector_name, sector_change, stocks)

    try:
        from google import genai
        client = genai.Client(api_key=GOOGLE_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"role": "user", "parts": [{"text": "你是一位专业的A股行业研究分析师，擅长基本面分析和技术面结合。请用JSON格式回答。"}]},
                {"role": "model", "parts": [{"text": "好的，我会用JSON格式返回行业分析结果。"}]},
                {"role": "user", "parts": [{"text": prompt}]},
            ],
        )
        content = response.text.strip()
        if "```" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        elif "{" in content:
            content = content[content.find("{"):content.rfind("}") + 1]
        return json.loads(content)
    except ImportError:
        return _fallback_sector(sector_name, sector_change, stocks)
    except Exception as e:
        print(f"Gemini分析行业失败: {e}")
        return _fallback_sector(sector_name, sector_change, stocks)


def _fallback_sector(sector_name: str, sector_change: float, stocks: list[dict]) -> dict:
    """LLM 失败时的兜底推荐"""
    return {
        "sector_name": sector_name,
        "sector_change_pct": sector_change,
        "recommend_reason": f"{sector_name}板块当日{('上涨' if sector_change >= 0 else '下跌')}{abs(sector_change)}%，板块活跃度较高，建议关注板块内龙头个股表现。",
        "growth_potential": "建议结合基本面数据进一步分析。",
        "policy_support": "建议关注相关行业政策动向。",
        "risk_warning": "短期波动较大，请注意控制仓位风险。",
        "recommend_score": 60 if sector_change >= 0 else 40,
        "stock_recommendations": [
            {
                "symbol": s["symbol"],
                "name": s["name"],
                "recommend_reason": f"板块内活跃个股，当日{'上涨' if s['change_pct'] >= 0 else '下跌'}{abs(s['change_pct'])}%。",
                "risk_tip": "注意短期回调风险。",
            }
            for s in stocks[:5]
        ],
    }


def analyze_sector_with_llm(sector_name: str, sector_change: float, stocks: list[dict], model: str = "qwen") -> dict:
    """调用 LLM 分析行业并给出推荐理由"""
    dashscope.api_key = DASHSCOPE_API_KEY

    # 获取龙头股的技术指标
    for s in stocks[:3]:
        try:
            kline = get_daily_kline(s["symbol"])
            indicators = calc_indicators(kline)
            s.update(indicators)
        except Exception:
            pass

    prompt = build_sector_prompt(sector_name, sector_change, stocks)

    if model == "deepseek":
        return _analyze_sector_deepseek(prompt, sector_name, sector_change, stocks)
    if model == "gemini":
        return _analyze_sector_gemini(prompt, sector_name, sector_change, stocks)
    return _analyze_sector_qwen(prompt, sector_name, sector_change, stocks)


# 全局缓存：板块数据 5 分钟有效
_sector_cache: dict = {"data": [], "expire_at": 0}


def get_recommendations(model: str = "qwen") -> list[dict]:
    """获取热门推荐：热门行业 + 推荐个股"""
    # 共享板块数据缓存
    now = time.time()
    if now < _sector_cache["expire_at"] and _sector_cache["data"]:
        sectors = _sector_cache["data"]
    else:
        sectors = get_hot_sectors()
        _sector_cache["data"] = sectors
        _sector_cache["expire_at"] = now + 300

    if not sectors:
        return []

    results = []
    for sector in sectors[:5]:  # 取前 5 个热门概念
        try:
            stocks = get_sector_stocks(sector["code"], sector["name"], limit=5)
            if not stocks:
                continue

            analysis = analyze_sector_with_llm(
                sector["name"], sector["change_pct"], stocks, model=model
            )
            results.append(analysis)
        except Exception as e:
            print(f"分析行业{sector['name']}失败: {e}")
            continue

    return results
