#!/bin/sh
set -e

echo "--- Xóa toàn bộ file dev_tool.db ---"
ROOT_DIR="${1:-.}"

find "$ROOT_DIR" -type f -name "dev_tool.db" | while read -r file; do
    rm -f "$file"
    echo "Deleted: $file"
done

echo "Xong!"