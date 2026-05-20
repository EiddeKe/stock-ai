"""联网搜索服务 — 获取实时新闻和行情资讯"""
import requests
import json


def search_stock_news(query: str, max_results: int = 5) -> list[dict]:
    """通过 Sina 财经搜索获取实时新闻"""
    try:
        url = f"https://search.finance.sina.com.cn/search?word={query}&source=1"
        r = requests.get(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Referer": "https://finance.sina.com.cn",
        }, timeout=8)
        # Sina 搜索返回的是 HTML，尝试解析标题和链接
        import re
        results = []
        # 提取搜索结果中的标题和链接
        pattern = r'<a[^>]*href="([^"]*finance\.sina\.com[^"]*)"[^>]*>(.*?)</a>'
        matches = re.findall(pattern, r.text, re.DOTALL)
        for url, title in matches[:max_results]:
            clean_title = re.sub(r'<[^>]+>', '', title).strip()
            if clean_title and len(clean_title) > 4:
                results.append({"title": clean_title, "url": url})
        return results
    except Exception as e:
        print(f"搜索新闻失败: {e}")
        return []


def get_latest_news_for_stocks(symbols: list[str], names: list[str]) -> str:
    """获取持仓股票的最新新闻和市场动态"""
    news_parts = []
    for symbol, name in zip(symbols, names):
        try:
            # 使用百度搜索获取该股票的最新资讯摘要
            query = f"{name} {symbol} 股票 最新消息"
            results = search_stock_news(query, max_results=3)
            if results:
                titles = [r["title"] for r in results]
                news_parts.append(f"【{name}({symbol}) 相关新闻】\n" + "\n".join(f"- {t}" for t in titles))
        except Exception:
            pass
    return "\n".join(news_parts) if news_parts else ""
