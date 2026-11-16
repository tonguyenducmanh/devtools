// Command check_wasm_dist kiểm tra thư mục wasm trong `dist/` sau `npm run build`.
//
// Vì sao cần: wasm-bindgen sinh thêm thư mục `snippets/<crate>-<hash>/` và file
// glue (ES module) import thẳng đường dẫn tương đối tới đó:
//
//	import { egui_text_agent_activate } from './snippets/eframe-<hash>/inline0.js';
//
// Nếu `viteStaticCopy` làm phẳng thư mục (glob `*`) thì file snippet không được
// copy vào `dist/`. Lúc chạy, Cloudflare Pages trả `index.html` (text/html) cho
// đường dẫn không tồn tại, và app chết với:
//
//	Failed to load module script: Expected a JavaScript-or-Wasm module script
//	but the server responded with a MIME type of "text/html"
//
// Script này chỉ ra đúng file thiếu TRƯỚC khi deploy, thay vì để người dùng gặp.
//
// Bản Go thay cho `check_wasm_dist.py`: không cần Python, chỉ cần Go (backend đã
// bắt buộc có) và chạy được trên macOS/Linux/Windows.
//
// Usage:
//
//	go run scripts/utils/check_wasm_dist.go <dist-dir>
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// 25 MiB — giới hạn cứng cho mỗi file của Cloudflare Pages/Workers.
const cfMaxBytes = 25 * 1024 * 1024

// Tương đương regex Python `(?:from|import)\s*(?:\(\s*)?['"](\.[^'"]+)['"]`.
// Go (RE2) không hỗ trợ non-capturing group `(?:...)` nên dùng group thường;
// đường dẫn tương đối nằm ở group 3.
var importRe = regexp.MustCompile(`(from|import)\s*(\(\s*)?['"](\.[^'"]+)['"]`)

// checkImports đảm bảo mọi import tương đối trong file glue đều tồn tại trên đĩa.
func checkImports(gluePath string, problems *[]string) {
	base := filepath.Dir(gluePath)
	source, err := os.ReadFile(gluePath)
	if err != nil {
		*problems = append(*problems, fmt.Sprintf(
			"%s: không đọc được (%v)", filepath.Base(gluePath), err))
		return
	}

	// Gom unique rồi sort giống `sorted(set(...))` của bản Python.
	seen := map[string]bool{}
	var specs []string
	for _, m := range importRe.FindAllStringSubmatch(string(source), -1) {
		spec := m[3]
		if !seen[spec] {
			seen[spec] = true
			specs = append(specs, spec)
		}
	}
	sort.Strings(specs)

	for _, spec := range specs {
		cleanSpec := strings.SplitN(spec, "?", 2)[0]
		target := filepath.Clean(filepath.Join(base, cleanSpec))
		if _, err := os.Stat(target); err != nil {
			rel, relErr := filepath.Rel(base, target)
			if relErr != nil {
				rel = target
			}
			*problems = append(*problems, fmt.Sprintf(
				"%s: thiếu %s (không thấy %s)", filepath.Base(gluePath), spec, rel))
		}
	}
}

// checkCraftApp kiểm tra app craft nạp qua manifest.json: glue + wasm + mọi
// import của glue.
func checkCraftApp(appDir string, problems *[]string) {
	manifestPath := filepath.Join(appDir, "manifest.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		*problems = append(*problems, fmt.Sprintf("%s: không đọc được manifest (%v)", manifestPath, err))
		return
	}

	var manifest struct {
		Glue string `json:"glue"`
		Wasm string `json:"wasm"`
	}
	if err := json.Unmarshal(data, &manifest); err != nil {
		*problems = append(*problems, fmt.Sprintf("%s: không đọc được manifest (%v)", manifestPath, err))
		return
	}

	glue := filepath.Join(appDir, manifest.Glue)
	wasm := filepath.Join(appDir, manifest.Wasm)
	items := []struct{ label, value, path string }{
		{"glue", manifest.Glue, glue},
		{"wasm", manifest.Wasm, wasm},
	}
	for _, item := range items {
		if item.value == "" {
			*problems = append(*problems, fmt.Sprintf(
				"%s: manifest thiếu khoá '%s'", manifestPath, item.label))
			continue
		}
		if info, err := os.Stat(item.path); err != nil || info.IsDir() {
			*problems = append(*problems, fmt.Sprintf(
				"%s: %s %s không tồn tại", manifestPath, item.label, filepath.Base(item.path)))
		}
	}
	if info, err := os.Stat(glue); err == nil && !info.IsDir() {
		checkImports(glue, problems)
	}
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: check_wasm_dist.go <dist-dir>")
		os.Exit(2)
	}

	dist := os.Args[1]
	if info, err := os.Stat(dist); err != nil || !info.IsDir() {
		fmt.Fprintf(os.Stderr, "ERROR: %s không tồn tại (chạy npm run build trước)\n", dist)
		os.Exit(1)
	}

	entries, err := os.ReadDir(dist)
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: không đọc được %s: %v\n", dist, err)
		os.Exit(1)
	}

	var wasmRoots []string
	for _, ent := range entries {
		if ent.IsDir() && strings.HasPrefix(ent.Name(), "assets-wasm-") {
			wasmRoots = append(wasmRoots, filepath.Join(dist, ent.Name()))
		}
	}
	sort.Strings(wasmRoots)
	if len(wasmRoots) == 0 {
		fmt.Fprintf(os.Stderr, "ERROR: không có thư mục assets-wasm-* trong %s\n", dist)
		os.Exit(1)
	}

	var problems []string
	appCount := 0

	for _, root := range wasmRoots {
		apps, err := os.ReadDir(root)
		if err != nil {
			problems = append(problems, fmt.Sprintf("%s: không đọc được (%v)", root, err))
			continue
		}
		for _, app := range apps {
			if !app.IsDir() {
				continue
			}
			appDir := filepath.Join(root, app.Name())
			appCount++
			if _, err := os.Stat(filepath.Join(appDir, "manifest.json")); err == nil {
				checkCraftApp(appDir, &problems)
			}
		}

		// os.walk của Python -> filepath.WalkDir. Lỗi đọc file được bỏ qua giống
		// bản Python (chỉ kiểm tra được file nó thấy).
		_ = filepath.WalkDir(root, func(p string, d os.DirEntry, walkErr error) error {
			if walkErr != nil || d.IsDir() {
				return nil
			}
			info, err := d.Info()
			if err != nil {
				return nil
			}
			if info.Size() > cfMaxBytes {
				rel, relErr := filepath.Rel(root, p)
				if relErr != nil {
					rel = p
				}
				problems = append(problems, fmt.Sprintf(
					"%s: %.1f MiB vượt giới hạn 25 MiB của Cloudflare",
					rel, float64(info.Size())/1024/1024))
			}
			return nil
		})
	}

	if len(problems) > 0 {
		fmt.Fprintf(os.Stderr, "ERROR: wasm trong %s chưa sẵn sàng để deploy:\n", dist)
		for _, problem := range problems {
			fmt.Fprintf(os.Stderr, "  - %s\n", problem)
		}
		fmt.Fprintln(os.Stderr,
			"  Gợi ý: xoá dist/ rồi build lại (`REQUIRE_WASM=1 npm run build`). "+
				"Nếu vẫn thiếu, xem glob/stripBase của viteStaticCopy trong vite.config.js.")
		os.Exit(1)
	}

	names := make([]string, len(wasmRoots))
	for i, root := range wasmRoots {
		names[i] = filepath.Base(root)
	}
	fmt.Printf("OK: %d folder wasm trong %s hợp lệ\n", appCount, strings.Join(names, ", "))
}
