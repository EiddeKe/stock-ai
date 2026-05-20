"""行情数据服务 - 调用腾讯行情接口"""
import requests
import pandas as pd
from typing import Optional


def get_realtime_quote(symbol: str) -> Optional[dict]:
    """获取实时行情（腾讯qt接口）"""
    try:
        # 判断市场前缀
        prefix = "sh" if symbol.startswith(("6", "9")) else "sz"
        url = f"https://qt.gtimg.cn/q={prefix}{symbol}"
        resp = requests.get(url, timeout=10)
        resp.encoding = "GBK"
        text = resp.text.strip()

        # 格式: v_sh600519="1~贵州茅台~600519~1315.01~1324.30~..."
        if not text or "~" not in text:
            return None

        # 提取引号内的数据部分
        start = text.find('"')
        end = text.rfind('"')
        if start == -1 or end == -1:
            return None
        data_str = text[start + 1:end]

        parts = data_str.split("~")
        if len(parts) < 35:
            return None

        current_price = float(parts[3])
        prev_close = float(parts[4])
        high = float(parts[33])
        low = float(parts[34])

        return {
            "symbol": symbol,
            "name": parts[1],
            "current_price": current_price,
            "open_price": float(parts[5]),
            "high_price": high,
            "low_price": low,
            "prev_close": prev_close,
            "volume": float(parts[6]) * 100,  # 腾讯返回的是手(1手=100股)
            "change_pct": float(parts[32]),
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
