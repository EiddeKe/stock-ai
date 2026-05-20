"""订阅管理 API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Plan
from services.subscription_service import (
    get_active_subscription,
    get_usage_stats,
    activate_subscription,
)
from schemas import SubscriptionActivateReq
from routers.auth import get_current_user, auth_header

router = APIRouter(prefix="/api/subscription", tags=["订阅管理"])


@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    """获取所有上架的套餐（公开，无需登录）"""
    plans = db.query(Plan).filter(Plan.is_active == True).order_by(Plan.priority).all()
    return plans


@router.get("")
def get_my_subscription(
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """获取当前用户的订阅状态"""
    current_user = get_current_user(token, db)
    sub = get_active_subscription(current_user.id, db)

    if not sub:
        return {"has_subscription": False, "subscription": None}

    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return {
        "has_subscription": True,
        "subscription": {
            "id": sub.id,
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "code": plan.code,
                "ai_calls_per_day": plan.ai_calls_per_day,
                "max_models": plan.max_models,
            } if plan else None,
            "status": sub.status,
            "start_at": str(sub.start_at),
            "expire_at": str(sub.expire_at),
            "amount_paid": float(sub.amount_paid) if sub.amount_paid else 0,
            "auto_renew": sub.auto_renew,
        },
    }


@router.post("/activate")
def activate(
    data: SubscriptionActivateReq,
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """激活订阅（MVP 模拟支付）"""
    current_user = get_current_user(token, db)

    if data.billing_cycle not in ("monthly", "yearly"):
        raise HTTPException(status_code=400, detail="计费周期仅支持 monthly 或 yearly")

    sub = activate_subscription(
        user_id=current_user.id,
        plan_code=data.plan_code,
        billing_cycle=data.billing_cycle,
        db=db,
        payment_method="manual",
    )

    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return {
        "message": "订阅已激活",
        "subscription": {
            "id": sub.id,
            "plan": {"id": plan.id, "name": plan.name, "code": plan.code} if plan else None,
            "status": sub.status,
            "start_at": str(sub.start_at),
            "expire_at": str(sub.expire_at),
            "amount_paid": float(sub.amount_paid) if sub.amount_paid else 0,
        },
    }


@router.get("/usage")
def get_usage(
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """获取当前用户今日用量统计"""
    current_user = get_current_user(token, db)
    return get_usage_stats(current_user.id, db)
