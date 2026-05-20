"""定时任务调度"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database import SessionLocal
from models import Position, User
from routers.analysis import _analyze
from config import SCHEDULE_INTERVAL

scheduler = BackgroundScheduler()


def run_analysis_job():
    """定时分析全部用户的全部持仓"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            positions = db.query(Position).filter(Position.user_id == user.id).all()
            for p in positions:
                try:
                    result = _analyze(p, db)
                    print(f"[定时分析] {user.nickname} - {p.name}: {result.suggestion} (置信度 {result.confidence}%)")
                except Exception as e:
                    print(f"[定时分析] {user.nickname} - {p.name} 失败: {e}")
    finally:
        db.close()


def start_scheduler():
    """启动定时任务"""
    if SCHEDULE_INTERVAL <= 0:
        return
    scheduler.add_job(
        run_analysis_job,
        trigger=IntervalTrigger(seconds=SCHEDULE_INTERVAL),
        id="auto_analysis",
        replace_existing=True,
    )
    scheduler.start()
    print(f"[定时任务] 已启动，每 {SCHEDULE_INTERVAL} 秒分析一次全部用户持仓")
