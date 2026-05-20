"""技术指标计算服务"""
import pandas as pd


def calc_indicators(daily_df: pd.DataFrame) -> dict:
    """基于日K线计算技术指标"""
    if daily_df.empty or len(daily_df) < 20:
        return {}

    close = daily_df["收盘"]
    high = daily_df["最高"]
    low = daily_df["最低"]
    volume = daily_df["成交量"]

    result = {}

    # 均线
    result["ma5"] = round(close.rolling(5).mean().iloc[-1], 2)
    result["ma10"] = round(close.rolling(10).mean().iloc[-1], 2)
    result["ma20"] = round(close.rolling(20).mean().iloc[-1], 2)

    # MACD
    ema12 = close.ewm(span=12).mean()
    ema26 = close.ewm(span=26).mean()
    dif = ema12 - ema26
    dea = dif.ewm(span=9).mean()
    macd = (dif - dea) * 2
    result["macd_dif"] = round(dif.iloc[-1], 3)
    result["macd_dea"] = round(dea.iloc[-1], 3)
    result["macd_hist"] = round(macd.iloc[-1], 3)

    # KDJ
    low_min = low.rolling(9).min()
    high_max = high.rolling(9).max()
    rsv = (close - low_min) / (high_max - low_min) * 100
    k = rsv.ewm(com=2).mean()
    d = k.ewm(com=2).mean()
    j = 3 * k - 2 * d
    result["kdj_k"] = round(k.iloc[-1], 2)
    result["kdj_d"] = round(d.iloc[-1], 2)
    result["kdj_j"] = round(j.iloc[-1], 2)

    # RSI
    delta = close.diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    result["rsi"] = round(rs.iloc[-1] * 100, 2)

    # 布林带
    sma20 = close.rolling(20).mean()
    std20 = close.rolling(20).std()
    result["boll_upper"] = round((sma20 + 2 * std20).iloc[-1], 2)
    result["boll_mid"] = round(sma20.iloc[-1], 2)
    result["boll_lower"] = round((sma20 - 2 * std20).iloc[-1], 2)

    # 近期趋势描述
    current = close.iloc[-1]
    change_5d = (current / close.iloc[-5] - 1) * 100 if len(close) >= 5 else 0
    change_10d = (current / close.iloc[-10] - 1) * 100 if len(close) >= 10 else 0
    result["trend_5d"] = round(change_5d, 2)
    result["trend_10d"] = round(change_10d, 2)

    # 成交量变化
    vol_avg5 = volume.rolling(5).mean().iloc[-1]
    vol_today = volume.iloc[-1]
    result["vol_ratio"] = round(vol_today / vol_avg5, 2) if vol_avg5 > 0 else 0

    return result
