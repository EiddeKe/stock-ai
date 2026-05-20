"""配置文件"""
import os
from pathlib import Path

from dotenv import load_dotenv

# 根据 ENV 环境变量加载对应的 .env 文件
# ENV=test  → .env.test
# ENV=prod  → .env.prod
# 未设置    → .env.test（默认测试环境）
env = os.getenv("ENV", "test")
env_file = Path(__file__).resolve().parent.parent / f".env.{env}"
if env_file.exists():
    load_dotenv(env_file)

# AI 模型 API Keys
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# 数据库
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./stock_advisor.db")

# 定时分析
SCHEDULE_INTERVAL = int(os.getenv("SCHEDULE_INTERVAL", "1800"))
SCHEDULED_SYMBOLS: list[str] = os.getenv("SCHEDULED_SYMBOLS", "[]").strip("[]").replace(" ", "").split(",") if os.getenv("SCHEDULED_SYMBOLS", "").strip("[]").strip() else []

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))
