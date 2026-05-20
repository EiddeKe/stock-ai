"""行情数据服务 - 直接调用新浪/腾讯行情接口"""
import requests
import pandas as pd
from typing import Optional


def get_realtime_quote(symbol: str) -> Optional[dict]:
    """获取实时行情（新浪接口）"""
    try:
        # 判断市场前缀
        prefix = "sh" if symbol.startswith(("6", "9")) else "sz"
        url = f"http://hq.sinajs.cn/list={prefix}{symbol}"
        resp = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://finance.sina.com.cn",
        })
        text = resp.text.strip()
        if not text or "=" not in text:
            return None

        data_str = text.split("=")[1].strip('";')
        if not data_str:
            return None

        parts = data_str.split(",")
        if len(parts) < 32:
            return None

        return {
            "symbol": symbol,
            "name": parts[0],
            "current_price": float(parts[3]),
            "open_price": float(parts[1]),
            "high_price": float(parts[4]),
            "low_price": float(parts[5]),
            "prev_close": float(parts[2]),
            "volume": float(parts[8]),
            "change_pct": round((float(parts[3]) - float(parts[2])) / float(parts[2]) * 100, 2) if float(parts[2]) > 0 else 0,
        }
    except Exception as e:
        print(f"获取行情失败 {symbol}: {e}")
        return None


def get_daily_kline(symbol: str, days: int = 60) -> pd.DataFrame:
    """获取日K线数据（腾讯接口）"""
    try:
        prefix = "sh" if symbol.startswith(("6", "9")) else "sz"
        url = f"https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={prefix}{symbol},day,,,{days},qfq"
        resp = requests.get(url, timeout=10)
        data = resp.json()

        # 解析腾讯K线数据
        stock_data = data.get("data", {}).get(f"{prefix}{symbol}", {})
        klines = stock_data.get("qfqday", stock_data.get("day", []))

        if not klines:
            return pd.DataFrame()

        df = pd.DataFrame(klines, columns=["date", "open", "close", "high", "low", "volume"])
        df["open"] = df["open"].astype(float)
        df["close"] = df["close"].astype(float)
        df["high"] = df["high"].astype(float)
        df["low"] = df["low"].astype(float)
        df["成交量"] = df["volume"].astype(float)
        df.rename(columns={"open": "开盘", "close": "收盘", "high": "最高", "low": "最低"}, inplace=True)
        return df
    except Exception as e:
        print(f"获取日K线失败 {symbol}: {e}")
        return pd.DataFrame()
