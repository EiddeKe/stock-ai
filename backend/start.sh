#!/bin/bash
# 启动后端服务
cd "$(dirname "$0")"
echo "启动 A股交易指导助手 后端服务..."
echo "API 文档: http://localhost:8000/docs"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
