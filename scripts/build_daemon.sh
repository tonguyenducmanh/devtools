#!/bin/sh
set -e

echo "--- Bắt đầu quy trình daemon ---"
ROOT_DIR=$(pwd)

# ĐỌC VERSION TỪ PACKAGE.JSON (giống cách Vite lấy version cho UI)
. "$ROOT_DIR/scripts/tm_version.sh"

VERSION=$(tm_get_version)

echo "Phiên bản hiện tại: $VERSION"

# gắn version vào binary Go, API health check sẽ trả về version này cho UI
LDFLAGS=$(tm_get_go_ldflags "$VERSION")

# Cấu hình đường dẫn
DAEMON_DIR="$ROOT_DIR/src_backend/tm_app/cmd/daemon_app"
WEB_APP_DIR="$ROOT_DIR/src_backend/tm_core_service/internal/web/dist/"
FRONTEND_DIST="$ROOT_DIR/dist"
OUTPUT_DIR="$ROOT_DIR/out"

OUTPUT_NAME="dev-tool"

rm -rf "$OUTPUT_DIR"

# Build Backend (Go daemon)
echo "Đang build Go daemon..."
cd "$DAEMON_DIR"

echo "Building for Mac Apple Silicon..."
GOOS=darwin GOARCH=arm64  \
go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT_NAME-mac-arm-$VERSION" .

echo "Building for Linux..."
GOOS=linux GOARCH=amd64  \
go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT_NAME-linux-$VERSION" .

echo "Building for Windows..."
GOOS=windows GOARCH=amd64  \
go build -ldflags "$LDFLAGS" -o "$OUTPUT_DIR/$OUTPUT_NAME-window-$VERSION.exe" .

# Nén binary rồi xoá bản thô, để out/ chỉ còn đúng những gì upload release.
#
# Vì sao mỗi OS một định dạng:
#   - macOS/Linux → tar.gz: tar+gzip có sẵn trong OS, và tar giữ quyền thực
#     thi nên giải nén ra chạy được luôn (zip thì thường phải chmod +x thủ công).
#   - Windows     → zip: double-click là giải nén, không cần cài 7-Zip; thêm nữa
#     GitHub Releases hiện cây thư mục xem trước cho .zip, còn .tar.gz chỉ là link.
#
# Mức nén: tar.gz dùng -6 (cho ra cùng dung lượng với -9 nhưng nhanh ~1.7 lần),
# zip dùng -9 vì nén theo từng entry để còn giải nén được từng phần.
echo "Đang nén binary..."

compress_binary() {
    tm_bin="$1"  # file đã build
    tm_name="$2" # tên file bên trong archive
    tm_kind="$3" # tar.gz | zip

    case "$tm_kind" in
    tar.gz)
        tar -czf "$tm_bin.tar.gz" -C "$(dirname "$tm_bin")" "$tm_name" || return 1
        ;;
    zip)
        (cd "$(dirname "$tm_bin")" && zip -9 -q "$(basename "$tm_bin").zip" "$tm_name") || return 1
        ;;
    *)
        return 1
        ;;
    esac

    # Chỉ xoá bản thô khi archive đã tạo ra và không rỗng — nếu nén lỗi thì
    # giữ lại binary để không mất kết quả build.
    [ -s "$tm_bin.$tm_kind" ] || return 1
    rm -f "$tm_bin"
}

for tm_file in "$OUTPUT_NAME-mac-arm-$VERSION" "$OUTPUT_NAME-linux-$VERSION"; do
    if ! command -v tar >/dev/null 2>&1; then
        echo "  GIỮ NGUYÊN $tm_file (không có lệnh tar)"
    elif compress_binary "$OUTPUT_DIR/$tm_file" "$tm_file" tar.gz; then
        echo "  $tm_file -> $tm_file.tar.gz (đã xoá bản thô)"
    else
        echo "  CẢNH BÁO nén $tm_file thất bại, giữ nguyên bản thô"
    fi
done

tm_win="$OUTPUT_NAME-window-$VERSION.exe"
if ! command -v zip >/dev/null 2>&1; then
    echo "  GIỮ NGUYÊN $tm_win (không có lệnh zip)"
elif compress_binary "$OUTPUT_DIR/$tm_win" "$tm_win" zip; then
    echo "  $tm_win -> $tm_win.zip (đã xoá bản thô)"
else
    echo "  CẢNH BÁO nén $tm_win thất bại, giữ nguyên bản thô"
fi

# Trở về thư mục gốc để xóa dist an toàn
cd "$ROOT_DIR"
rm -rf "$FRONTEND_DIST"

echo ""
echo "Kết quả build $VERSION trong $OUTPUT_DIR:"
ls -lh "$OUTPUT_DIR" | tail -n +2
echo "Tổng dung lượng: $(du -sh "$OUTPUT_DIR" | cut -f1)"

echo ""
echo "Build thành công phiên bản $VERSION!"