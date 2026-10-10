#!/usr/bin/env python3
"""Patch the PhotoCraft static site so the wasm (stored gzip-compressed as
<name>_bg.wasm.gz) is decompressed in the browser before wasm-bindgen init.

Reason: Cloudflare Pages/Workers reject any single file over 25 MiB. The
PhotoCraft wasm is ~27 MB, so build.sh gzips it (~9 MB); this script rewrites
index.html to fetch the .gz, gunzip it with DecompressionStream, then hand the
raw bytes to init({ module_or_path }).

Usage:
    patch_dist.py <index.html> <basename-of-wasm.gz>
"""
import re
import sys


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: patch_dist.py <index.html> <wasm.gz basename>")
    html_path, wasm_gz = sys.argv[1], sys.argv[2]
    wasm_orig = wasm_gz[:-3]  # strip ".gz"

    with open(html_path, encoding="utf-8") as f:
        s = f.read()

    # 1) Drop the stale <link rel="preload" ... _bg.wasm> (the file no longer exists).
    s2 = re.sub(
        r'<link rel="preload" href="\./' + re.escape(wasm_orig) + r'"[^>]*>',
        "",
        s,
        count=1,
    )
    if s2 == s:
        print(f"WARNING: preload link for {wasm_orig} not found (skipping removal)")

    # 2) Replace trunk's init call with fetch + gunzip + init.
    old_call = "const wasm = await init({ module_or_path: './" + wasm_orig + "' });"
    new_block = (
        "// The .wasm is stored gzip-compressed (.gz) to stay under Cloudflare's\n"
        "// 25 MiB per-file limit; decompress it in the browser before loading.\n"
        "if (typeof DecompressionStream === 'undefined') {\n"
        "  throw new Error('PhotoCraft needs a browser with DecompressionStream support (Chrome 80+, Safari 16.4+, Firefox 113+)');\n"
        "}\n"
        "const gzResp = await fetch('./" + wasm_gz + "');\n"
        "if (!gzResp.ok) throw new Error('Fetching the wasm failed: ' + gzResp.status + ' ' + gzResp.statusText);\n"
        "const wasmBytes = await new Response(gzResp.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();\n"
        "const wasm = await init({ module_or_path: wasmBytes });"
    )
    if old_call in s2:
        s2 = s2.replace(old_call, new_block)
    else:
        s2, n = re.subn(
            r"const wasm = await init\(\{ module_or_path: '[^']*\.wasm' \}\);",
            lambda _m: new_block,
            s2,
            count=1,
        )
        if n == 0:
            print("WARNING: could not find the init call in index.html (leaving as-is)")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(s2)
    print(f"Patched {html_path}: '{wasm_orig}' -> gzip-decompress loader")


if __name__ == "__main__":
    main()