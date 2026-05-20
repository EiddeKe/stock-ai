"""分析 API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Position, User
from services.quote_service import get_realtime_quote, get_daily_kline
from services.indicator_service import calc_indicators
from services.ai_service import analyze_stock
from services.subscription_service import check_subscription_limit, log_usage
from schemas import AnalysisResult
from routers.auth import get_current_user, auth_header

router = APIRouter(prefix="/api/analysis", tags=["交易分析"])


@router.post("/all", response_model=list[AnalysisResult])
def analyze_all_positions(
    model: str = Query("qwen", enum=["qwen", "deepseek"]),
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """分析全部持仓"""
    current_user = get_current_user(token, db)
    check_subscription_limit(current_user, db, action_type="analysis")
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    if not positions:
        raise HTTPException(status_code=400, detail="请先添加持仓股票")
    results = []
    for p in positions:
        try:
            results.append(_analyze(p, db, model))
        except Exception as e:
            results.append(AnalysisResult(
                symbol=p.symbol, name=p.name,
                current_price=0, cost_price=p.cost_price, profit_pct=0,
                suggestion="持有", confidence=50,
                reason=f"分析失败: {e}", risk_tip="请重试",
            ))
    try:
        log_usage(current_user.id, "analysis", model, db)
    except Exception:
        pass
    return results


@router.post("/{symbol}", response_model=AnalysisResult)
def analyze_position(
    symbol: str,
    model: str = Query("qwen", enum=["qwen", "deepseek"]),
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """分析单只持仓股票"""
    current_user = get_current_user(token, db)
    check_subscription_limit(current_user, db, action_type="analysis")
    position = db.query(Position).filter(Position.symbol == symbol, Position.user_id == current_user.id).first()
    if not position:
        raise HTTPException(status_code=404, detail="该股票不在持仓中")
    result = _analyze(position, db, model)
    try:
        log_usage(current_user.id, "analysis", model, db)
    except Exception:
        pass
    return result


def _analyze(position: Position, db: Session, model: str = "qwen") -> AnalysisResult:
    """单只股票分析核心流程"""
    # 1. 获取实时行情
    quote = get_realtime_quote(position.symbol)
    if not quote:
        raise HTTPException(status_code=502, detail=f"无法获取 {position.symbol} 的实时行情，请在交易时间使用")

    current_price = quote["current_price"]
    profit_pct = round((current_price - position.cost_price) / position.cost_price * 100, 2)

    # 2. 获取日K线 + 计算技术指标
    daily_df = get_daily_kline(position.symbol)
    indicators = calc_indicators(daily_df)

    # 3. AI 分析（支持模型选择）
    result = analyze_stock(
        symbol=position.symbol,
        name=position.name,
        current_price=current_price,
        cost_price=position.cost_price,
        shares=position.shares,
        indicators=indicators,
        model=model,
    )

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
