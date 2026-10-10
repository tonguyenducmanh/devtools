#!/usr/bin/env python3
"""Patch a trunk/xtask static site so its wasm is decompressed in the browser
before wasm-bindgen init.

Reason: Cloudflare Pages/Workers reject any single file over 25 MiB. When a
craft wasm is bigger than that, the build script gzips it (`<name>_bg.wasm.gz`)
and this script rewrites `index.html` to fetch the `.gz`, gunzip it with
`DecompressionStream`, then hand the raw bytes to `init({ module_or_path })`.

Two upstream loader shapes are supported:

1. trunk — `photocraft`, `vectorcraft`:
       const wasm = await init({ module_or_path: './<name>_bg.wasm' });
2. `cargo xtask web` — các craft app nặng hơn, dựng site bằng xtask thay vì trunk:
       await init({ module_or_path: new URL("<name>_bg.wasm" + v, location.href) });

Usage:
    patch_wasm_dist.py <index.html> <basename-of-wasm.gz> [--app Name]
"""
import re
import sys

GUNZIP_HELPER = (
    "// The .wasm is stored gzip-compressed (.gz) to stay under Cloudflare's\n"
    "// 25 MiB per-file limit; decompress it in the browser before loading.\n"
    "if (typeof DecompressionStream === 'undefined') {{\n"
    "  throw new Error('{app} needs a browser with DecompressionStream support (Chrome 80+, Safari 16.4+, Firefox 113+)');\n"
    "}}\n"
    "const gzResp = await fetch('./{gz}');\n"
    "if (!gzResp.ok) throw new Error('Fetching the wasm failed: ' + gzResp.status + ' ' + gzResp.statusText);\n"
    "const wasmBytes = await new Response(gzResp.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();\n"
    "const wasm = await init({{ module_or_path: wasmBytes }});"
)

# `cargo xtask web` inlines the URL in an await-expression, no `const wasm =` prefix.
# `{suffix}` giữ lại biểu thức cache-busting mà upstream gắn vào URL
# (thường là `+ v` với `v = "?v=" + build`) để URL .gz vẫn đổi theo từng build.#
GUNZIP_HELPER_EXPR = (
    "// The .wasm is stored gzip-compressed (.gz) to stay under Cloudflare's\n"
    "// 25 MiB per-file limit; decompress it in the browser before loading.\n"
    "if (typeof DecompressionStream === 'undefined') {{\n"
    "  throw new Error('{app} needs a browser with DecompressionStream support (Chrome 80+, Safari 16.4+, Firefox 113+)');\n"
    "}}\n"
    "const gzResp = await fetch('./{gz}'{suffix});\n"
    "if (!gzResp.ok) throw new Error('Fetching the wasm failed: ' + gzResp.status + ' ' + gzResp.statusText);\n"
    "const wasmBytes = await new Response(gzResp.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();\n"
    "await init({{ module_or_path: wasmBytes }});"
)


def main() -> None:
    argv = sys.argv[1:]
    app = "This app"
    if "--app" in argv:
        i = argv.index("--app")
        try:
            app = argv[i + 1]
            del argv[i : i + 2]
        except IndexError:
            sys.exit("usage: --app <name> needs a value")
    if len(argv) != 2:
        sys.exit(
            "usage: patch_wasm_dist.py <index.html> <wasm.gz basename> [--app Name]"
        )

    html_path, wasm_gz = argv
    wasm_orig = wasm_gz[:-3]  # strip ".gz"

    with open(html_path, encoding="utf-8") as f:
        s = f.read()
    original = s

    # 1) Drop the stale <link rel="preload" ... _bg.wasm> (the file no longer exists).
    s = re.sub(
        r'<link rel="preload" href="\./' + re.escape(wasm_orig) + r'"[^>]*>', "", s, count=1
    )
    if s == original:
        print(f"WARNING: preload link for {wasm_orig} not found (skipping removal)")

    # 2) Replace the loader with fetch + gunzip + init.
    block = GUNZIP_HELPER.format(app=app, gz=wasm_gz)
    replaced = False

    # 2a) trunk's exact form, then its regex fallback.
    old_call = "const wasm = await init({ module_or_path: './" + wasm_orig + "' });"
    if old_call in s:
        s = s.replace(old_call, block)
        replaced = True
    if not replaced:
        s, n = re.subn(
            r"const wasm = await init\(\{ module_or_path: '[^']*\.wasm' \}\);",
            lambda _m: block,
            s,
            count=1,
        )
        replaced = bool(n)

    # 2b) `cargo xtask web` inlines the URL inside an `await init(...)` expression.
    #     Giữ lại phần cache-busting phía sau tên file (vd `+ v`).#
    if not replaced:

        def _expr_repl(m):
            return GUNZIP_HELPER_EXPR.format(
                app=app, gz=wasm_gz, suffix=m.group(1) or ""
            )

        s, n = re.subn(
            r"await init\(\{ module_or_path: new URL\(\s*[\"'][^\"']*_bg\.wasm[\"']"
            r"((?:\s*\+\s*[A-Za-z_$][\w$]*)*)[^)]*\) \}\);",
            _expr_repl,
            s,
            count=1,
        )
        replaced = bool(n)

    if not replaced:
        print("WARNING: could not find the init call in index.html (leaving as-is)")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(s)
    print(f"Patched {html_path}: '{wasm_orig}' -> gzip-decompress loader")


if __name__ == "__main__":
    main()