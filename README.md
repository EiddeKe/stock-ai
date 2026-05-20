# A股交易指导助手

AI 驱动的 A 股实时交易分析工具。

## 功能
- 持仓管理（添加/删除股票）
- 实时行情获取（通过 AKShare）
- AI 交易分析（通过通义千问 API）
- 技术指标（MACD/KDJ/RSI/均线/布林带）
- 全部持仓一键分析

## 技术栈
- 后端：Python FastAPI + SQLite
- 前端：Next.js 15 + React 19
- 行情数据：AKShare
- AI 分析：通义千问 qwen-max

## 配置

### 1. 设置通义千问 API Key
编辑 `backend/config.py`，将 `DASHSCOPE_API_KEY` 改为你的 Key：
```python
DASHSCOPE_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

申请地址：https://dashscope.console.aliyun.com/

### 2. 启动后端
```bash
cd backend
pip3 install -r ../requirements.txt  # 首次需要
chmod +x start.sh
./start.sh
```

### 3. 启动前端
```bash
cd frontend
npm install  # 首次需要
chmod +x start.sh
./start.sh
```

### 4. 访问
- Web 界面：http://localhost:3000
- API 文档：http://localhost:8000/docs

## 定时分析
编辑 `backend/config.py` 中的 `SCHEDULE_INTERVAL`（秒）：
```python
SCHEDULE_INTERVAL = 1800  # 每 30 分钟自动分析
```
设为 0 可关闭定时分析。
# stock-ai
