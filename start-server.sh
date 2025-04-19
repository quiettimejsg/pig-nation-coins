#!/bin/bash

# 设置错误时退出
set -e

echo "正在检查环境..."

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到 npm，请先安装 Node.js"
    exit 1
fi

# 检查 http-server 是否已全局安装
if ! command -v http-server &> /dev/null; then
    echo "需要安装 http-server..."
    echo "是否允许全局安装 http-server? (y/n)"
    read -r answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo "正在全局安装 http-server..."
        npm install -g http-server
    else
        echo "改为使用项目本地 http-server..."
        npm install --save-dev http-server
    fi
fi

# 检查 dist 目录是否存在
if [ ! -d "dist" ]; then
    echo "错误: dist 目录不存在，正在尝试构建项目..."
    # 安装依赖
    npm install
    # 构建项目
    npm run build
fi

# 检查 dist 目录是否为空
if [ ! "$(ls -A dist 2>/dev/null)" ]; then
    echo "错误: dist 目录为空，请确保项目已正确构建"
    exit 1
fi

# 获取本机 IP 地址
case "$(uname -s)" in
    Linux*)     IP_ADDRESS=$(hostname -I | cut -d' ' -f1);;
    Darwin*)    IP_ADDRESS=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1);;
    MINGW*|MSYS*|CYGWIN*) IP_ADDRESS=$(ipconfig | grep -i "IPv4" | head -n 1 | cut -d":" -f2);;
    *)          IP_ADDRESS="未知"
esac

echo "正在启动服务器..."
echo "请稍候..."

# 尝试关闭可能占用 8080 端口的进程
lsof -ti:8080 &>/dev/null && kill $(lsof -ti:8080) &>/dev/null || true

# 使用本地或全局 http-server
if command -v http-server &> /dev/null; then
    http-server dist -p 8080 --cors -a 0.0.0.0 &
else
    npx http-server dist -p 8080 --cors -a 0.0.0.0 &
fi
SERVER_PID=$!

# 等待几秒钟确保服务器启动
sleep 2

# 检查服务器是否成功启动
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "错误: 服务器启动失败"
    exit 1
fi

echo "==============================================="
echo "服务器已启动!"
echo "你可以通过以下地址访问:"
echo "本机访问: http://localhost:8080"
echo "局域网访问: http://$IP_ADDRESS:8080"
echo "==============================================="
echo "按 Ctrl+C 停止服务器"

# 清理函数
cleanup() {
    echo -e "\n正在停止服务器..."
    kill $SERVER_PID 2>/dev/null || true
    exit 0
}

# 注册清理函数
trap cleanup INT TERM

# 等待服务器进程
wait $SERVER_PID