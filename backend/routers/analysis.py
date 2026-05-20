"""分析 API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Position, User
from services.quote_service import get_realtime_quote, get_daily_kline
from services.indicator_service import calc_indicators
from services.ai_service import analyze_stock
from services.subscription_service import (
    check_subscription_limit, log_usage, calc_cost, enforce_monthly_budget,
)
from schemas import AnalysisResult
from routers.auth import get_current_user, auth_header

router = APIRouter(prefix="/api/analysis", tags=["交易分析"])


@router.post("/all", response_model=list[AnalysisResult])
def analyze_all_positions(
    model: str = Query("qwen", enum=["qwen", "deepseek", "gemini"]),
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """分析全部持仓"""
    current_user = get_current_user(token, db)
    check_subscription_limit(current_user, db, action_type="analysis", model=model)
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    if not positions:
        raise HTTPException(status_code=400, detail="请先添加持仓股票")
    results = []
    for p in positions:
        try:
            results.append(_analyze(p, db, model, current_user))
        except HTTPException:
            raise
        except Exception as e:
            results.append(AnalysisResult(
                symbol=p.symbol, name=p.name,
                current_price=0, cost_price=p.cost_price, profit_pct=0,
                suggestion="持有", confidence=50,
                reason=f"分析失败: {e}", risk_tip="请重试",
            ))
    return results


@router.post("/{symbol}", response_model=AnalysisResult)
def analyze_position(
    symbol: str,
    model: str = Query("qwen", enum=["qwen", "deepseek", "gemini"]),
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """分析单只持仓股票"""
    current_user = get_current_user(token, db)
    check_subscription_limit(current_user, db, action_type="analysis", model=model)
    position = db.query(Position).filter(Position.symbol == symbol, Position.user_id == current_user.id).first()
    if not position:
        raise HTTPException(status_code=404, detail="该股票不在持仓中")
    return _analyze(position, db, model, current_user)


def _analyze(position: Position, db: Session, model: str, user: User) -> AnalysisResult:
    """单只股票分析核心流程"""
    quote = get_realtime_quote(position.symbol)
    if not quote:
        raise HTTPException(status_code=502, detail=f"无法获取 {position.symbol} 的实时行情，请在交易时间使用")

    current_price = quote["current_price"]
    profit_pct = round((current_price - position.cost_price) / position.cost_price * 100, 2) if position.cost_price > 0 else 0

    daily_df = get_daily_kline(position.symbol)
    indicators = calc_indicators(daily_df)

    result = analyze_stock(
        symbol=position.symbol,
        name=position.name,
        current_price=current_price,
        cost_price=position.cost_price,
        shares=position.shares,
        indicators=indicators,
        model=model,
    )

    # 记录 token 消耗和成本
    tokens = result.get("tokens", {"input": 0, "output": 0, "total": 0})
    cost = calc_cost(model, tokens["input"], tokens["output"])

    # 月度预算检查
    if not enforce_monthly_budget(user, db, cost):
        raise HTTPException(
            status_code=402,
            detail="本月AI调用预算已用完，请升级套餐或下月再试",
        )

    try:
        log_usage(user.id, "analysis", model, db, tokens_used=tokens["total"], cost=cost)
    except Exception:
        pass

    return AnalysisResult(
        symbol=position.symbol,
        name=position.name,
        current_price=current_price,
        cost_price=position.cost_price,
        profit_pct=profit_pct,
        suggestion=result.get("suggestion", "持有"),
        confidence=result.get("confidence", 50),
        reason=result.get("reason", ""),
        risk_tip=result.get("risk_tip", ""),
    )
