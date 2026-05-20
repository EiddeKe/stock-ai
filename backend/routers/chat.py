"""AI 对话 API"""
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Position, ChatMessage, User
from schemas import ChatMessageCreate, ChatMessageResponse, ChatReply
from services.chat_service import chat, chat_stream
from services.quote_service import get_realtime_quote
from services.subscription_service import (
    check_subscription_limit, log_usage, calc_cost, enforce_monthly_budget,
)
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
    check_subscription_limit(current_user, db, action_type="chat", model=data.model)

    # 构建持仓上下文
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    if not positions:
        raise HTTPException(status_code=400, detail="请先添加持仓股票")

    ctx_lines = []
    for p in positions:
        quote = get_realtime_quote(p.symbol)
        current = quote["current_price"] if quote else p.cost_price
        profit = round((current - p.cost_price) / p.cost_price * 100, 2) if p.cost_price > 0 else 0
        ctx_lines.append(
            f"- {p.name}({p.symbol}): 成本 {p.cost_price}, 现价 {current}, 盈亏 {profit:+.2f}%, 持有 {p.shares} 股"
        )
    positions_context = "\n".join(ctx_lines)

    # 获取最近 20 条历史
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

    # 构建持仓数据列表
    positions_data = [
        {"symbol": p.symbol, "name": p.name, "cost_price": p.cost_price, "shares": p.shares}
        for p in positions
    ]

    # 调用 AI（返回 reply + tokens）
    reply, tokens = chat(
        model=data.model,
        positions_context=positions_context,
        history=history,
        user_message=data.message,
        enable_search=data.enable_search,
        positions=positions_data,
        investment_style=current_user.investment_style,
    )

    # 计算成本
    cost = calc_cost(data.model, tokens["input"], tokens["output"])

    # 保存 AI 回复
    ai_msg = ChatMessage(model=data.model, role="assistant", content=reply, user_id=current_user.id)
    db.add(ai_msg)

    # 月度预算检查
    if not enforce_monthly_budget(current_user, db, cost):
        db.commit()
        return ChatReply(reply=reply + "\n\n⚠ 注意：本月AI调用预算即将用完，请升级套餐。")

    try:
        log_usage(current_user.id, "chat", data.model, db, tokens_used=tokens["total"], cost=cost)
    except Exception:
        pass

    db.commit()
    return ChatReply(reply=reply)


def _build_positions_context(current_user, db):
    """构建持仓上下文，返回 (positions, positions_data, positions_context)"""
    positions = db.query(Position).filter(Position.user_id == current_user.id).all()
    if not positions:
        raise HTTPException(status_code=400, detail="请先添加持仓股票")

    ctx_lines = []
    for p in positions:
        quote = get_realtime_quote(p.symbol)
        current = quote["current_price"] if quote else p.cost_price
        profit = round((current - p.cost_price) / p.cost_price * 100, 2) if p.cost_price > 0 else 0
        ctx_lines.append(
            f"- {p.name}({p.symbol}): 成本 {p.cost_price}, 现价 {current}, 盈亏 {profit:+.2f}%, 持有 {p.shares} 股"
        )
    positions_data = [
        {"symbol": p.symbol, "name": p.name, "cost_price": p.cost_price, "shares": p.shares}
        for p in positions
    ]
    return positions, positions_data, "\n".join(ctx_lines)


@router.post("/stream")
def send_message_stream(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    token: str = Depends(auth_header),
):
    """发送消息给 AI（流式输出）"""
    if data.model not in ("qwen", "deepseek", "gemini"):
        raise HTTPException(status_code=400, detail="不支持的模型")

    current_user = get_current_user(token, db)
    check_subscription_limit(current_user, db, action_type="chat", model=data.model)

    positions, positions_data, positions_context = _build_positions_context(current_user, db)

    # 获取最近 20 条历史
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
    db.commit()

    # 流式生成
    def event_generator():
        full_reply = ""
        try:
            for chunk in chat_stream(
                model=data.model,
                positions_context=positions_context,
                history=history,
                user_message=data.message,
                enable_search=data.enable_search,
                positions=positions_data,
                investment_style=current_user.investment_style,
            ):
                full_reply += chunk
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'content': f'生成失败: {str(e)}', 'done': True, 'error': True})}\n\n"
            return

        # 保存 AI 回复
        try:
            tokens = {"input": 0, "output": 0, "total": 0}
            cost = calc_cost(data.model, tokens["input"], tokens["output"])
            ai_msg = ChatMessage(model=data.model, role="assistant", content=full_reply, user_id=current_user.id)
            db.add(ai_msg)
            if not enforce_monthly_budget(current_user, db, cost):
                full_reply += "\n\n⚠ 注意：本月AI调用预算即将用完，请升级套餐。"
                yield f"data: {json.dumps({'content': chr(10) + chr(10) + '⚠ 注意：本月AI调用预算即将用完，请升级套餐。', 'done': False})}\n\n"
            try:
                log_usage(current_user.id, "chat", data.model, db, tokens_used=tokens["total"], cost=cost)
            except Exception:
                pass
            db.commit()
        except Exception as e:
            print(f"保存消息失败: {e}")

        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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
