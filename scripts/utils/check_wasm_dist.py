#!/usr/bin/env python3
"""Kiểm tra thư mục wasm trong `dist/` sau `npm run build`.

Vì sao cần: wasm-bindgen sinh thêm thư mục `snippets/<crate>-<hash>/` và file
glue (ES module) import thẳng đường dẫn tương đối tới đó:

    import { egui_text_agent_activate } from './snippets/eframe-<hash>/inline0.js';

Nếu `viteStaticCopy` làm phẳng thư mục (glob `*`) thì file snippet không được
copy vào `dist/`. Lúc chạy, Cloudflare Pages trả `index.html` (text/html) cho
đường dẫn không tồn tại, và app chết với:

    Failed to load module script: Expected a JavaScript-or-Wasm module script
    but the server responded with a MIME type of "text/html"
    PhotoCraft failed to start TypeError: Failed to fetch dynamically imported module

Script này chỉ ra đúng file thiếu TRƯỚC khi deploy, thay vì để người dùng gặp.

Usage:
    check_wasm_dist.py <dist-dir>
"""
import json
import os
import re
import sys

# 25 MiB — giới hạn cứng cho mỗi file của Cloudflare Pages/Workers.
CF_MAX_BYTES = 25 * 1024 * 1024

# import ... from './x.js' | import './x.js' | export ... from './x.js'
IMPORT_RE = re.compile(
    r"""(?:from|import)\s*(?:\(\s*)?['"](\.[^'"]+)['"]""", re.MULTILINE
)


def check_imports(glue_path: str, problems: list) -> None:
    """Mọi import tương đối trong file glue phải tồn tại trên đĩa."""
    base = os.path.dirname(glue_path)
    with open(glue_path, encoding="utf-8", errors="replace") as f:
        source = f.read()
    for spec in sorted(set(IMPORT_RE.findall(source))):
        target = os.path.normpath(os.path.join(base, spec.split("?")[0]))
        if not os.path.exists(target):
            problems.append(
                f"{os.path.basename(glue_path)}: thiếu {spec} "
                f"(không thấy {os.path.relpath(target, base)})"
            )


def check_craft_app(app_dir: str, problems: list) -> None:
    """App craft nạp qua manifest.json: glue + wasm + mọi import của glue."""
    manifest_path = os.path.join(app_dir, "manifest.json")
    try:
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
    except (OSError, ValueError) as e:
        problems.append(f"{manifest_path}: không đọc được manifest ({e})")
        return

    glue = os.path.join(app_dir, manifest.get("glue") or "")
    wasm = os.path.join(app_dir, manifest.get("wasm") or "")
    for label, path in (("glue", glue), ("wasm", wasm)):
        if not manifest.get(label):
            problems.append(f"{manifest_path}: manifest thiếu khoá '{label}'")
        elif not os.path.isfile(path):
            problems.append(f"{manifest_path}: {label} {os.path.basename(path)} không tồn tại")
    if os.path.isfile(glue):
        check_imports(glue, problems)


def main() -> int:
    if len(sys.argv) != 2:
        sys.exit("usage: check_wasm_dist.py <dist-dir>")

    dist = sys.argv[1]
    if not os.path.isdir(dist):
        sys.exit(f"ERROR: {dist} không tồn tại (chạy npm run build trước)")

    wasm_roots = sorted(
        os.path.join(dist, name)
        for name in os.listdir(dist)
        if name.startswith("assets-wasm-") and os.path.isdir(os.path.join(dist, name))
    )
    if not wasm_roots:
        sys.exit(f"ERROR: không có thư mục assets-wasm-* trong {dist}")

    problems: list = []
    app_count = 0
    for root in wasm_roots:
        for app in sorted(os.listdir(root)):
            app_dir = os.path.join(root, app)
            if not os.path.isdir(app_dir):
                continue
            app_count += 1
            if os.path.isfile(os.path.join(app_dir, "manifest.json")):
                check_craft_app(app_dir, problems)

        for dirpath, _dirnames, filenames in os.walk(root):
            for name in filenames:
                path = os.path.join(dirpath, name)
                size = os.path.getsize(path)
                if size > CF_MAX_BYTES:
                    problems.append(
                        f"{os.path.relpath(path, root)}: {size / 1024 / 1024:.1f} MiB "
                        f"vượt giới hạn 25 MiB của Cloudflare"
                    )

    if problems:
        print(f"ERROR: wasm trong {dist} chưa sẵn sàng để deploy:", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        print(
            "  Gợi ý: xoá dist/ rồi build lại (`REQUIRE_WASM=1 npm run build`). "
            "Nếu vẫn thiếu, xem glob/stripBase của viteStaticCopy trong vite.config.js.",
            file=sys.stderr,
        )
        return 1

    print(f"OK: {app_count} folder wasm trong {', '.join(os.path.basename(r) for r in wasm_roots)} hợp lệ")
    return 0


if __name__ == "__main__":
    sys.exit(main())
