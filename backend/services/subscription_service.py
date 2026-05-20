"""订阅与用量检查服务"""
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Plan, Subscription, UsageLog, User
from config import MODEL_PRICING, MONTHLY_BUDGET, MODEL_TO_TIER

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


def _get_user_plan(user_id: int, db: Session) -> Plan | None:
    """获取用户当前套餐"""
    sub = get_active_subscription(user_id, db)
    if sub:
        return db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return db.query(Plan).filter(Plan.code == "free").first()


def get_today_usage_count(user_id: int, db: Session) -> int:
    """获取用户今天的已使用次数"""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(UsageLog)
        .filter(UsageLog.user_id == user_id, UsageLog.created_at >= today_start)
        .count()
    )


def log_usage(
    user_id: int,
    action_type: str,
    model_used: str,
    db: Session,
    tokens_used: int = 0,
    cost: float = 0.0,
):
    """记录一次用量（insert-only）"""
    log = UsageLog(
        user_id=user_id,
        action_type=action_type,
        model_used=model_used,
        tokens_used=tokens_used,
        cost=cost,
    )
    db.add(log)
    db.commit()


def calc_cost(model_key: str, input_tokens: int, output_tokens: int) -> float:
    """根据 token 数量和模型定价计算成本（RMB）"""
    pricing = MODEL_PRICING.get(model_key)
    if not pricing:
        return 0.0
    return (
        input_tokens * pricing["input_per_1k"] + output_tokens * pricing["output_per_1k"]
    ) / 1000.0


def check_model_access(user: User, model: str, db: Session) -> bool:
    """检查用户套餐是否允许使用该模型"""
    required = MODEL_TO_TIER.get(model, 1)
    plan = _get_user_plan(user.id, db)
    if not plan:
        return False
    return plan.max_models >= required


def get_monthly_cost(user_id: int, db: Session) -> float:
    """获取用户本月已消耗的 AI 总成本"""
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = (
        db.query(func.coalesce(func.sum(UsageLog.cost), 0))
        .filter(UsageLog.user_id == user_id, UsageLog.created_at >= month_start)
        .scalar()
    )
    return float(result)


def check_subscription_limit(
    user: User,
    db: Session,
    action_type: str = "analysis",
    model: str = "qwen",
):
    """
    检查用户配额：每日调用次数 + 模型访问权限。
    在 AI 调用前执行。
    """
    try:
        plan = _get_user_plan(user.id, db)
        if not plan:
            return

        # 1. 每日调用次数检查
        daily_limit = plan.ai_calls_per_day
        if daily_limit != -1:
            today_count = get_today_usage_count(user.id, db)
            if today_count >= daily_limit:
                raise HTTPException(
                    status_code=402,
                    detail=f"每日AI调用次数已达上限（{daily_limit}次），请升级套餐",
                )

        # 2. 模型访问权限检查
        if not check_model_access(user, model, db):
            raise HTTPException(
                status_code=403,
                detail=f"当前套餐不支持 {model} 模型，请升级以使用更多模型",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"订阅限额检查异常（已放行）: {e}")
        return


def enforce_monthly_budget(user: User, db: Session, additional_cost: float) -> bool:
    """
    调用后检查月度预算。
    返回 True=未超限，False=已超限。
    """
    try:
        plan = _get_user_plan(user.id, db)
        plan_code = plan.code if plan else "free"
        cap = MONTHLY_BUDGET.get(plan_code, -1)
        if cap == -1:
            return True

        spent = get_monthly_cost(user.id, db) + additional_cost
        return spent <= cap * 1.1  # 允许 10% 超弹
    except Exception as e:
        logger.error(f"月度预算检查异常（已放行）: {e}")
        return True


def get_usage_stats(user_id: int, db: Session) -> dict:
    """获取用户用量统计"""
    try:
        plan = _get_user_plan(user_id, db)
        if not plan:
            return {
                "today_calls": 0, "daily_limit": -1, "is_limited": False,
                "remaining": -1, "plan_name": "未知", "plan_code": "unknown",
                "monthly_cost": 0.0, "monthly_budget": -1,
            }

        today_count = get_today_usage_count(user_id, db)
        daily_limit = plan.ai_calls_per_day
        remaining = -1 if daily_limit == -1 else max(0, daily_limit - today_count)
        monthly_cost = get_monthly_cost(user_id, db)
        budget_cap = MONTHLY_BUDGET.get(plan.code, -1)

        return {
            "today_calls": today_count,
            "daily_limit": daily_limit,
            "is_limited": daily_limit != -1,
            "remaining": remaining,
            "plan_name": plan.name,
            "plan_code": plan.code,
            "monthly_cost": round(monthly_cost, 4),
            "monthly_budget": budget_cap,
        }
    except Exception as e:
        logger.error(f"获取用量统计失败: {e}")
        return {
            "today_calls": 0, "daily_limit": -1, "is_limited": False,
            "remaining": -1, "plan_name": "免费版", "plan_code": "free",
            "monthly_cost": 0.0, "monthly_budget": 10.0,
        }


def activate_subscription(
    user_id: int,
    plan_code: str,
    billing_cycle: str,
    db: Session,
    payment_method: str = "manual",
    payment_id: str | None = None,
) -> Subscription:
    """激活订阅"""
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
