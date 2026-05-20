"""配置文件"""
import os

# 通义千问 API Key（需要替换为你的 Key）
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "sk-2cf3725e6f0d46a3973c453b0d044573")

# 数据库路径
DATABASE_URL = "sqlite:///./stock_advisor.db"

# 定时分析间隔（秒），默认 30 分钟
SCHEDULE_INTERVAL = 1800

# DeepSeek API Key（OpenAI 兼容格式）
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-a4f52905826d4302bb2993610629ef07")

# 股票列表（用于定时分析）
SCHEDULED_SYMBOLS: list[str] = []

# JWT 配置
JWT_SECRET = os.getenv("JWT_SECRET", "stock-ai-secret-key-change-in-prod")
JWT_EXPIRE_DAYS = 7
