#!/bin/bash
# 启动后端服务
# 用法: ./start.sh [test|prod]  默认 test
cd "$(dirname "$0")"

ENV=${1:-test}
export ENV

echo "启动 A股交易指导助手 后端服务 (环境: $ENV)..."
echo "API 文档: http://localhost:8000/docs"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
