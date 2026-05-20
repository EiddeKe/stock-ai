"""AI 对话 API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Position, ChatMessage, User
from schemas import ChatMessageCreate, ChatMessageResponse, ChatReply
from services.chat_service import chat
from services.quote_service import get_realtime_quote
from services.subscription_service import check_subscription_limit, log_usage
from routers.auth import get_current_user, auth_header

router = APIRouter(prefix="/api/chat", tags=["AI对话"])


@router.get("", response_model=list[ChatMessageResponse])
def get_chat_history(
    model: str = Query(..., description="模型: qwen/deepseek/gemini"),
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """获取某个模型的对话历史"""
    current_user = get_current_user(token, db)
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.model == model, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return messages


@router.post("", response_model=ChatReply)
def send_message(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """发送消息给 AI"""
    if data.model not in ("qwen", "deepseek", "gemini"):
        raise HTTPException(status_code=400, detail="不支持的模型")

    current_user = get_current_user(token, db)
    check_subscription_limit(current_user, db, action_type="chat")

    # 构建持仓上下文
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    if not positions:
        raise HTTPException(status_code=400, detail="请先添加持仓股票")

    ctx_lines = []
    for p in positions:
        quote = get_realtime_quote(p.symbol)
        current = quote["current_price"] if quote else p.cost_price
        profit = round((current - p.cost_price) / p.cost_price * 100, 2)
        ctx_lines.append(
            f"- {p.name}({p.symbol}): 成本 {p.cost_price}, 现价 {current}, 盈亏 {profit:+.2f}%, 持有 {p.shares} 股"
        )
    positions_context = "\n".join(ctx_lines)

    # 获取最近 20 条历史（仅当前用户 + 当前模型）
    history_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.model == data.model, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(history_msgs)]

    # 保存用户消息
    user_msg = ChatMessage(model=data.model, role="user", content=data.message, user_id=current_user.id)
    db.add(user_msg)

    # 构建持仓数据列表（联网模式需要）
    positions_data = [
        {"symbol": p.symbol, "name": p.name, "cost_price": p.cost_price, "shares": p.shares}
        for p in positions
    ]

    # 调用 AI
    reply = chat(
        model=data.model,
        positions_context=positions_context,
        history=history,
        user_message=data.message,
        enable_search=data.enable_search,
        positions=positions_data,
    )

    # 保存 AI 回复
    ai_msg = ChatMessage(model=data.model, role="assistant", content=reply, user_id=current_user.id)
    db.add(ai_msg)
    try:
        log_usage(current_user.id, "chat", data.model, db)
    except Exception:
        pass

    db.commit()
    return ChatReply(reply=reply)


@router.delete("")
def clear_chat_history(
    model: str = Query(..., description="模型: qwen/deepseek/gemini"),
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """清空某个模型的对话历史"""
    current_user = get_current_user(token, db)
    db.query(ChatMessage).filter(ChatMessage.model == model, ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"message": f"已清空 {model} 对话历史"}
