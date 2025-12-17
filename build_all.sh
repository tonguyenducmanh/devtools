#!/bin/sh
set -e

# ===============================
# CONFIG
# ===============================
APP_NAME="./dist/tool-tomanh-agent"
DIST_DIR="dist"
OUT_DIR="out"
SRC_FILE="./src/extension/toolAPIAgent/tool_api_agent.go"

ZIP_WIN="$DIST_DIR/tool-tomanh-win32.zip"

# ===============================
# HELPER
# ===============================
log() {
  echo "\033[1;32m==> $1\033[0m"
}

# ===============================
# CHECK ENV
# ===============================
log "Checking Node.js"
node -v

log "Checking npm"
npm -v

log "Checking Go"
go version

# ===============================
# PREPARE
# ===============================
log "Prepare dist directory"
mkdir -p "$DIST_DIR"

# ===============================
# 1. BUILD ELECTRON WINDOWS
# ===============================
log "Build Electron bundle for Windows (x64)"
npm run electron:build

log "Zip Windows bundle"
rm -f "$ZIP_WIN"
cd "$OUT_DIR"
zip -r "../$ZIP_WIN" *-win32-x64
cd - >/dev/null

# ===============================
# 2. BUILD ELECTRON MAC (MOVE, NOT ZIP)
# ===============================
log "Build Electron bundle for macOS"
npm run electron:build_mac

log "Move macOS bundle to dist"

# Xóa bundle mac cũ nếu tồn tại
rm -rf "$DIST_DIR"/*-darwin-*

# Move trực tiếp bundle sang dist
mv "$OUT_DIR"/*-darwin-* "$DIST_DIR/"

# Xóa out sau khi xong
rm -rf "$OUT_DIR"

# ===============================
# 3. BUILD ALL GO AGENTS
# ===============================
log "Build macOS Intel (amd64)"
GOOS=darwin GOARCH=amd64 go build -o ${APP_NAME}-mac-intel ${SRC_FILE}

log "Build macOS Apple Silicon (arm64)"
GOOS=darwin GOARCH=arm64 go build -o ${APP_NAME}-mac-arm ${SRC_FILE}

log "Build Linux x86_64 (amd64)"
GOOS=linux GOARCH=amd64 go build -o ${APP_NAME}-linux ${SRC_FILE}

log "Build Linux ARM64"
GOOS=linux GOARCH=arm64 go build -o ${APP_NAME}-linux-arm ${SRC_FILE}

log "Build Windows x86_64 (amd64)"
GOOS=windows GOARCH=amd64 go build -o ${APP_NAME}.exe ${SRC_FILE}

log "Build Windows ARM64"
GOOS=windows GOARCH=arm64 go build -o ${APP_NAME}-arm.exe ${SRC_FILE}

log "Build completed successfully"
