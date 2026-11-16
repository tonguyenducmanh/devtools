// Command extract_go_embed trích các file được nhúng bằng //go:embed ra đĩa từ
// một binary Go (Linux ELF, macOS Mach-O, Windows PE) — hoặc từ archive release
// (.tar.gz / .tgz / .tar / .zip) chứa binary đó.
//
// Vì sao cần
// ----------
// `src_wasm/pkg/` là thư mục gitignored (~26 MB wasm đã build) nên clone mới
// KHÔNG có, và muốn build lại wasm thì phải cài cả Rust/wasm-pack/.NET/trunk
// (nặng, chậm). Nhưng daemon release nhúng `dist/` qua `//go:embed all:dist`
// trong `internal/web/bl_web.go`, nên đọc thẳng embed.FS ra là lấy lại được
// đúng wasm đã build sẵn — không cần toolchain, không cần mạng.
//
// Vì sao viết bằng Go (thay vì Python + readelf)
// ----------------------------------------------
//   - Python cũ gọi `readelf` nên CHỈ chạy được trên Linux (macOS không có
//     readelf), và macOS còn không cài sẵn Python "sạch".
//   - Go standard library có sẵn `debug/elf`, `debug/macho`, `debug/pe` để đọc
//     CẢ BA định dạng binary trên MỌI hệ điều hành. Mà backend đã bắt buộc có Go
//     rồi, nên không phát sinh thêm dependency nào.
//   - Archive (.tar.gz/.zip) cũng giải nén bằng `archive/tar` + `archive/zip`,
//     bỏ luôn `tar`/`unzip`/`strings`/`find` khỏi shell script.
//
// Cấu trúc Go embed.FS trong binary
// ---------------------------------
//
//	embed.FS  = struct { files *[]file }
//	[]file    = slice header { ptr, len, cap }
//	file      = struct { name string; data string; hash [16]byte }
//	            -> 4 con trỏ + 16 byte hash (48 byte trên binary 64-bit)
//
// Lưu ý: `data` là `string` (2 word), KHÔNG phải `[]byte` (3 word) — sai chỗ
// này thì đọc ra toàn rác. Kích thước entry = 4*sizeof(pointer) + 16.
//
// Cách dùng
// ---------
//
//	# Trích wasm của bản release, thay thế toàn bộ src_wasm/pkg/
//	go run scripts/utils/extract_go_embed.go -out src_wasm/pkg \
//	    ./out/dev-tool-linux-22.0.4.tar.gz
//
//	# Liệt kê các version wasm có trong binary
//	go run scripts/utils/extract_go_embed.go -list ./out/dev-tool-mac-arm-22.0.4.tar.gz
//
//	# Trích cả frontend (index.html, assets/*.js) ra thư mục khác
//	go run scripts/utils/extract_go_embed.go -out /tmp/frontend -prefix "dist/" \
//	    ./out/dev-tool-linux-22.0.4
package main

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"debug/elf"
	"debug/macho"
	"debug/pe"
	"encoding/binary"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

const defaultSymbol = "tm_core_service/internal/web.embeddedFiles"

// stabTypeMask dùng để bỏ qua các entry debug (stab) trong bảng symbol Mach-O,
// giống cách `go tool nm` làm — nếu không sẽ gặp tên rác/trùng.
const stabTypeMask = 0xe0

// objectImage trừu tượng hoá 3 định dạng binary: đọc theo địa chỉ ảo (VA) và
// tìm symbol. Mọi I/O đều qua io.ReaderAt nên đọc được cả file lẫn bytes trong
// bộ nhớ (archive đã giải nén).
type objectImage interface {
	io.ReaderAt
	offsetOf(va uint64) (int64, error)
	symbol(name string) (uint64, bool, error)
	ptrSize() int
	order() binary.ByteOrder
	format() string
}

// ---------- ELF (Linux) ----------

type elfImage struct {
	f *elf.File
	r io.ReaderAt
}

func (e *elfImage) ReadAt(p []byte, off int64) (int, error) { return e.r.ReadAt(p, off) }
func (e *elfImage) ptrSize() int {
	if e.f.Class == elf.ELFCLASS64 {
		return 8
	}
	return 4
}
func (e *elfImage) order() binary.ByteOrder { return e.f.ByteOrder }
func (e *elfImage) format() string {
	return fmt.Sprintf("ELF %s %s", e.f.Class, e.f.Machine)
}

// offsetOf ánh xạ địa chỉ ảo -> offset trong file qua các PT_LOAD segment.
// Dùng segment (không phải section) vì đó mới là thứ loader thật sự map, và
// không bị ảnh hưởng bởi section lạ do linker thêm vào.
func (e *elfImage) offsetOf(va uint64) (int64, error) {
	for _, p := range e.f.Progs {
		if p.Type != elf.PT_LOAD || p.Filesz == 0 {
			continue
		}
		if va >= p.Vaddr && va-p.Vaddr < p.Filesz {
			return int64(p.Off + (va - p.Vaddr)), nil
		}
	}
	// Dự phòng: binary có thể không có program header (object file).
	for _, s := range e.f.Sections {
		if s.Type == elf.SHT_NOBITS || s.Size == 0 {
			continue
		}
		if va >= s.Addr && va-s.Addr < s.Size {
			return int64(s.Offset + (va - s.Addr)), nil
		}
	}
	return 0, fmt.Errorf("địa chỉ 0x%x không ánh xạ được sang offset trong file ELF", va)
}

func (e *elfImage) symbol(name string) (uint64, bool, error) {
	if syms, err := e.f.Symbols(); err == nil {
		for _, s := range syms {
			if s.Name == name {
				return s.Value, true, nil
			}
		}
	}
	// Binary build bằng -buildmode=pie hoặc bị strip có thể chỉ còn dynamic sym.
	if syms, err := e.f.DynamicSymbols(); err == nil {
		for _, s := range syms {
			if s.Name == name {
				return s.Value, true, nil
			}
		}
	}
	return 0, false, nil
}

// ---------- Mach-O (macOS) ----------

type machoImage struct {
	f *macho.File
	r io.ReaderAt
}

func (m *machoImage) ReadAt(p []byte, off int64) (int, error) { return m.r.ReadAt(p, off) }
func (m *machoImage) ptrSize() int {
	if m.f.Magic == macho.Magic64 {
		return 8
	}
	return 4
}
func (m *machoImage) order() binary.ByteOrder { return m.f.ByteOrder }
func (m *machoImage) format() string {
	return fmt.Sprintf("Mach-O %s", m.f.Cpu)
}

func (m *machoImage) offsetOf(va uint64) (int64, error) {
	for _, l := range m.f.Loads {
		seg, ok := l.(*macho.Segment)
		if !ok || seg.Filesz == 0 {
			continue
		}
		if va >= seg.Addr && va-seg.Addr < seg.Filesz {
			return int64(seg.Offset + (va - seg.Addr)), nil
		}
	}
	return 0, fmt.Errorf("địa chỉ 0x%x không ánh xạ được sang offset trong file Mach-O", va)
}

func (m *machoImage) symbol(name string) (uint64, bool, error) {
	if m.f.Symtab == nil {
		return 0, false, nil
	}
	for _, s := range m.f.Symtab.Syms {
		if s.Type&stabTypeMask != 0 { // bỏ entry debug/stab
			continue
		}
		// Một số bảng symbol Mach-O thêm tiền tố "_" (quy ước C); tên symbol Go
		// thì không. Chấp nhận cả hai để không phụ thuộc linker.
		if s.Name == name || strings.TrimPrefix(s.Name, "_") == name {
			return s.Value, true, nil
		}
	}
	return 0, false, nil
}

// ---------- PE (Windows) ----------

type peImage struct {
	f         *pe.File
	r         io.ReaderAt
	imageBase uint64
}

func (p *peImage) ReadAt(b []byte, off int64) (int, error) { return p.r.ReadAt(b, off) }
func (p *peImage) ptrSize() int {
	if _, ok := p.f.OptionalHeader.(*pe.OptionalHeader64); ok {
		return 8
	}
	return 4
}
func (p *peImage) order() binary.ByteOrder { return binary.LittleEndian }
func (p *peImage) format() string {
	return fmt.Sprintf("PE machine=0x%x", p.f.Machine)
}

// offsetOf: địa chỉ ảo của PE = ImageBase + RVA; section lưu RVA.
func (p *peImage) offsetOf(va uint64) (int64, error) {
	if va < p.imageBase {
		return 0, fmt.Errorf("địa chỉ 0x%x nhỏ hơn ImageBase 0x%x", va, p.imageBase)
	}
	rva := va - p.imageBase
	for _, s := range p.f.Sections {
		if s.Size == 0 {
			continue
		}
		start := uint64(s.VirtualAddress)
		if rva >= start && rva-start < uint64(s.Size) {
			return int64(uint64(s.Offset) + (rva - start)), nil
		}
	}
	return 0, fmt.Errorf("RVA 0x%x không ánh xạ được sang offset trong file PE", rva)
}

// symbol: COFF lưu Value là offset TRONG section, nên địa chỉ thật =
// ImageBase + Section.VirtualAddress + Value (đúng như cmd/internal/objfile).
func (p *peImage) symbol(name string) (uint64, bool, error) {
	for _, s := range p.f.Symbols {
		if s.Name != name {
			continue
		}
		if s.SectionNumber <= 0 || int(s.SectionNumber) > len(p.f.Sections) {
			continue
		}
		sect := p.f.Sections[s.SectionNumber-1]
		return p.imageBase + uint64(sect.VirtualAddress) + uint64(s.Value), true, nil
	}
	return 0, false, nil
}

// ---------- Mở binary ----------

func openImage(r io.ReaderAt) (objectImage, error) {
	var magic [4]byte
	if n, err := r.ReadAt(magic[:], 0); n < 4 {
		return nil, fmt.Errorf("file quá ngắn hoặc không đọc được: %v", err)
	}

	switch {
	case magic[0] == 0x7f && magic[1] == 'E' && magic[2] == 'L' && magic[3] == 'F':
		f, err := elf.NewFile(r)
		if err != nil {
			return nil, fmt.Errorf("không parse được ELF: %w", err)
		}
		return &elfImage{f: f, r: r}, nil

	case magic[0] == 'M' && magic[1] == 'Z':
		f, err := pe.NewFile(r)
		if err != nil {
			return nil, fmt.Errorf("không parse được PE: %w", err)
		}
		img := &peImage{f: f, r: r}
		switch oh := f.OptionalHeader.(type) {
		case *pe.OptionalHeader64:
			img.imageBase = oh.ImageBase
		case *pe.OptionalHeader32:
			img.imageBase = uint64(oh.ImageBase)
		default:
			return nil, errors.New("file PE thiếu Optional Header — không xác định được ImageBase")
		}
		return img, nil

	default:
		f, err := macho.NewFile(r)
		if err != nil {
			return nil, fmt.Errorf("định dạng binary không hỗ trợ (chỉ nhận ELF/Mach-O/PE): %w", err)
		}
		return &machoImage{f: f, r: r}, nil
	}
}

// openInput nhận cả binary lẫn archive. Trả về ReaderAt, hàm đóng, và tên file
// bên trong (để suy ra version).
func openInput(p string) (io.ReaderAt, func() error, string, error) {
	lower := strings.ToLower(p)
	noop := func() error { return nil }

	switch {
	case strings.HasSuffix(lower, ".zip"):
		zr, err := zip.OpenReader(p)
		if err != nil {
			return nil, nil, "", fmt.Errorf("không mở được zip: %w", err)
		}
		data, name, err := readZip(zr)
		zr.Close()
		if err != nil {
			return nil, nil, "", err
		}
		return bytes.NewReader(data), noop, name, nil

	case strings.HasSuffix(lower, ".tar.gz"),
		strings.HasSuffix(lower, ".tgz"),
		strings.HasSuffix(lower, ".tar"):
		data, name, err := readTar(p)
		if err != nil {
			return nil, nil, "", err
		}
		return bytes.NewReader(data), noop, name, nil

	default:
		f, err := os.Open(p)
		if err != nil {
			return nil, nil, "", err
		}
		return f, f.Close, filepath.Base(p), nil
	}
}

// pickArchiveEntry chọn file binary trong archive: ưu tiên tên `dev-tool-*`,
// nếu không có thì lấy file thường đầu tiên (có thể dùng cho archive tự đóng
// gói tên khác).
func pickArchiveEntry(names []string) (string, error) {
	fallback := ""
	for _, name := range names {
		base := filepath.Base(name)
		if strings.HasPrefix(base, "dev-tool-") {
			return name, nil
		}
		if fallback == "" {
			fallback = name
		}
	}
	if fallback == "" {
		return "", errors.New("archive rỗng, không có file nào")
	}
	return fallback, nil
}

func readZip(zr *zip.ReadCloser) ([]byte, string, error) {
	var names []string
	byName := map[string]*zip.File{}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		names = append(names, f.Name)
		byName[f.Name] = f
	}
	picked, err := pickArchiveEntry(names)
	if err != nil {
		return nil, "", err
	}
	rc, err := byName[picked].Open()
	if err != nil {
		return nil, "", fmt.Errorf("không đọc được %q trong zip: %w", picked, err)
	}
	defer rc.Close()
	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, "", fmt.Errorf("không đọc hết %q: %w", picked, err)
	}
	return data, filepath.Base(picked), nil
}

func readTar(p string) ([]byte, string, error) {
	f, err := os.Open(p)
	if err != nil {
		return nil, "", err
	}
	defer f.Close()

	var rd io.Reader = f
	if strings.HasSuffix(strings.ToLower(p), ".gz") || strings.HasSuffix(strings.ToLower(p), ".tgz") {
		gz, err := gzip.NewReader(f)
		if err != nil {
			return nil, "", fmt.Errorf("không giải nén được gzip: %w", err)
		}
		defer gz.Close()
		rd = gz
	}

	// Đọc lần 1: ghi nhớ vị trí, vì tar chỉ đọc tuần tự.
	tr := tar.NewReader(rd)
	type tarEntry struct {
		name string
		data []byte
	}
	var entries []tarEntry
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, "", fmt.Errorf("archive tar hỏng: %w", err)
		}
		if hdr.Typeflag != tar.TypeReg {
			continue
		}
		data, err := io.ReadAll(tr)
		if err != nil {
			return nil, "", fmt.Errorf("không đọc hết %q: %w", hdr.Name, err)
		}
		entries = append(entries, tarEntry{name: hdr.Name, data: data})
	}
	if len(entries) == 0 {
		return nil, "", errors.New("archive tar rỗng, không có file nào")
	}
	names := make([]string, len(entries))
	for i, e := range entries {
		names[i] = e.name
	}
	picked, err := pickArchiveEntry(names)
	if err != nil {
		return nil, "", err
	}
	for _, e := range entries {
		if e.name == picked {
			return e.data, filepath.Base(picked), nil
		}
	}
	return nil, "", fmt.Errorf("không thấy %q trong archive", picked)
}

// ---------- Đọc cấu trúc embed.FS ----------

type embedEntry struct {
	name    string
	dataVA  uint64
	dataLen uint64
}

func readBytesAt(img objectImage, va uint64, n int) ([]byte, error) {
	if n < 0 {
		return nil, fmt.Errorf("kích thước âm: %d", n)
	}
	if n == 0 {
		return nil, nil
	}
	off, err := img.offsetOf(va)
	if err != nil {
		return nil, err
	}
	buf := make([]byte, n)
	if _, err := img.ReadAt(buf, off); err != nil {
		return nil, err
	}
	return buf, nil
}

func readUintAt(img objectImage, va uint64, size int) (uint64, error) {
	b, err := readBytesAt(img, va, size)
	if err != nil {
		return 0, err
	}
	switch size {
	case 8:
		return img.order().Uint64(b), nil
	case 4:
		return uint64(img.order().Uint32(b)), nil
	default:
		return 0, fmt.Errorf("kích thước con trỏ không hỗ trợ: %d", size)
	}
}

func readEntries(img objectImage, symbol string) ([]embedEntry, error) {
	symVA, ok, err := img.symbol(symbol)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, fmt.Errorf("không tìm thấy symbol %q trong binary "+
			"(binary có thể bị strip bằng -ldflags \"-s -w\")", symbol)
	}

	ptr := img.ptrSize()

	// embed.FS = struct { files *[]file } -> con trỏ tới slice header.
	fsPtr, err := readUintAt(img, symVA, ptr)
	if err != nil {
		return nil, fmt.Errorf("đọc con trỏ embed.FS: %w", err)
	}
	// []file slice header = { ptr, len, cap }
	filesPtr, err := readUintAt(img, fsPtr, ptr)
	if err != nil {
		return nil, fmt.Errorf("đọc slice header (ptr): %w", err)
	}
	count, err := readUintAt(img, fsPtr+uint64(ptr), ptr)
	if err != nil {
		return nil, fmt.Errorf("đọc slice header (len): %w", err)
	}
	// Chốt an toàn: dữ liệu hỏng có thể cho ra count khổng lồ -> OOM.
	if count > 10_000_000 {
		return nil, fmt.Errorf("số entry bất thường (%d) — cấu trúc embed.FS không như dự kiến", count)
	}

	entrySize := uint64(4*ptr + 16) // 4 con trỏ (2 string) + hash [16]byte
	entries := make([]embedEntry, 0, count)
	for i := uint64(0); i < count; i++ {
		base := filesPtr + i*entrySize
		namePtr, err := readUintAt(img, base, ptr)
		if err != nil {
			return nil, fmt.Errorf("entry #%d (name ptr): %w", i, err)
		}
		nameLen, err := readUintAt(img, base+uint64(ptr), ptr)
		if err != nil {
			return nil, fmt.Errorf("entry #%d (name len): %w", i, err)
		}
		dataVA, err := readUintAt(img, base+uint64(2*ptr), ptr)
		if err != nil {
			return nil, fmt.Errorf("entry #%d (data ptr): %w", i, err)
		}
		dataLen, err := readUintAt(img, base+uint64(3*ptr), ptr)
		if err != nil {
			return nil, fmt.Errorf("entry #%d (data len): %w", i, err)
		}
		if nameLen > 1<<20 {
			return nil, fmt.Errorf("entry #%d có tên quá dài (%d byte)", i, nameLen)
		}
		nameBytes, err := readBytesAt(img, namePtr, int(nameLen))
		if err != nil {
			return nil, fmt.Errorf("entry #%d (đọc tên): %w", i, err)
		}
		entries = append(entries, embedEntry{
			name:    string(nameBytes),
			dataVA:  dataVA,
			dataLen: dataLen,
		})
	}
	return entries, nil
}

// ---------- Chọn prefix ----------

var wasmPrefixRe = regexp.MustCompile(`^dist/assets-wasm-[^/]+/`)

func discoverPrefixes(entries []embedEntry) []string {
	set := map[string]bool{}
	for _, e := range entries {
		if m := wasmPrefixRe.FindString(e.name); m != "" {
			set[m] = true
		}
	}
	out := make([]string, 0, len(set))
	for p := range set {
		out = append(out, p)
	}
	sort.Strings(out)
	return out
}

func countFiles(entries []embedEntry, prefix string) int {
	n := 0
	for _, e := range entries {
		if !strings.HasPrefix(e.name, prefix) {
			continue
		}
		if strings.HasSuffix(e.name, "/") { // entry thư mục, không phải file
			continue
		}
		n++
	}
	return n
}

// resolvePrefix quyết định prefix cần trích. Ưu tiên: -prefix > -version >
// version suy ra từ tên file > prefix duy nhất có trong binary.
func resolvePrefix(entries []embedEntry, explicit, version string) (string, string, error) {
	if explicit != "" {
		return explicit, "", nil
	}

	// Tên file có thể không khớp version thật trong binary (đổi tên file, hoặc
	// archive chứa binary version khác) -> ghi chú lại rồi thử tự dò.
	note := ""
	if version != "" {
		p := "dist/assets-wasm-" + version + "/"
		if countFiles(entries, p) > 0 {
			return p, "", nil
		}
		note = fmt.Sprintf("không thấy %q trong binary; ", p)
	}

	candidates := discoverPrefixes(entries)
	switch len(candidates) {
	case 0:
		if version != "" {
			return "", "", fmt.Errorf("%sbinary không chứa wasm nào", note)
		}
		return "", "", errors.New("binary không chứa thư mục dist/assets-wasm-* nào " +
			"(bản release này có thể build thiếu wasm)")
	case 1:
		if version != "" {
			note += "dùng prefix duy nhất có trong binary"
		}
		return candidates[0], note, nil
	default:
		return "", "", fmt.Errorf("%sbinary có nhiều version wasm, hãy chỉ định -version hoặc -prefix:\n  %s",
			note, strings.Join(candidates, "\n  "))
	}
}

// ---------- Ghi ra đĩa ----------

// safeJoin chặn path traversal (tên file trong embed luôn dùng "/", nhưng vẫn
// kiểm tra để không ghi ra ngoài thư mục đích nếu binary bị sửa).
func safeJoin(base, rel string) (string, error) {
	clean := path.Clean(strings.TrimPrefix(rel, "/"))
	if clean == "." || clean == ".." || strings.HasPrefix(clean, "../") {
		return "", fmt.Errorf("đường dẫn không an toàn: %q", rel)
	}
	return filepath.Join(base, filepath.FromSlash(clean)), nil
}

func writeEntries(img objectImage, entries []embedEntry, prefix, outDir string) (int, error) {
	written := 0
	for _, e := range entries {
		if !strings.HasPrefix(e.name, prefix) {
			continue
		}
		if strings.HasSuffix(e.name, "/") {
			continue
		}
		rel := e.name[len(prefix):]
		dest, err := safeJoin(outDir, rel)
		if err != nil {
			return written, err
		}
		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return written, err
		}
		data, err := readBytesAt(img, e.dataVA, int(e.dataLen))
		if err != nil {
			return written, fmt.Errorf("%s: %w", e.name, err)
		}
		if err := os.WriteFile(dest, data, 0o644); err != nil {
			return written, err
		}
		fmt.Printf("  %-70s %10s\n", e.name, humanSize(int64(e.dataLen)))
		written++
	}
	return written, nil
}

// extractTo ghi ra thư mục tạm cùng cấp rồi mới thay thế đích, để binary sai
// version không làm hỏng src_wasm/pkg/ đang có.
func extractTo(img objectImage, entries []embedEntry, prefix, dest string) (int, error) {
	parent := filepath.Dir(dest)
	if err := os.MkdirAll(parent, 0o755); err != nil {
		return 0, err
	}
	tmp, err := os.MkdirTemp(parent, ".tm-wasm-extract-*")
	if err != nil {
		return 0, err
	}
	done := false
	defer func() {
		if !done {
			os.RemoveAll(tmp)
		}
	}()

	written, err := writeEntries(img, entries, prefix, tmp)
	if err != nil {
		return written, err
	}
	if written == 0 {
		return 0, fmt.Errorf("không trích được file nào với prefix %q", prefix)
	}

	if err := os.RemoveAll(dest); err != nil {
		return written, err
	}
	// tmp nằm cùng thư mục cha với dest nên cùng filesystem -> rename luôn được.
	if err := os.Rename(tmp, dest); err != nil {
		return written, fmt.Errorf("không thay thế được %q: %w", dest, err)
	}
	done = true
	return written, nil
}

func dirSize(root string) int64 {
	var total int64
	filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if !d.IsDir() {
			if info, err := d.Info(); err == nil {
				total += info.Size()
			}
		}
		return nil
	})
	return total
}

func printTree(root string) {
	list, err := os.ReadDir(root)
	if err != nil {
		return
	}
	var total int64
	for _, ent := range list {
		full := filepath.Join(root, ent.Name())
		var size int64
		if ent.IsDir() {
			size = dirSize(full)
		} else if info, err := ent.Info(); err == nil {
			size = info.Size()
		}
		total += size
		fmt.Printf("    %8s  %s\n", humanSize(size), ent.Name())
	}
	fmt.Printf("    %8s  (tổng)\n", humanSize(total))
}

func humanSize(n int64) string {
	const unit = 1024
	if n < unit {
		return fmt.Sprintf("%d B", n)
	}
	const suffixes = "KMGTPE"
	div, exp := int64(unit), 0
	for x := n / unit; x >= unit && exp < len(suffixes)-1; x /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %c", float64(n)/float64(div), suffixes[exp])
}

// ---------- Version ----------

// versionRe: sau khi bỏ tiền tố "dev-tool-" và đuôi ".exe", tên file có dạng
// "<platform>-<version>" (vd linux-22.0.4, mac-arm-22.0.4). Platform dài phải
// đứng trước để alternation khớp đúng.
var versionRe = regexp.MustCompile(`^(?:linux-amd64|darwin-arm64|windows-amd64|mac-arm|window|linux)-(.+)$`)

func inferVersion(name string) string {
	base := filepath.Base(name)
	base = strings.TrimSuffix(base, ".exe")
	base = strings.TrimPrefix(base, "dev-tool-")
	if m := versionRe.FindStringSubmatch(base); m != nil {
		return m[1]
	}
	return ""
}

// ---------- main ----------

func usage() {
	fmt.Fprintf(os.Stderr, `Trích file //go:embed từ binary Go hoặc archive release.

Cách dùng:
  go run scripts/utils/extract_go_embed.go [flags] <binary|.tar.gz|.tgz|.tar|.zip>

Flags:
  -out <dir>      thư mục đích (mặc định "src_wasm/pkg"); bị THAY THẾ toàn bộ
  -prefix <str>   tiền tố cần trích (mặc định tự dò "dist/assets-wasm-<version>/",
                  hoặc "dist/" nếu muốn lấy cả frontend)
  -version <str>  version wasm (mặc định suy ra từ tên file release)
  -symbol <str>   tên symbol embed.FS (mặc định %q)
  -list           chỉ liệt kê các prefix dist/assets-wasm-* có trong binary

Ví dụ:
  go run scripts/utils/extract_go_embed.go -out src_wasm/pkg ./out/dev-tool-linux-22.0.4.tar.gz
  go run scripts/utils/extract_go_embed.go -list ./out/dev-tool-mac-arm-22.0.4.tar.gz
  go run scripts/utils/extract_go_embed.go -out /tmp/frontend -prefix "dist/" ./out/dev-tool-linux-22.0.4
`, defaultSymbol)
}

func fatal(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "LỖI: "+format+"\n", args...)
	os.Exit(1)
}

func main() {
	var (
		symbol  = flag.String("symbol", defaultSymbol, "tên symbol embed.FS trong binary Go")
		outDir  = flag.String("out", "src_wasm/pkg", "thư mục đích (sẽ bị thay thế toàn bộ)")
		prefix  = flag.String("prefix", "", "tiền tố đường dẫn cần trích")
		version = flag.String("version", "", "version wasm (mặc định suy ra từ tên file)")
		list    = flag.Bool("list", false, "chỉ liệt kê các prefix wasm có trong binary")
	)
	flag.Usage = usage
	flag.Parse()

	if flag.NArg() != 1 {
		usage()
		os.Exit(2)
	}
	inputPath := flag.Arg(0)

	if _, err := os.Stat(inputPath); err != nil {
		fatal("không thấy file %q", inputPath)
	}

	r, closeFn, innerName, err := openInput(inputPath)
	if err != nil {
		fatal("%v", err)
	}
	defer closeFn()

	img, err := openImage(r)
	if err != nil {
		fatal("%v", err)
	}

	entries, err := readEntries(img, *symbol)
	if err != nil {
		fatal("%v", err)
	}

	if *list {
		candidates := discoverPrefixes(entries)
		if len(candidates) == 0 {
			fatal("không có thư mục dist/assets-wasm-* nào trong binary")
		}
		for _, c := range candidates {
			fmt.Println(c)
		}
		return
	}

	if *version == "" {
		*version = inferVersion(innerName)
	}

	resolved, note, err := resolvePrefix(entries, *prefix, *version)
	if err != nil {
		fatal("%v", err)
	}
	if note != "" {
		fmt.Fprintf(os.Stderr, "Lưu ý: %s\n", note)
	}

	fmt.Printf("Định dạng: %s\n", img.format())
	fmt.Printf("Nguồn    : %s\n", inputPath)
	if innerName != filepath.Base(inputPath) {
		fmt.Printf("Bên trong: %s\n", innerName)
	}
	if *version != "" {
		fmt.Printf("Version  : %s\n", *version)
	} else {
		fmt.Printf("Version  : (không suy ra được từ tên file)\n")
	}
	fmt.Printf("Prefix   : %s\n\n", resolved)

	written, err := extractTo(img, entries, resolved, *outDir)
	if err != nil {
		fatal("%v", err)
	}

	fmt.Println()
	fmt.Printf("Đã trích %d file vào %s\n", written, *outDir)
	fmt.Println("Kết quả:")
	printTree(*outDir)
}
