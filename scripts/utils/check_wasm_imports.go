// Command check_wasm_imports đọc import section của một file wasm và báo lỗi
// nếu module import từ `"env"`.
//
// Vì sao cần (AGENTS.md Luật 15): crate C (vd `zstd-sys` dùng `cc`) KHÔNG phát
// `cargo:rustc-link-lib` cho target wasm32-unknown-unknown, nên toàn bộ hàm C
// trở thành import từ module `"env"` mà trình duyệt không có. Module wasm khi đó
// KHÔNG instantiate được: tool chết ngay lúc load, log không nói gì.
//
// Bản Go thay cho đoạn Python nhúng trong `src_wasm/cimbar/build.sh` (và thay
// luôn one-liner grep byte trong AGENTS.md, vì đọc đúng cấu trúc wasm đáng tin
// hơn tìm chuỗi `\x03env` trong 2000 byte đầu).
//
// Usage:
//
//	go run scripts/utils/check_wasm_imports.go <file.wasm>
package main

import (
	"errors"
	"fmt"
	"os"
	"sort"
	"strings"
)

// readULEB đọc số nguyên LEB128 không dấu (định dạng của wasm binary format).
// pos được tăng tại chỗ.
func readULEB(data []byte, pos *int) (uint64, error) {
	var result uint64
	var shift uint
	for {
		if *pos < 0 || *pos >= len(data) {
			return 0, errors.New("đọc LEB128 vượt quá cuối file")
		}
		b := data[*pos]
		*pos = *pos + 1
		result |= uint64(b&0x7f) << shift
		if b&0x80 == 0 {
			return result, nil
		}
		shift += 7
		if shift >= 64 {
			return 0, errors.New("LEB128 quá lớn")
		}
	}
}

// skipULEB đọc và bỏ qua một số LEB128.
func skipULEB(data []byte, pos *int) error {
	_, err := readULEB(data, pos)
	return err
}

func checkFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if len(data) < 8 || string(data[:4]) != "\x00asm" {
		return errors.New("không phải file wasm hợp lệ (thiếu magic \\0asm)")
	}

	modules := map[string]bool{}
	pos := 8 // bỏ magic (4) + version (4)

	for pos < len(data) {
		sectionID := data[pos]
		pos++
		size, err := readULEB(data, &pos)
		if err != nil {
			return err
		}
		end := pos + int(size)
		if end < pos || end > len(data) {
			return fmt.Errorf("section %d vượt quá kích thước file", sectionID)
		}

		if sectionID == 2 { // import section
			count, err := readULEB(data, &pos)
			if err != nil {
				return err
			}
			for i := uint64(0); i < count; i++ {
				// module name
				n, err := readULEB(data, &pos)
				if err != nil {
					return err
				}
				if pos+int(n) > end {
					return errors.New("tên module vượt quá import section")
				}
				modules[string(data[pos:pos+int(n)])] = true
				pos += int(n)

				// field name
				n, err = readULEB(data, &pos)
				if err != nil {
					return err
				}
				if pos+int(n) > end {
					return errors.New("tên field vượt quá import section")
				}
				pos += int(n)

				// kind + descriptor
				if pos >= end {
					return errors.New("thiếu import kind")
				}
				kind := data[pos]
				pos++
				switch kind {
				case 0: // func: typeidx
					if err := skipULEB(data, &pos); err != nil {
						return err
					}
				case 1: // table: reftype + limits
					if pos >= end {
						return errors.New("thiếu table reftype")
					}
					pos++ // reftype
					flags, err := readULEB(data, &pos)
					if err != nil {
						return err
					}
					if err := skipULEB(data, &pos); err != nil { // min
						return err
					}
					if flags&1 != 0 {
						if err := skipULEB(data, &pos); err != nil { // max
							return err
						}
					}
				case 2: // memory: limits
					flags, err := readULEB(data, &pos)
					if err != nil {
						return err
					}
					if err := skipULEB(data, &pos); err != nil { // min
						return err
					}
					if flags&1 != 0 {
						if err := skipULEB(data, &pos); err != nil { // max
							return err
						}
					}
				case 3: // global: valtype + mut
					if pos+2 > end {
						return errors.New("global import bị cắt")
					}
					pos += 2
				case 4: // tag: attribute + typeidx
					if pos >= end {
						return errors.New("thiếu tag attribute")
					}
					pos++ // attribute
					if err := skipULEB(data, &pos); err != nil {
						return err
					}
				default:
					return fmt.Errorf("không đọc được import kind %d", kind)
				}
			}
		}

		pos = end
	}

	if modules["env"] {
		return errors.New("wasm import từ module 'env' — module sẽ không load trong trình duyệt")
	}

	names := make([]string, 0, len(modules))
	for name := range modules {
		names = append(names, name)
	}
	sort.Strings(names)
	if len(names) == 0 {
		fmt.Println("    import section OK: (không có import)")
	} else {
		fmt.Println("    import section OK: " + strings.Join(names, ", "))
	}
	return nil
}

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: check_wasm_imports.go <file.wasm>")
		os.Exit(2)
	}
	if err := checkFile(os.Args[1]); err != nil {
		fmt.Fprintf(os.Stderr, "LỖI: %v\n", err)
		os.Exit(1)
	}
}
