"""数据库模型"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
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

    positions = relationship("Position", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="owner")


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
