#!/bin/bash
# 启动前端服务
cd "$(dirname "$0")"
echo "启动 A股交易指导助手 Web..."
echo "访问: http://localhost:3001"
echo ""
npx next dev --port 3001
