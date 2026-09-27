#!/bin/sh
# Lấy version dùng chung cho toàn bộ app (UI + BE)
#
# Nguồn version (theo thứ tự ưu tiên):
#   1. Biến môi trường VERSION khi build:  VERSION=1.2.3 ./build_all.sh
#   2. Ô "version" trong package.json (đây cũng chính là version mà Vite nạp
#      cho UI qua import.meta.env.PACKAGE_VERSION)
#
# Cách dùng:
#   . "$ROOT_DIR/scripts/td_version.sh"
#   VERSION=$(td_get_version)
#   LDFLAGS=$(td_get_go_ldflags "$VERSION")

# tìm thư mục gốc của project = thư mục gần nhất chứa package.json,
# tìm từ thư mục hiện tại đi ngược lên (đây cũng là nơi chứa file này)
td_find_root_dir() {
    td_dir=$(pwd)
    while [ "$td_dir" != "/" ] && [ "$td_dir" != "." ]; do
        if [ -f "$td_dir/package.json" ]; then
            echo "$td_dir"
            return 0
        fi
        td_dir=$(dirname "$td_dir")
    done
    return 1
}

# đọc version hiện tại của app
td_get_version() {
    # ưu tiên version truyền từ bên ngoài: VERSION=1.2.3 ./build_all.sh
    if [ -n "$VERSION" ]; then
        echo "$VERSION"
        return 0
    fi

    td_pkg_json="$(td_find_root_dir)/package.json"
    if [ ! -f "$td_pkg_json" ]; then
        echo "Lỗi: không tìm thấy file package.json" >&2
        return 1
    fi

    td_version=$(node -p "require('$td_pkg_json').version" 2>/dev/null)
    if [ -z "$td_version" ]; then
        echo "Lỗi: không đọc được version trong file package.json" >&2
        return 1
    fi

    echo "$td_version"
}

# tạo chuỗi ldflags để gắn version vào binary Go
# $1: version cần gắn
td_get_go_ldflags() {
    echo "-X td_config.Version=$1"
}
