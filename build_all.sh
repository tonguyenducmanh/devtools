#!/bin/sh
set -e

APP_NAME="./out/tool-tomanh-agent"
SRC_FILE="./src/extension/toolAPIAgent/web/tool_api_agent.go"

# build app desktop
npm run desktop:build

# build Agent
GOOS=darwin GOARCH=amd64 go build -o ${APP_NAME}-mac-intel ${SRC_FILE}

GOOS=darwin GOARCH=arm64 go build -o ${APP_NAME}-mac-arm ${SRC_FILE}

GOOS=linux GOARCH=amd64 go build -o ${APP_NAME}-linux ${SRC_FILE}

GOOS=linux GOARCH=arm64 go build -o ${APP_NAME}-linux-arm ${SRC_FILE}

GOOS=windows GOARCH=amd64 go build -o ${APP_NAME}.exe ${SRC_FILE}

GOOS=windows GOARCH=arm64 go build -o ${APP_NAME}-arm.exe ${SRC_FILE}
