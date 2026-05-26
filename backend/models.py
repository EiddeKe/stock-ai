"""数据库模型"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    account = Column(String(100), unique=True, nullable=False, comment="手机号或邮箱")
    nickname = Column(String(50), nullable=False, comment="昵称")
    hashed_pwd = Column(String(200), nullable=False, comment="bcrypt 密码哈希")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    investment_style = Column(String(20), nullable=True, comment="投资风格: short_term/long_term")
    last_login = Column(DateTime, nullable=True, comment="最近登录时间")

    positions = relationship("Position", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="owner")
    subscriptions = relationship("Subscription", back_populates="user")
    usage_logs = relationship("UsageLog", back_populates="user")


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="所属用户")
    symbol = Column(String(10), nullable=False, comment="股票代码")
    name = Column(String(50), nullable=False, comment="股票名称")
    cost_price = Column(Float, nullable=False, comment="买入成本价")
    shares = Column(Integer, nullable=False, comment="持股数量")
    buy_date = Column(DateTime, default=datetime.now, comment="买入日期")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    owner = relationship("User", back_populates="positions")

    @property
    def cost_total(self) -> float:
        return self.cost_price * self.shares


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="所属用户")
    model = Column(String(20), nullable=False, comment="模型: qwen/deepseek")
    role = Column(String(20), nullable=False, comment="角色: user/assistant")
    content = Column(Text, nullable=False, comment="消息内容")
    created_at = Column(DateTime, default=datetime.now)

    owner = relationship("User", back_populates="chat_messages")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, comment="套餐名称")
    code = Column(String(30), unique=True, nullable=False, comment="唯一标识，如 free/pro/premium")
    price_monthly = Column(DECIMAL(10, 2), nullable=False, default=0, comment="月付价格（元）")
    price_yearly = Column(DECIMAL(10, 2), nullable=False, default=0, comment="年付价格（元）")
    description = Column(String(500), nullable=True, comment="套餐描述")
    features = Column(JSON, nullable=False, comment="功能特性列表")
    ai_calls_per_day = Column(Integer, nullable=False, default=0, comment="每日AI调用次数，-1=无限制")
    max_models = Column(Integer, nullable=False, default=1, comment="允许的AI模型数量")
    priority = Column(Integer, nullable=False, default=0, comment="排序权重")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否上架")
    created_at = Column(DateTime, default=datetime.now)

    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="所属用户")
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False, comment="套餐ID")
    status = Column(String(20), nullable=False, default="active", comment="状态: active/expired/cancelled/trial")
    start_at = Column(DateTime, nullable=False, comment="订阅开始时间")
    expire_at = Column(DateTime, nullable=False, comment="订阅到期时间")
    payment_method = Column(String(20), nullable=True, comment="支付方式: wechat/alipay/manual")
    payment_id = Column(String(100), nullable=True, comment="外部支付流水号")
    amount_paid = Column(DECIMAL(10, 2), nullable=True, comment="实际支付金额")
    auto_renew = Column(Boolean, nullable=False, default=False, comment="是否自动续费")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="所属用户")
    action_type = Column(String(30), nullable=False, comment="操作类型: analysis/chat")
    model_used = Column(String(20), nullable=True, comment="使用的AI模型")
    tokens_used = Column(Integer, nullable=True, comment="消耗的token数")
    cost = Column(DECIMAL(10, 4), nullable=True, comment="单次调用成本")
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="usage_logs")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    account = Column(String(100), unique=True, nullable=False, comment="管理员账号")
    hashed_pwd = Column(String(200), nullable=False, comment="bcrypt 密码哈希")
    role = Column(String(20), nullable=False, default="admin", comment="角色: admin/readonly")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.now)
