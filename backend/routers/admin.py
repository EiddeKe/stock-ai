"""管理员认证 + 用户管理 API"""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, AdminUser
from services.auth_service import hash_password, verify_password, create_admin_token, decode_admin_token

router = APIRouter(prefix="/api/admin", tags=["管理员"])

router_users = APIRouter(prefix="/api/admin/users", tags=["用户管理"])


def verify_admin(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> dict:
    """验证管理员 JWT"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="缺少认证信息")
    token = authorization.split(" ", 1)[1]
    info = decode_admin_token(token)
    if not info:
        raise HTTPException(status_code=401, detail="认证已过期")
    admin = db.query(AdminUser).filter(AdminUser.id == info["admin_id"]).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=403, detail="账号不可用")
    return info


class LoginReq(BaseModel):
    account: str
    password: str


class LoginResp(BaseModel):
    token: str
    account: str
    role: str


@router.post("/login", response_model=LoginResp)
def admin_login(data: LoginReq, db: Session = Depends(get_db)):
    """管理员登录"""
    admin = db.query(AdminUser).filter(AdminUser.account == data.account).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="账号或密码错误")
    if not verify_password(data.password, admin.hashed_pwd):
        raise HTTPException(status_code=401, detail="账号或密码错误")
    token = create_admin_token(admin.id, admin.role)
    return LoginResp(token=token, account=admin.account, role=admin.role)


class AdminItem(BaseModel):
    id: int
    account: str
    role: str
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


@router.get("/me", response_model=AdminItem)
def get_my_info(info: dict = Depends(verify_admin), db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.id == info["admin_id"]).first()
    return AdminItem(
        id=admin.id, account=admin.account, role=admin.role,
        is_active=admin.is_active, created_at=str(admin.created_at),
    )


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


@router_users.get("", response_model=UserListResponse)
def list_users(
    page: int = 1,
    page_size: int = 20,
    keyword: str = "",
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
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
                id=u.id, account=u.account, nickname=u.nickname,
                created_at=str(u.created_at), updated_at=str(u.updated_at) if u.updated_at else None,
            )
            for u in users
        ],
    }


@router_users.post("", response_model=UserItem)
def create_user(
    data: UserCreate,
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.account == data.account).first():
        raise HTTPException(status_code=400, detail="该账号已存在")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    user = User(account=data.account, nickname=data.nickname, hashed_pwd=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserItem(
        id=user.id, account=user.account, nickname=user.nickname,
        created_at=str(user.created_at), updated_at=str(user.updated_at) if user.updated_at else None,
    )


@router_users.put("/{user_id}", response_model=UserItem)
def update_user(
    user_id: int,
    data: UserUpdate,
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
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
        id=user.id, account=user.account, nickname=user.nickname,
        created_at=str(user.created_at), updated_at=str(user.updated_at) if user.updated_at else None,
    )


@router_users.delete("/{user_id}")
def delete_user(
    user_id: int,
    _=Depends(verify_admin),
    db: Session = Depends(get_db),
):
    from models import Position, ChatMessage, Subscription, UsageLog
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.query(Position).filter(Position.user_id == user_id).delete()
    db.query(Subscription).filter(Subscription.user_id == user_id).delete()
    db.query(UsageLog).filter(UsageLog.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "已删除"}
