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
ZIP_MAC="$DIST_DIR/tool-tomanh-mac.zip"

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
# 2. BUILD ELECTRON MAC
# ===============================
log "Build Electron bundle for macOS"
npm run electron:build_mac

# log "Zip macOS bundle"
# rm -f "$ZIP_MAC"
# cd "$OUT_DIR"
# zip -r "../$ZIP_MAC" *-darwin-*
# cd - >/dev/null

rm -rf "$OUT_DIR"


# ===============================
# 3. BUILD ALL GO AGENTS
# ===============================

echo "==> Checking Go version"
go version

echo "==> Build macOS Intel (amd64)"
GOOS=darwin GOARCH=amd64 go build -o ${APP_NAME}-mac-intel ${SRC_FILE}

echo "==> Build macOS Apple Silicon (arm64)"
GOOS=darwin GOARCH=arm64 go build -o ${APP_NAME}-mac-arm ${SRC_FILE}

echo "==> Build Linux x86_64 (amd64)"
GOOS=linux GOARCH=amd64 go build -o ${APP_NAME}-linux ${SRC_FILE}

echo "==> Build Linux ARM64"
GOOS=linux GOARCH=arm64 go build -o ${APP_NAME}-linux-arm ${SRC_FILE}

echo "==> Build Windows x86_64 (amd64)"
GOOS=windows GOARCH=amd64 go build -o ${APP_NAME}.exe ${SRC_FILE}

echo "==> Build Windows ARM64"
GOOS=windows GOARCH=arm64 go build -o ${APP_NAME}-arm.exe ${SRC_FILE}

echo "==> Build completed successfully"
