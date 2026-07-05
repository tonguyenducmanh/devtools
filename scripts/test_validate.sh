#!/bin/sh
# ============================================================
# Validate JSON Flow Schema
# Usage: ./scripts/test_validate.sh test/schemas/json-to-postgresql.schema.json
# ============================================================
set -e

SCHEMA_PATH=$1

if [ -z "$SCHEMA_PATH" ]; then
  echo "Usage: ./scripts/test_validate.sh <path-to-schema.json>"
  echo "Example: ./scripts/test_validate.sh test/schemas/json-to-postgresql.schema.json"
  exit 1
fi

echo "--- Bắt đầu validate schema ---"
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
node "$ROOT_DIR/test/validator/schema-validator.js" "$SCHEMA_PATH"
