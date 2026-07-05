#!/bin/sh
# ============================================================
# Kiểm tra DEV đã cấy đủ data-testid theo schema chưa
# Usage: ./scripts/test_check_testids.sh test/schemas/json-to-postgresql.schema.json
#        ./scripts/test_check_testids.sh test/schemas/json-to-postgresql.schema.json src/views/tools
# ============================================================
set -e

SCHEMA_PATH=$1
SRC_DIR=${2:-"src"}

if [ -z "$SCHEMA_PATH" ]; then
  echo "Usage: ./scripts/test_check_testids.sh <path-to-schema.json> [src-dir]"
  echo "Example: ./scripts/test_check_testids.sh test/schemas/json-to-postgresql.schema.json src/"
  exit 1
fi

echo "--- Bắt đầu kiểm tra data-testid coverage ---"
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
node "$ROOT_DIR/test/checker/testid-checker.js" "$SCHEMA_PATH" "$SRC_DIR"
