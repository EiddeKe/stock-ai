"""推荐 API"""
import time
from fastapi import APIRouter, Query
from services.recommendation_service import get_recommendations

router = APIRouter(prefix="/api", tags=["热门推荐"])

# 缓存：热门推荐数据（30 分钟过期），按模型分别缓存
_recommendation_cache: dict = {
    "qwen": {"data": [], "expire_at": 0},
    "deepseek": {"data": [], "expire_at": 0},
}


@router.get("/recommendations")
def get_hot_recommendations(
    model: str = Query("qwen", enum=["qwen", "deepseek"]),
):
    """获取热门推荐：热门行业 + 推荐个股（支持模型切换）"""
    now = time.time()
    cache = _recommendation_cache.get(model, {"data": [], "expire_at": 0})

    # 检查缓存
    if now < cache["expire_at"] and cache["data"]:
        return {"data": cache["data"], "cached": True}

    # 获取推荐
    results = get_recommendations(model=model)

    # 更新缓存（30 分钟）
    _recommendation_cache[model] = {"data": results, "expire_at": now + 1800}

    return {"data": results, "cached": False}
