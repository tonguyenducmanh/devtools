#!/bin/sh
# ============================================================
# Sinh file Playwright .spec.ts từ JSON Flow Schema
# Usage: ./scripts/test_gen_playwright.sh test/schemas/json-to-postgresql.schema.json
#        ./scripts/test_gen_playwright.sh test/schemas/json-to-postgresql.schema.json test/generated/
# ============================================================
set -e

SCHEMA_PATH=$1
OUTPUT_DIR=${2:-"test/generated"}

if [ -z "$SCHEMA_PATH" ]; then
  echo "Usage: ./scripts/test_gen_playwright.sh <path-to-schema.json> [output-dir]"
  echo "Example: ./scripts/test_gen_playwright.sh test/schemas/json-to-postgresql.schema.json"
  exit 1
fi

echo "--- Bắt đầu gen Playwright test ---"
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
node "$ROOT_DIR/test/generator/playwright-generator.js" "$SCHEMA_PATH" "$OUTPUT_DIR"
echo "--- Chạy test: npx playwright test $OUTPUT_DIR ---"
