// Command patch_wasm_dist sửa static site (trunk/xtask) để wasm được giải nén
// trong browser trước khi wasm-bindgen init.
//
// Lý do: Cloudflare Pages/Workers chặn file > 25 MiB. Khi wasm của craft lớn
// hơn mức đó, build script nén gzip thành `<name>_bg.wasm.gz` rồi script này
// sửa `index.html` để fetch file `.gz`, gunzip bằng `DecompressionStream`, rồi
// đưa bytes thô vào `init({ module_or_path })`.
//
// Hỗ trợ 2 dạng loader của upstream:
//
//  1. trunk — `photocraft`:
//     const wasm = await init({ module_or_path: './<name>_bg.wasm' });
//  2. `cargo xtask web` — các craft app nặng hơn, dựng site bằng xtask thay vì trunk:
//     await init({ module_or_path: new URL("<name>_bg.wasm" + v, location.href) });
//
// Bản Go thay cho `patch_wasm_dist.py`: không cần Python, chạy được trên
// macOS/Linux/Windows. Regex dùng Go (RE2) nên không có lookaround/non-capturing
// group — các pattern dưới đây đã được viết lại tương đương.
//
// Usage:
//
//	go run scripts/utils/patch_wasm_dist.go <index.html> <basename-of-wasm.gz> [--app Name]
package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

const gunzipHelperTemplate = `// The .wasm is stored gzip-compressed (.gz) to stay under Cloudflare's
// 25 MiB per-file limit; decompress it in the browser before loading.
if (typeof DecompressionStream === 'undefined') {
  throw new Error('__APP__ needs a browser with DecompressionStream support (Chrome 80+, Safari 16.4+, Firefox 113+)');
}
const gzResp = await fetch('./__GZ__');
if (!gzResp.ok) throw new Error('Fetching the wasm failed: ' + gzResp.status + ' ' + gzResp.statusText);
const wasmBytes = await new Response(gzResp.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
const wasm = await init({ module_or_path: wasmBytes });`

// `cargo xtask web` inlines the URL in an await-expression, no `const wasm =` prefix.
// `__SUFFIX__` giữ lại biểu thức cache-busting mà upstream gắn vào URL
// (thường là `+ v` với `v = "?v=" + build`) để URL .gz vẫn đổi theo từng build.
const gunzipHelperExprTemplate = `// The .wasm is stored gzip-compressed (.gz) to stay under Cloudflare's
// 25 MiB per-file limit; decompress it in the browser before loading.
if (typeof DecompressionStream === 'undefined') {
  throw new Error('__APP__ needs a browser with DecompressionStream support (Chrome 80+, Safari 16.4+, Firefox 113+)');
}
const gzResp = await fetch('./__GZ__'__SUFFIX__);
if (!gzResp.ok) throw new Error('Fetching the wasm failed: ' + gzResp.status + ' ' + gzResp.statusText);
const wasmBytes = await new Response(gzResp.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
await init({ module_or_path: wasmBytes });`

func render(tmpl, app, gz, suffix string) string {
	s := strings.ReplaceAll(tmpl, "__APP__", app)
	s = strings.ReplaceAll(s, "__GZ__", gz)
	s = strings.ReplaceAll(s, "__SUFFIX__", suffix)
	return s
}

// replaceFirstRegexp thay match ĐẦU TIÊN (tương đương re.subn(..., count=1)).
// fn nhận match đầy đủ và các nhóm con; trả về chuỗi thay thế.
func replaceFirstRegexp(re *regexp.Regexp, s string, fn func(match string, sub []string) string) (string, bool) {
	loc := re.FindStringSubmatchIndex(s)
	if loc == nil {
		return s, false
	}
	sub := make([]string, len(loc)/2)
	for i := 0; i < len(loc); i += 2 {
		if loc[i] >= 0 {
			sub[i/2] = s[loc[i]:loc[i+1]]
		}
	}
	repl := fn(s[loc[0]:loc[1]], sub)
	return s[:loc[0]] + repl + s[loc[1]:], true
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: patch_wasm_dist.go <index.html> <wasm.gz basename> [--app Name]")
}

func main() {
	// Tự parse để chấp nhận `--app` ở BẤT KỲ đâu (giống bản Python). Flag chuẩn
	// của Go dừng ở positional đầu tiên, mà caller lại truyền --app ở cuối.
	args := os.Args[1:]
	app := "This app"
	var positional []string
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--app", "-app":
			if i+1 >= len(args) {
				fmt.Fprintln(os.Stderr, "usage: --app <name> needs a value")
				os.Exit(1)
			}
			app = args[i+1]
			i++ // bỏ qua giá trị
		default:
			positional = append(positional, args[i])
		}
	}
	if len(positional) != 2 {
		usage()
		os.Exit(1)
	}

	htmlPath, wasmGz := positional[0], positional[1]
	wasmOrig := strings.TrimSuffix(wasmGz, ".gz")

	data, err := os.ReadFile(htmlPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "LỖI: không đọc được %s: %v\n", htmlPath, err)
		os.Exit(1)
	}
	s := string(data)
	original := s

	// 1) Bỏ <link rel="preload" ... _bg.wasm> đã cũ (file không còn tồn tại).
	preloadRe := regexp.MustCompile(`<link rel="preload" href="\./` + regexp.QuoteMeta(wasmOrig) + `"[^>]*>`)
	s, removed := replaceFirstRegexp(preloadRe, s, func(string, []string) string { return "" })
	if !removed || s == original {
		fmt.Printf("WARNING: preload link for %s not found (skipping removal)\n", wasmOrig)
	}

	// 2) Thay loader bằng fetch + gunzip + init.
	block := render(gunzipHelperTemplate, app, wasmGz, "")
	replaced := false

	// 2a) Dạng chính xác của trunk, rồi fallback bằng regex.
	oldCall := "const wasm = await init({ module_or_path: './" + wasmOrig + "' });"
	if strings.Contains(s, oldCall) {
		s = strings.Replace(s, oldCall, block, 1)
		replaced = true
	}
	if !replaced {
		trunkRe := regexp.MustCompile(`const wasm = await init\(\{ module_or_path: '[^']*\.wasm' \}\);`)
		s, replaced = replaceFirstRegexp(trunkRe, s, func(string, []string) string { return block })
	}

	// 2b) `cargo xtask web` nhúng URL trong biểu thức `await init(...)`.
	//     Giữ lại phần cache-busting phía sau tên file (vd `+ v`).
	if !replaced {
		exprRe := regexp.MustCompile(`await init\(\{ module_or_path: new URL\(\s*["'][^"']*_bg\.wasm["']((\s*\+\s*[A-Za-z_$][\w$]*)*)[^)]*\) \}\);`)
		s, replaced = replaceFirstRegexp(exprRe, s, func(_ string, sub []string) string {
			return render(gunzipHelperExprTemplate, app, wasmGz, sub[1])
		})
	}

	if !replaced {
		fmt.Println("WARNING: could not find the init call in index.html (leaving as-is)")
	}

	if err := os.WriteFile(htmlPath, []byte(s), 0o644); err != nil {
		fmt.Fprintf(os.Stderr, "LỖI: không ghi được %s: %v\n", htmlPath, err)
		os.Exit(1)
	}
	fmt.Printf("Patched %s: '%s' -> gzip-decompress loader\n", htmlPath, wasmOrig)
}
