#!/bin/sh
# Lấy version dùng chung cho toàn bộ app (UI + BE)
#
# Nguồn version (theo thứ tự ưu tiên):
#   1. Biến môi trường VERSION khi build:  VERSION=1.2.3 ./build_all.sh
#   2. Ô "version" trong package.json (đây cũng chính là version mà Vite nạp
#      cho UI qua import.meta.env.PACKAGE_VERSION)
#
# Cách dùng:
#   . "$ROOT_DIR/scripts/tm_version.sh"
#   VERSION=$(tm_get_version)
#   LDFLAGS=$(tm_get_go_ldflags "$VERSION")

# tìm thư mục gốc của project = thư mục gần nhất chứa package.json,
# tìm từ thư mục hiện tại đi ngược lên (đây cũng là nơi chứa file này)
tm_find_root_dir() {
    tm_dir=$(pwd)
    while [ "$tm_dir" != "/" ] && [ "$tm_dir" != "." ]; do
        if [ -f "$tm_dir/package.json" ]; then
            echo "$tm_dir"
            return 0
        fi
        tm_dir=$(dirname "$tm_dir")
    done
    return 1
}

# đọc version hiện tại của app
tm_get_version() {
    # ưu tiên version truyền từ bên ngoài: VERSION=1.2.3 ./build_all.sh
    if [ -n "$VERSION" ]; then
        echo "$VERSION"
        return 0
    fi

    tm_pkg_json="$(tm_find_root_dir)/package.json"
    if [ ! -f "$tm_pkg_json" ]; then
        echo "Lỗi: không tìm thấy file package.json" >&2
        return 1
    fi

    tm_version=$(node -p "require('$tm_pkg_json').version" 2>/dev/null)
    if [ -z "$tm_version" ]; then
        echo "Lỗi: không đọc được version trong file package.json" >&2
        return 1
    fi

    echo "$tm_version"
}

# tạo chuỗi ldflags để gắn version vào binary Go
# $1: version cần gắn
tm_get_go_ldflags() {
    echo "-X tm_config.Version=$1"
}
