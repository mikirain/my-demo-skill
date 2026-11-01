@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BidScope backend · AI 助手
echo BidScope AI 助手后端：http://localhost:8787
echo 本窗口会实时打印每轮的问题、执行步骤与结果（Ctrl+C 停止）
echo.
npx tsx server/src/index.ts
pause
