#!/bin/sh
set -e

APP_NAME="./dist/tool-tomanh-agent"
DIST_DIR="dist"
OUT_DIR="out"
SRC_FILE="./src/extension/toolAPIAgent/tool_api_agent.go"

ZIP_WIN="$DIST_DIR/tool-tomanh-win32.zip"

log() {
  echo "\033[1;32m==> $1\033[0m"
}

mkdir -p "$DIST_DIR"

# Build window version and zip
log "Build Electron bundle for Windows (x64)"
npm run electron:build
rm -f "$ZIP_WIN"
cd "$OUT_DIR"
zip -r "../$ZIP_WIN" *-win32-x64
cd - >/dev/null

# Build mac version
log "Build Electron bundle for macOS"
npm run electron:build_mac
rm -rf "$DIST_DIR"/*-darwin-*
mv "$OUT_DIR"/*-darwin-* "$DIST_DIR/"

rm -rf "$OUT_DIR"

# Build Agent
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
