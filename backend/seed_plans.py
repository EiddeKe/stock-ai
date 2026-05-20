"""套餐初始化种子数据"""
from database import SessionLocal
from models import Plan

DEFAULT_PLANS = [
    {
        "name": "免费版",
        "code": "free",
        "price_monthly": 0,
        "price_yearly": 0,
        "description": "适合轻度使用的入门用户",
        "features": ["每日 3 次 AI 分析", "1 个 AI 模型（千问）", "基础技术指标", "热门推荐"],
        "ai_calls_per_day": 3,
        "max_models": 1,
        "priority": 1,
        "is_active": True,
    },
    {
        "name": "专业版",
        "code": "pro",
        "price_monthly": 99.00,
        "price_yearly": 990.00,
        "description": "适合活跃交易者的专业工具",
        "features": [
            "每日无限次 AI 分析",
            "3 个 AI 模型（千问/DeepSeek/Gemini）",
            "深度技术指标",
            "热门推荐 + 行业洞察",
            "AI 对话联网搜索",
        ],
        "ai_calls_per_day": -1,
        "max_models": 3,
        "priority": 2,
        "is_active": True,
    },
    {
        "name": "旗舰版",
        "code": "premium",
        "price_monthly": 299.00,
        "price_yearly": 2990.00,
        "description": "为专业投资者提供优先响应",
        "features": [
            "专业版全部功能",
            "优先分析队列",
            "专属客服",
            "高级风控预警",
            "自定义分析策略",
        ],
        "ai_calls_per_day": -1,
        "max_models": 3,
        "priority": 3,
        "is_active": True,
    },
]


def seed_plans():
    """如果 plans 表为空，则插入默认套餐"""
    db = SessionLocal()
    try:
        count = db.query(Plan).count()
        if count == 0:
            for p in DEFAULT_PLANS:
                db.add(Plan(**p))
            db.commit()
            print(f"[套餐种子] 已插入 {len(DEFAULT_PLANS)} 个默认套餐")
        else:
            print(f"[套餐种子] plans 表已有 {count} 条数据，跳过")
    finally:
        db.close()
