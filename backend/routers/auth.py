"""认证 API"""
import re
from fastapi import APIRouter, Depends, HTTPException, Header
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import InvestmentStyleUpdate
from services.auth_service import hash_password, verify_password, create_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["认证"])

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
PHONE_RE = re.compile(r"^1[3-9]\d{9}$")


def validate_account(account: str) -> bool:
    """校验手机号或邮箱格式"""
    return bool(EMAIL_RE.match(account)) or bool(PHONE_RE.match(account))


def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """从 JWT token 解析当前用户"""
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="无效的登录凭证")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


def auth_header(authorization: str | None = Header(default=None)) -> str:
    """从 Authorization header 提取 token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="缺少认证信息")
    return authorization.split(" ", 1)[1]


def get_current_user_dep(
    token: str = Depends(auth_header),
    db: Session = Depends(get_db),
) -> User:
    return get_current_user(token, db)


class RegisterReq(BaseModel):
    account: str
    password: str
    nickname: str
    agree_terms: bool = False


class LoginReq(BaseModel):
    account: str
    password: str


@router.post("/register")
def register(req: RegisterReq, db: Session = Depends(get_db)):
    """注册新用户"""
    if not req.agree_terms:
        raise HTTPException(status_code=400, detail="请先阅读并同意用户协议和隐私政策")
    if not validate_account(req.account):
        raise HTTPException(status_code=400, detail="请输入正确的手机号或邮箱")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    if len(req.nickname) > 20:
        raise HTTPException(status_code=400, detail="昵称最多 20 个字符")
    if db.query(User).filter(User.account == req.account).first():
        raise HTTPException(status_code=400, detail="该账号已被注册")
    user = User(
        account=req.account,
        nickname=req.nickname,
        hashed_pwd=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "user": {"id": user.id, "account": user.account, "nickname": user.nickname}}


@router.post("/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    """登录"""
    user = db.query(User).filter(User.account == req.account).first()
    if not user or not verify_password(req.password, user.hashed_pwd):
        raise HTTPException(status_code=401, detail="账号或密码错误")
    user.last_login = datetime.now()
    db.commit()
    return {"token": create_token(user.id), "user": {"id": user.id, "account": user.account, "nickname": user.nickname}}


@router.get("/me")
def me(user: User = Depends(get_current_user_dep)):
    """获取当前用户信息"""
    return {
        "id": user.id,
        "account": user.account,
        "nickname": user.nickname,
        "agreed_terms_at": user.agreed_terms_at.isoformat() if user.agreed_terms_at else None,
        "investment_style": user.investment_style,
    }


@router.post("/me/agree-terms")
def agree_terms(user: User = Depends(get_current_user_dep), db: Session = Depends(get_db)):
    """记录用户同意协议和隐私政策"""
    user.agreed_terms_at = datetime.now()
    db.commit()
    return {"message": "已记录"}


@router.put("/me")
def update_me(
    nickname: str | None = None,
    old_password: str | None = None,
    new_password: str | None = None,
    user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """修改昵称或密码"""
    if nickname is not None:
        if len(nickname) > 20:
            raise HTTPException(status_code=400, detail="昵称最多 20 个字符")
        user.nickname = nickname
    if old_password and new_password:
        if not verify_password(old_password, user.hashed_pwd):
            raise HTTPException(status_code=400, detail="旧密码不正确")
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="新密码至少 6 位")
        user.hashed_pwd = hash_password(new_password)
    db.commit()
    return {"message": "已更新", "user": {"id": user.id, "account": user.account, "nickname": user.nickname}}


@router.get("/me/investment-style")
def get_investment_style(user: User = Depends(get_current_user_dep)):
    """获取当前用户的投资风格"""
    return {"investment_style": user.investment_style}


@router.put("/me/investment-style")
def update_investment_style(
    data: InvestmentStyleUpdate,
    user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """更新投资风格"""
    if data.investment_style not in ("short_term", "long_term"):
        raise HTTPException(status_code=400, detail="无效的投资风格，请选择短线或长线")
    user.investment_style = data.investment_style
    db.commit()
    return {"message": "已更新", "investment_style": user.investment_style}
