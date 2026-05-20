"""FastAPI 入口"""
import time
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import engine, SessionLocal, Base
from config import DATABASE_URL, env as current_env
from models import User, AdminUser
from services.auth_service import hash_password
from routers import positions, analysis, recommendation, chat, auth, admin, admin_plans, subscription
from scheduler import start_scheduler
from seed_plans import seed_plans


from sqlalchemy import text

def migrate_existing_data():
    """数据迁移"""
    # 为新字段添加列（幂等操作）
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN investment_style VARCHAR(20)"))
            conn.commit()
            print("[数据迁移] 已添加 investment_style 列")
    except Exception:
        pass  # 列已存在

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            from models import Position
            old_positions = db.query(Position).filter(Position.user_id.is_(None)).all()
            if old_positions:
                demo = User(
                    account="demo@stockai.com",
                    nickname="演示用户",
                    hashed_pwd=hash_password("demo123"),
                )
                db.add(demo)
                db.commit()
                db.refresh(demo)
                for p in old_positions:
                    p.user_id = demo.id
                db.commit()
                print(f"[数据迁移] 已创建默认用户，{len(old_positions)} 条持仓数据已关联")
            else:
                print("[数据迁移] 无旧数据需要迁移")

        # 创建初始管理员账号
        admin_count = db.query(AdminUser).count()
        if admin_count == 0:
            admin_user = AdminUser(
                account="admin",
                hashed_pwd=hash_password("Admin@2026"),
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("[数据迁移] 已创建初始管理员账号 admin / Admin@2026，请立即修改密码")
        else:
            print(f"[数据迁移] 已有 {admin_count} 个管理员账号")
    finally:
        db.close()


# 初始化数据库
Base.metadata.create_all(bind=engine)

# 数据迁移
migrate_existing_data()

# 初始化默认套餐
seed_plans()

app = FastAPI(title="A股交易指导助手", version="2.0.0")

# CORS：限制为前端域名
ALLOWED_ORIGINS = [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://47.110.44.144:3001",
    "http://47.110.44.144:3002",
    "http://47.110.44.144:3003",
    "http://47.110.44.144:80",
    "https://stock-ai.com",
    "http://stock-ai.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# 简易滑动窗口限流（防滥用）
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # 窗口 60 秒
RATE_LIMIT_MAX = 60     # 每窗口最多 60 次（排除 /api/health 和 /docs）


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    # 跳过健康检查和文档
    if path in ("/api/health", "/", "/docs", "/openapi.json", "/redoc"):
        return await call_next(request)

    ip = request.client.host or "unknown"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW

    # 清理过期记录
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if t > window_start]
    _rate_limit_store[ip].append(now)

    if len(_rate_limit_store[ip]) > RATE_LIMIT_MAX:
        return JSONResponse(status_code=429, content={"detail": "请求过于频繁，请稍后再试"})

    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(max(0, RATE_LIMIT_MAX - len(_rate_limit_store[ip])))
    return response


# 注册路由
app.include_router(auth.router)
app.include_router(positions.router)
app.include_router(analysis.router)
app.include_router(recommendation.router)
app.include_router(chat.router)
app.include_router(admin.router)          # /api/admin/login, /api/admin/me
app.include_router(admin.router_users)    # /api/admin/users/*
app.include_router(subscription.router)
app.include_router(admin_plans.router)


@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.get("/")
def root():
    return {"message": "A股交易指导助手 API 运行中", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/env")
def env_info():
    """返回当前运行环境信息，方便快速确认是生产还是测试"""
    is_mysql = "mysql" in DATABASE_URL.lower()
    return {
        "env": current_env,
        "database_type": "MySQL" if is_mysql else "SQLite (test)",
        "is_prod": current_env == "prod",
    }
