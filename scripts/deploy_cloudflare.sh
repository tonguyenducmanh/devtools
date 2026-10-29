#!/bin/sh
# Deploy frontend lên Cloudflare Pages — THỦ CÔNG (wrangler CLI).
#
# Vì sao deploy thủ công?
#   `src_wasm/pkg/` (wasm đã build, ~58 MB) là GITIGNORED, không nằm trong repo.
#   Nếu để Cloudflare Pages tự build qua Git integration, Pages chỉ checkout
#   code → không có `src_wasm/pkg/` → `npm run build` thiếu wasm (Remote Desktop,
#   .NET Wrapper và Craft tool đều hỏng). Nên build ở máy local rồi đẩy `dist/`.
#
# Cách dùng:
#   ./scripts/deploy_cloudflare.sh              # build frontend (dùng wasm có sẵn) rồi deploy
#   ./scripts/deploy_cloudflare.sh --build-wasm # build lại toàn bộ wasm trước khi deploy
#   ./scripts/deploy_cloudflare.sh --preview    # deploy bản preview (URL tạm, không lên production)
#
# Yêu cầu:
#   - Đã đăng nhập Cloudflare: `npx wrangler login`
#     hoặc đặt CLOUDFLARE_API_TOKEN (token có quyền "Cloudflare Pages: Edit").
#   - wasm phải build được từ trước (Rust/wasm-pack, .NET 10, trunk) —
#     xem ./scripts/build_wasm.sh.
set -e

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

WASM_SRC="$ROOT_DIR/src_wasm/pkg"
# Tên project lấy từ wrangler.jsonc; có thể override bằng biến môi trường.
PROJECT_NAME="${CLOUDFLARE_PROJECT_NAME:-devtools}"

BUILD_WASM=0
DEPLOY_MODE="production"

for arg in "$@"; do
    case "$arg" in
        --build-wasm)
            BUILD_WASM=1
            ;;
        --preview)
            DEPLOY_MODE="preview"
            ;;
        -h|--help)
            grep '^#' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            echo "Tham số lạ: $arg (xem --help)" >&2
            exit 1
            ;;
    esac
done

echo "========================================="
echo " Cloudflare Pages deploy (project: $PROJECT_NAME)"
echo "========================================="

# 1. Build lại wasm nếu được yêu cầu
if [ "$BUILD_WASM" -eq 1 ]; then
    echo ">>> Build wasm (IronRDP + .NET + craft tool)..."
    chmod +x ./scripts/build_wasm.sh
    ./scripts/build_wasm.sh
fi

# 2. src_wasm/pkg/ là gitignored nên phải kiểm tra trước khi build — thiếu thì
#    bản deploy sẽ không có Remote Desktop / .NET Wrapper / Craft tools.
if [ ! -d "$WASM_SRC" ] || [ -z "$(ls -A "$WASM_SRC" 2>/dev/null)" ]; then
    echo "LỖI: $WASM_SRC rỗng." >&2
    echo "      Chạy: ./scripts/build_wasm.sh   (hoặc deploy với --build-wasm)" >&2
    exit 1
fi

# 3. Build frontend (REQUIRE_WASM=1 để fail nếu thiếu bất kỳ folder wasm nào)
echo ">>> npm install..."
npm install

echo ">>> npm run build..."
REQUIRE_WASM=1 npm run build

# 4. Kiểm tra output
if [ ! -f "$ROOT_DIR/dist/index.html" ]; then
    echo "LỖI: dist/index.html không tồn tại sau khi build." >&2
    exit 1
fi

# 4b. Chặn file wasm thiếu (vd thư mục `snippets/` của wasm-bindgen bị làm phẳng)
#     trước khi đẩy lên Pages — nếu không, Pages trả index.html cho đường dẫn
#     không tồn tại và app Craft chết với lỗi MIME text/html.
echo ">>> Kiểm tra wasm trong dist..."
python3 "$ROOT_DIR/scripts/check_wasm_dist.py" "$ROOT_DIR/dist"

echo ">>> Nội dung dist/assets-wasm-<version>/:"
for dir in "$ROOT_DIR"/dist/assets-wasm-*/; do
    [ -d "$dir" ] || continue
    echo "    $(basename "$dir"): $(ls -1 "$dir" | wc -l) file"
done

# 5. Deploy
echo ">>> wrangler pages deploy ($DEPLOY_MODE)..."
if [ "$DEPLOY_MODE" = "preview" ]; then
    npx wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch preview
else
    npx wrangler pages deploy dist --project-name "$PROJECT_NAME"
fi

echo "========================================="
echo " DEPLOY XONG ($DEPLOY_MODE)"
echo "========================================="