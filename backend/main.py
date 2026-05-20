"""FastAPI 入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal, Base
from models import User
from services.auth_service import hash_password
from routers import positions, analysis, recommendation, chat, auth, admin
from scheduler import start_scheduler


def migrate_existing_data():
    """将已有数据迁移到默认用户（如果数据库已有数据但没有 users 表记录）"""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            # 检查是否有旧数据
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
    finally:
        db.close()


# 初始化数据库
Base.metadata.create_all(bind=engine)

# 数据迁移
migrate_existing_data()

app = FastAPI(title="A股交易指导助手", version="2.0.0")

# CORS（允许前端跨域）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(positions.router)
app.include_router(analysis.router)
app.include_router(recommendation.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.get("/")
def root():
    return {"message": "A股交易指导助手 API 运行中", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
