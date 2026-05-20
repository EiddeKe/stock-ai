"""持仓管理 API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Position, User
from schemas import PositionCreate, PositionUpdate, PositionResponse
from services.quote_service import get_realtime_quote
from routers.auth import get_current_user, auth_header
from datetime import datetime

router = APIRouter(prefix="/api/positions", tags=["持仓管理"])


@router.get("", response_model=list[PositionResponse])
def list_positions(db: Session = Depends(get_db), token: str = Depends(auth_header)):
    """获取所有持仓"""
    current_user = get_current_user(token, db)
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    result = []
    for p in positions:
        quote = get_realtime_quote(p.symbol)
        resp = PositionResponse.model_validate(p)
        if quote:
            resp.current_price = quote["current_price"]
            resp.profit_pct = round((quote["current_price"] - p.cost_price) / p.cost_price * 100, 2)
            resp.profit_amount = round((quote["current_price"] - p.cost_price) * p.shares, 2)
            resp.change_pct = quote.get("change_pct")
        result.append(resp)
    return result


@router.post("", response_model=PositionResponse)
def create_position(data: PositionCreate, db: Session = Depends(get_db), token: str = Depends(auth_header)):
    """添加持仓"""
    current_user = get_current_user(token, db)
    existing = db.query(Position).filter(Position.user_id == current_user.id, Position.symbol == data.symbol).first()
    if existing:
        raise HTTPException(status_code=400, detail="该股票已在持仓中")

    buy_date = datetime.fromisoformat(data.buy_date) if data.buy_date else datetime.now()
    position = Position(
        user_id=current_user.id,
        symbol=data.symbol,
        name=data.name,
        cost_price=data.cost_price,
        shares=data.shares,
        buy_date=buy_date,
    )
    db.add(position)
    db.commit()
    db.refresh(position)
    return position


@router.put("/{position_id}", response_model=PositionResponse)
def update_position(position_id: int, data: PositionUpdate, db: Session = Depends(get_db), token: str = Depends(auth_header)):
    """更新持仓"""
    current_user = get_current_user(token, db)
    position = db.query(Position).filter(Position.id == position_id, Position.user_id == current_user.id).first()
    if not position:
        raise HTTPException(status_code=404, detail="持仓不存在")

    if data.name is not None:
        position.name = data.name
    if data.cost_price is not None:
        position.cost_price = data.cost_price
    if data.shares is not None:
        position.shares = data.shares

    db.commit()
    db.refresh(position)
    return position


@router.delete("/{position_id}")
def delete_position(position_id: int, db: Session = Depends(get_db), token: str = Depends(auth_header)):
    """删除持仓"""
    current_user = get_current_user(token, db)
    position = db.query(Position).filter(Position.id == position_id, Position.user_id == current_user.id).first()
    if not position:
        raise HTTPException(status_code=404, detail="持仓不存在")
    db.delete(position)
    db.commit()
    return {"message": "已删除"}
