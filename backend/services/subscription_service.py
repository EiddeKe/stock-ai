"""订阅与用量检查服务"""
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Plan, Subscription, UsageLog, User

logger = logging.getLogger(__name__)


def get_active_subscription(user_id: int, db: Session) -> Subscription | None:
    """获取用户当前有效的订阅"""
    now = datetime.now()
    return (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id,
            Subscription.status == "active",
            Subscription.expire_at > now,
        )
        .first()
    )


def get_today_usage_count(user_id: int, db: Session) -> int:
    """获取用户今天的已使用次数"""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(UsageLog)
        .filter(
            UsageLog.user_id == user_id,
            UsageLog.created_at >= today_start,
        )
        .count()
    )


def log_usage(user_id: int, action_type: str, model_used: str, db: Session):
    """记录一次用量（insert-only）"""
    log = UsageLog(
        user_id=user_id,
        action_type=action_type,
        model_used=model_used,
    )
    db.add(log)
    db.commit()


def get_usage_stats(user_id: int, db: Session) -> dict:
    """获取用户今日用量统计"""
    try:
        sub = get_active_subscription(user_id, db)
        if sub:
            plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        else:
            plan = db.query(Plan).filter(Plan.code == "free").first()

        if not plan:
            return {
                "today_calls": 0, "daily_limit": -1, "is_limited": False,
                "remaining": -1, "plan_name": "未知", "plan_code": "unknown",
            }

        today_count = get_today_usage_count(user_id, db)
        daily_limit = plan.ai_calls_per_day

        if daily_limit == -1:
            remaining = -1
            is_limited = False
        else:
            remaining = max(0, daily_limit - today_count)
            is_limited = True

        return {
            "today_calls": today_count,
            "daily_limit": daily_limit,
            "is_limited": is_limited,
            "remaining": remaining,
            "plan_name": plan.name,
            "plan_code": plan.code,
        }
    except Exception as e:
        logger.error(f"获取用量统计失败: {e}")
        return {
            "today_calls": 0, "daily_limit": -1, "is_limited": False,
            "remaining": -1, "plan_name": "免费版", "plan_code": "free",
        }


def check_subscription_limit(
    user: User,
    db: Session = Depends(get_db),
    action_type: str = "analysis",
):
    """
    FastAPI 依赖：检查用户是否有配额。
    如果超出限制，抛出 HTTPException(402)。
    DB 异常时放行（非阻塞设计）。
    """
    try:
        sub = get_active_subscription(user.id, db)
        if sub:
            plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        else:
            plan = db.query(Plan).filter(Plan.code == "free").first()

        if not plan:
            return

        daily_limit = plan.ai_calls_per_day
        if daily_limit == -1:
            return

        today_count = get_today_usage_count(user.id, db)
        if today_count >= daily_limit:
            raise HTTPException(
                status_code=402,
                detail=f"每日分析次数已达上限（{daily_limit}次），请升级套餐",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"订阅限额检查异常（已放行）: {e}")
        return


def activate_subscription(
    user_id: int,
    plan_code: str,
    billing_cycle: str,
    db: Session,
    payment_method: str = "manual",
    payment_id: str | None = None,
) -> Subscription:
    """激活订阅（MVP: 模拟支付；后期对接真实支付网关）"""
    plan = db.query(Plan).filter(Plan.code == plan_code).first()
    if not plan:
        raise HTTPException(status_code=404, detail="套餐不存在")

    now = datetime.now()
    if billing_cycle == "yearly":
        expire_at = now + timedelta(days=365)
        amount = plan.price_yearly
    else:
        expire_at = now + timedelta(days=30)
        amount = plan.price_monthly

    existing = get_active_subscription(user_id, db)
    if existing:
        existing.status = "cancelled"
        db.add(existing)

    sub = Subscription(
        user_id=user_id,
        plan_id=plan.id,
        status="active",
        start_at=now,
        expire_at=expire_at,
        payment_method=payment_method,
        payment_id=payment_id,
        amount_paid=amount,
        auto_renew=False,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub
