"""Pydantic 数据模型"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PositionCreate(BaseModel):
    symbol: str
    name: str
    cost_price: float
    shares: int
    buy_date: Optional[str] = None


class PositionUpdate(BaseModel):
    name: Optional[str] = None
    cost_price: Optional[float] = None
    shares: Optional[int] = None


class PositionResponse(BaseModel):
    id: int
    symbol: str
    name: str
    cost_price: float
    shares: int
    buy_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    current_price: Optional[float] = None
    profit_pct: Optional[float] = None
    profit_amount: Optional[float] = None
    change_pct: Optional[float] = None  # 今日涨跌幅

    model_config = {"from_attributes": True}


class QuoteResponse(BaseModel):
    symbol: str
    name: str
    current_price: float
    open_price: float
    high_price: float
    low_price: float
    prev_close: float
    volume: float
    change_pct: float


class AnalysisResult(BaseModel):
    symbol: str
    name: str
    current_price: float
    cost_price: float
    profit_pct: float
    suggestion: str  # 买入/加仓/持有/减仓/卖出
    confidence: int  # 0-100
    reason: str
    risk_tip: str


class ChatMessageCreate(BaseModel):
    model: str
    message: str
    enable_search: bool = False


class ChatMessageResponse(BaseModel):
    id: int
    model: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatReply(BaseModel):
    reply: str
