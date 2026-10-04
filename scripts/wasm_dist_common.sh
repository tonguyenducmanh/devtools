#!/bin/sh
# Helper dùng chung cho các build script wasm (photocraft, vectorcraft):
# dọn static site vừa build ra để serve được trong app (và trên Cloudflare).
#
#   . "$SCRIPT_DIR/../scripts/wasm_dist_common.sh"
#   tm_prepare_wasm_dist "$OUTPUT_DIR" "PhotoCraft"
#
# TM_WASM_GZIP_THRESHOLD_MIB (mặc định 0): nén gzip wasm thành .wasm.gz và patch
# index.html cho browser tự giải nén (DecompressionStream) khi wasm LỚN HƠN ngưỡng.
# Mặc định 0 = LUÔN nén mọi file wasm, dù nhỏ: vừa để dưới giới hạn 25 MiB của
# Cloudflare (VectorCraft gốc ~47 MiB), vừa để tải nhanh hơn nhiều.

# Cloudflare Pages/Workers giới hạn 25 MiB cho mỗi file.
TM_WASM_MAX_MIB=25
TM_WASM_GZIP_THRESHOLD_MIB="${TM_WASM_GZIP_THRESHOLD_MIB:-0}"

# Thư mục chứa patch_wasm_dist.py. KHÔNG dùng `dirname "$0"`: khi file này được
# source từ build.sh thì $0 trỏ về build.sh (và build.sh đã `cd` sang external_repo),
# nên phải lấy đường dẫn của chính file này từ BASH_SOURCE.
tm_wasm_scripts_dir() {
    if [ -n "${BASH_SOURCE:-}" ]; then
        tm_d="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
        if [ -n "$tm_d" ] && [ -f "$tm_d/patch_wasm_dist.py" ]; then
            echo "$tm_d"
            return 0
        fi
    fi
    # Dự phòng: thử theo vị trí thường gặp khi helper được source từ sh script khác
    for tm_c in "$TM_WASM_FALLBACK_DIR" \
                "$TM_WASM_FALLBACK_DIR/scripts" \
                "./scripts" \
                "../scripts"; do
        [ -n "$tm_c" ] || continue
        if [ -f "$tm_c/patch_wasm_dist.py" ]; then
            echo "$(cd "$tm_c" && pwd)"
            return 0
        fi
    done
    return 1
}

tm_prepare_wasm_dist() {
    tm_dist="$1"
    tm_app="$2"

    if [ ! -d "$tm_dist" ]; then
        echo "ERROR: thư mục output $tm_dist không tồn tại" >&2
        return 1
    fi

    # 1. Nén wasm (luôn nén theo mặc định) để dưới giới hạn 25 MiB của Cloudflare
    tm_wasm="$(ls "$tm_dist"/*_bg.wasm 2>/dev/null | head -1 || true)"
    if [ -n "$tm_wasm" ]; then
        tm_size_bytes="$(wc -c < "$tm_wasm" | tr -d ' ')"
        tm_size_mib=$(( tm_size_bytes / 1024 / 1024 ))
        tm_max_bytes=$(( TM_WASM_GZIP_THRESHOLD_MIB * 1024 * 1024 ))
        if [ "$tm_size_bytes" -gt "$tm_max_bytes" ]; then
            tm_gz="$tm_wasm.gz"
            echo "[$tm_app] nén $(basename "$tm_wasm") (~${tm_size_mib} MiB) -> $(basename "$tm_gz")"
            gzip -9 -n -c "$tm_wasm" > "$tm_gz"
            rm -f "$tm_wasm"
            if ! command -v python3 >/dev/null 2>&1; then
                echo "ERROR: cần python3 để patch index.html (nén wasm)" >&2
                return 1
            fi
            tm_scripts="$(tm_wasm_scripts_dir)" || {
                echo "ERROR: không tìm thấy scripts/patch_wasm_dist.py" >&2
                return 1
            }
            python3 "$tm_scripts/patch_wasm_dist.py" \
                "$tm_dist/index.html" "$(basename "$tm_gz")" --app "$tm_app"
        else
            echo "[$tm_app] wasm ~${tm_size_mib} MiB, không vượt ngưỡng — giữ nguyên .wasm"
        fi
    else
        echo "[$tm_app] WARNING: không tìm thấy *_bg.wasm trong $tm_dist (bỏ qua bước nén)"
    fi

    # 2. Xoá file cấu hình host server không dùng (có thể gây 404/routing lạ)
    rm -f "$tm_dist/_headers" "$tm_dist/.htaccess" "$tm_dist/HOSTING.md" 2>/dev/null || true

    # 3. Ghi manifest.json: tên file glue/wasm có content-hash nên đổi theo từng
    #    build. Frontend đọc manifest để import glue mà không hard-code tên file
    #    (xem src/views/tools/Craft/TMCraftApp.vue).
    tm_glue="$(ls "$tm_dist"/*.js 2>/dev/null | grep -v '\.map$' | head -1 || true)"
    if [ -n "$tm_glue" ]; then
        tm_wasm_final="$(ls "$tm_dist"/*_bg.wasm "$tm_dist"/*_bg.wasm.gz 2>/dev/null | head -1 || true)"
        printf '{\n  "glue": "%s",\n  "wasm": "%s"\n}\n' \
            "$(basename "$tm_glue")" "$(basename "$tm_wasm_final")" > "$tm_dist/manifest.json"
        echo "[$tm_app] manifest: glue=$(basename "$tm_glue") wasm=$(basename "$tm_wasm_final")"
    else
        echo "[$tm_app] WARNING: không tìm thấy file glue .js trong $tm_dist (bỏ qua manifest)"
    fi

    # 4. Chặn file vượt giới hạn của Cloudflare trước khi commit
    if find "$tm_dist" -type f -size +${TM_WASM_MAX_MIB}MiB -print -quit | grep -q .; then
        echo "ERROR: có file vượt quá ${TM_WASM_MAX_MIB} MiB trong $tm_dist" >&2
        find "$tm_dist" -type f -size +${TM_WASM_MAX_MIB}MiB -exec ls -lh {} \;
        return 1
    fi

    echo "[$tm_app] site tĩnh sẵn sàng: $tm_dist"
    return 0
}