#!/bin/sh
# Version của bản build: ưu tiên biến môi trường VERSION,
# không truyền thì lấy version trong package.json (giống cách lấy version UI)
#   VERSION=1.2.3 ./build_all.sh
. "$(dirname "$0")/scripts/tm_version.sh"
echo "Đang build version: $(tm_get_version)"

# cần build wasm mới thì mở ra
# chmod 777 ./scripts/build_wasm.sh
# ./scripts/build_wasm.sh
chmod 777 ./scripts/build_web_for_daemon.sh
./scripts/build_web_for_daemon.sh
chmod 777 ./scripts/build_api.sh
# ./scripts/build_api.sh
chmod 777 ./scripts/build_daemon.sh
./scripts/build_daemon.sh
