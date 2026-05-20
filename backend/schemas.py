"""Pydantic 数据模型"""
from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


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


# --- 订阅管理 ---

class PlanResponse(BaseModel):
    id: int
    name: str
    code: str
    price_monthly: float
    price_yearly: float
    description: Optional[str] = None
    features: List[str]
    ai_calls_per_day: int
    max_models: int
    priority: int

    model_config = {"from_attributes": True}

    @field_validator("price_monthly", "price_yearly", mode="before")
    @classmethod
    def decimal_to_float(cls, v):
        return float(v) if v is not None else 0.0


class PlanCreate(BaseModel):
    name: str
    code: str
    price_monthly: float
    price_yearly: float
    description: Optional[str] = None
    features: List[str]
    ai_calls_per_day: int
    max_models: int
    priority: int = 0
    is_active: bool = True


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    ai_calls_per_day: Optional[int] = None
    max_models: Optional[int] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class SubscriptionActivateReq(BaseModel):
    plan_code: str
    billing_cycle: str = "monthly"


class UsageStats(BaseModel):
    today_calls: int
    daily_limit: int
    is_limited: bool
    remaining: int
    plan_name: str
    plan_code: str
    monthly_cost: float = 0.0
    monthly_budget: float = -1


class InvestmentStyleUpdate(BaseModel):
    investment_style: str
