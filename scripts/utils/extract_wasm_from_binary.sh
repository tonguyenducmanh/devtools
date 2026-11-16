#!/bin/sh
# Trích lại wasm đã build sẵn từ một bản daemon release, đưa về src_wasm/pkg/.
#
# Vì sao cần?
# ------------
# `src_wasm/pkg/` là thư mục gitignored (~26 MB wasm đã build) nên clone mới
# KHÔNG có. Muốn build lại wasm thì phải cài cả Rust + wasm-pack + .NET SDK +
# trunk (nặng, chậm, tốn nhiều thời gian).
#
# Nhưng nếu đã có sẵn 1 bản daemon release (binary Go nhúng `dist/` qua
# //go:embed all:dist), ta lấy lại ĐÚNG wasm đã build sẵn trong đó — không
# cần toolchain, không cần mạng, và khớp 100% với bản release đó.
#
# Cross-platform
# --------------
# Script này chỉ là lớp bọc quanh `scripts/utils/extract_go_embed.go`.
# Toàn bộ việc đọc binary (ELF/Mach-O/PE) và giải nén archive do Go standard
# library làm, nên chạy được trên macOS, Linux và Windows (Git Bash / WSL),
# không cần readelf/strings/tar/unzip/python. Chỉ cần Go — thứ backend đã bắt
# buộc phải có để build.
#
# Cách dùng:
#   ./scripts/utils/extract_wasm_from_binary.sh <binary|archive> [version]
#   ./scripts/utils/extract_wasm_from_binary.sh ./out/dev-tool-linux-22.0.4
#   ./scripts/utils/extract_wasm_from_binary.sh ./out/dev-tool-linux-22.0.4.tar.gz
#   ./scripts/utils/extract_wasm_from_binary.sh ./out/dev-tool-window-22.0.4.exe.zip 22.0.4
#
# Kết quả: src_wasm/pkg/<rdp|ultraviewer|dotnet|cimbar|photocraft>/...
# (đúng cấu trúc viteStaticCopy mong đợi khi copy sang
#  dist/assets-wasm-<version>/<tên>/)
#
# Windows không có sh? Chạy thẳng Go:
#   go run scripts/utils/extract_go_embed.go -out src_wasm/pkg .\out\dev-tool-window-22.0.4.exe.zip
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
GO_TOOL_REL="scripts/utils/extract_go_embed.go"
PKG_DIR_REL="src_wasm/pkg"

usage() {
    cat >&2 <<EOF
Cách dùng: $0 <binary|archive> [version]

Ví dụ:
  $0 ./out/dev-tool-linux-22.0.4
  $0 ./out/dev-tool-linux-22.0.4.tar.gz
  $0 ./out/dev-tool-window-22.0.4.exe.zip 22.0.4

Kết quả ghi vào: src_wasm/pkg/
EOF
}

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    usage
    exit 1
fi

INPUT="$1"
VERSION="${2:-}"

if [ ! -f "$INPUT" ]; then
    echo "LỖI: không thấy file '$INPUT'" >&2
    exit 1
fi
if [ ! -f "$ROOT_DIR/$GO_TOOL_REL" ]; then
    echo "LỖI: thiếu $GO_TOOL_REL (repo chưa đầy đủ?)" >&2
    exit 1
fi

# Chuyển input thành đường dẫn tuyệt đối TRƯỚC khi cd, để vẫn đúng ý người dùng
# khi họ truyền đường dẫn tương đối từ thư mục khác.
case "$INPUT" in
    /*) ABS_INPUT="$INPUT" ;;               # POSIX absolute (macOS/Linux/Git Bash)
    [A-Za-z]:[\\/]*) ABS_INPUT="$INPUT" ;;  # Windows drive path: C:\... hoặc C:/...
    *) ABS_INPUT="$(pwd)/$INPUT" ;;
esac

if ! command -v go >/dev/null 2>&1; then
    echo "LỖI: cần Go để đọc cấu trúc embed.FS trong binary." >&2
    echo "     Cài tại https://go.dev/dl/ (backend cũng cần Go để build)." >&2
    exit 1
fi

# Chạy từ gốc repo với đường dẫn tương đối: tránh lỗi chuyển đổi path kiểu
# /c/... -> C:\... của Git Bash trên Windows.
cd "$ROOT_DIR"

set -- -out "$PKG_DIR_REL"
if [ -n "$VERSION" ]; then
    set -- "$@" -version "$VERSION"
fi

exec go run "./$GO_TOOL_REL" "$@" "$ABS_INPUT"
