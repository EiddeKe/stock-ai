#!/bin/bash
# 启动前端服务
# 用法: ./start.sh [test|prod]  默认 test
cd "$(dirname "$0")"

ENV=${1:-test}

if [ -f ".env.${ENV}" ]; then
    set -a
    source ".env.${ENV}"
    set +a
fi

echo "启动 A股交易指导助手 Web (环境: $ENV)..."
echo "访问: http://localhost:3001"
echo ""
npx next dev --port 3001
