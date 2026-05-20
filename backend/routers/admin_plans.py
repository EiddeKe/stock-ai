"""套餐管理 API（管理员专用）"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Plan, Subscription, UsageLog, User
from routers.admin import verify_admin

router = APIRouter(prefix="/api/admin/plans", tags=["套餐管理"])


class PlanCreateReq(BaseModel):
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


class PlanUpdateReq(BaseModel):
    name: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    ai_calls_per_day: Optional[int] = None
    max_models: Optional[int] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
def list_all_plans(_=Depends(verify_admin), db: Session = Depends(get_db)):
    plans = db.query(Plan).order_by(Plan.priority).all()
    return plans


@router.post("")
def create_plan(data: PlanCreateReq, _=Depends(verify_admin), db: Session = Depends(get_db)):
    existing = db.query(Plan).filter(Plan.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="套餐 code 已存在")
    plan = Plan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/{plan_id}")
def update_plan(plan_id: int, data: PlanUpdateReq, _=Depends(verify_admin), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="套餐不存在")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, _=Depends(verify_admin), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="套餐不存在")
    plan.is_active = False
    db.commit()
    return {"message": "套餐已下架"}


@router.get("/stats")
def usage_analytics(_=Depends(verify_admin), db: Session = Depends(get_db)):
    """全平台用量统计"""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 今日统计
    today_total = db.query(UsageLog).filter(UsageLog.created_at >= today_start).count()
    by_type = dict(
        db.query(UsageLog.action_type, func.count(UsageLog.id))
        .filter(UsageLog.created_at >= today_start)
        .group_by(UsageLog.action_type).all()
    )
    # 模型分布（全部时间）
    by_model = dict(
        db.query(UsageLog.model_used, func.count(UsageLog.id))
        .filter(UsageLog.model_used.isnot(None))
        .group_by(UsageLog.model_used).all()
    )
    # 本月总调用量
    month_total = db.query(UsageLog).filter(UsageLog.created_at >= month_start).count()
    # 本月总成本
    month_cost = float(
        db.query(func.coalesce(func.sum(UsageLog.cost), 0))
        .filter(UsageLog.created_at >= month_start).scalar()
    )
    # 历史总调用量
    total_calls = db.query(UsageLog).count()
    # 历史总成本
    total_cost = float(db.query(func.coalesce(func.sum(UsageLog.cost), 0)).scalar())

    total_users = db.query(User).count()
    active_subs = db.query(Subscription).filter(
        Subscription.status == "active",
        Subscription.expire_at > datetime.now(),
    ).count()
    return {
        "today_total_calls": today_total,
        "by_action_type": by_type,
        "by_model": by_model,
        "month_total_calls": month_total,
        "month_total_cost": round(month_cost, 4),
        "total_calls": total_calls,
        "total_cost": round(total_cost, 4),
        "total_users": total_users,
        "active_subscriptions": active_subs,
    }


@router.get("/stats/users")
def usage_by_user(
    page: int = 1,
    page_size: int = 20,
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """每个用户的模型调用量统计"""
    from models import User
    total = db.query(User).count()
    users = db.query(User).order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for u in users:
        user_stats = (
            db.query(
                func.count(UsageLog.id),
                func.coalesce(func.sum(UsageLog.cost), 0),
            )
            .filter(UsageLog.user_id == u.id)
            .first()
        )
        # 按模型分拆
        user_by_model = dict(
            db.query(UsageLog.model_used, func.count(UsageLog.id))
            .filter(UsageLog.user_id == u.id, UsageLog.model_used.isnot(None))
            .group_by(UsageLog.model_used).all()
        )
        # 本月统计
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = db.query(UsageLog).filter(
            UsageLog.user_id == u.id, UsageLog.created_at >= today_start
        ).count()

        result.append({
            "user_id": u.id,
            "account": u.account,
            "nickname": u.nickname,
            "total_calls": user_stats[0],
            "total_cost": round(float(user_stats[1]), 4),
            "today_calls": today_count,
            "by_model": user_by_model,
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": result,
    }
