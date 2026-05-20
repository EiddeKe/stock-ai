"""用户管理 API（管理员专用）"""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User
from services.auth_service import hash_password

router = APIRouter(prefix="/api/admin/users", tags=["用户管理"])


ADMIN_PASSWORD = "admin123"


def verify_admin(authorization: str | None = Header(default=None)) -> None:
    """验证管理员密码"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="缺少认证信息")
    token = authorization.split(" ", 1)[1]
    if token != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="管理员密码错误")


class UserItem(BaseModel):
    id: int
    account: str
    nickname: str
    created_at: str
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    total: int
    users: list[UserItem]


class UserCreate(BaseModel):
    account: str
    password: str
    nickname: str


class UserUpdate(BaseModel):
    account: Optional[str] = None
    password: Optional[str] = None
    nickname: Optional[str] = None


@router.get("", response_model=UserListResponse)
def list_users(
    page: int = 1,
    page_size: int = 20,
    keyword: str = "",
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """获取用户列表（分页 + 搜索）"""
    query = db.query(User)
    if keyword:
        query = query.filter(
            User.account.contains(keyword) | User.nickname.contains(keyword)
        )
    total = query.count()
    users = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "users": [
            UserItem(
                id=u.id,
                account=u.account,
                nickname=u.nickname,
                created_at=str(u.created_at),
                updated_at=str(u.updated_at) if u.updated_at else None,
            )
            for u in users
        ],
    }


@router.post("", response_model=UserItem)
def create_user(
    data: UserCreate,
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """创建新用户"""
    if db.query(User).filter(User.account == data.account).first():
        raise HTTPException(status_code=400, detail="该账号已存在")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    user = User(account=data.account, nickname=data.nickname, hashed_pwd=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserItem(
        id=user.id,
        account=user.account,
        nickname=user.nickname,
        created_at=str(user.created_at),
        updated_at=str(user.updated_at) if user.updated_at else None,
    )


@router.put("/{user_id}", response_model=UserItem)
def update_user(
    user_id: int,
    data: UserUpdate,
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """更新用户信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if data.account is not None:
        existing = db.query(User).filter(User.account == data.account, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="该账号已被其他用户使用")
        user.account = data.account
    if data.password is not None:
        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="密码至少 6 位")
        user.hashed_pwd = hash_password(data.password)
    if data.nickname is not None:
        if len(data.nickname) > 20:
            raise HTTPException(status_code=400, detail="昵称最多 20 个字符")
        user.nickname = data.nickname

    db.commit()
    db.refresh(user)
    return UserItem(
        id=user.id,
        account=user.account,
        nickname=user.nickname,
        created_at=str(user.created_at),
        updated_at=str(user.updated_at) if user.updated_at else None,
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
    """删除用户（同时删除关联的持仓和对话记录）"""
    from models import Position, ChatMessage
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.query(Position).filter(Position.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "已删除"}
