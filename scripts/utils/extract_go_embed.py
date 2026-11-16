#!/usr/bin/env python3
"""Trích file embed (//go:embed) ra từ một binary Go đã build.

Vì sao cần script này
---------------------
`src_wasm/pkg/` là thư mục gitignored (~26 MB wasm đã build) — clone mới sẽ KHÔNG
có, và muốn build lại wasm thì cần cài cả Rust/wasm-pack/.NET/trunk (nặng, chậm).

Khi đã có sẵn một bản daemon release (binary Go có nhúng `dist/` qua
`//go:embed all:dist` trong `internal/web/bl_web.go`), ta có thể lấy lại đúng
wasm đã build sẵn mà không cần toolchain: đọc thẳng cấu trúc embed.FS trong
binary và ghi file ra đĩa.

Cấu trúc Go embed.FS trong binary
---------------------------------
    embed.FS  = struct { files *[]file }
    []file    = slice header { ptr, len, cap }
    file      = struct { name string; data string; hash [16]byte }
                -> 16 (string) + 16 (string) + 16 (hash) = 48 bytes

Lưu ý: `data` là `string` (16 byte), KHÔNG phải `[]byte` (24 byte) — sai chỗ này
thì đọc ra toàn rác.

Cách dùng
---------
    # Trích toàn bộ thư mục wasm của 1 version, ra src_wasm/pkg/
    python3 scripts/utils/extract_go_embed.py \
        <binary> \
        tm_core_service/internal/web.embeddedFiles \
        src_wasm/pkg \
        "dist/assets-wasm-22.0.4/"

    # Bỏ tiền tố "dist/assets-wasm-<version>/" để đường dẫn trở thành
    # <out>/rdp/... , <out>/photocraft/... (đúng cấu trúc viteStaticCopy cần)

    # Trích cả frontend (index.html, assets/*.js) nếu cần
    python3 scripts/utils/extract_go_embed.py <binary> <symbol> <out> "dist/"
"""
import os
import struct
import subprocess
import sys

# sizeof(embed.file): name string + data string + hash [16]byte
EMBED_FILE_ENTRY_SIZE = 48


def load_sections(binpath):
    """Đọc bảng section từ readelf -> list (vaddr, offset, size).

    readelf -S -W in ra 2 kiểu cột (do độ rộng tên section):
      [ 4] .rodata           PROGBITS        0000000000c45000 845000 2b5a1b9 ...
      [12] .data             PROGBITS        0000000008aca920 86ca920 04dad2 ...
    nên phải tìm vị trí "PROGBITS"/"NOBITS" thay vì đếm cố định.
    """
    out = subprocess.run(
        ["readelf", "-S", "-W", binpath],
        capture_output=True, text=True, check=True).stdout
    sections = []
    for line in out.splitlines():
        parts = line.split()
        if len(parts) < 6 or not parts[0].startswith("["):
            continue
        try:
            i = parts.index("PROGBITS") if "PROGBITS" in parts else parts.index("NOBITS")
        except ValueError:
            continue
        if i + 3 >= len(parts):
            continue
        addr = int(parts[i + 1], 16)
        off = int(parts[i + 2], 16)
        size = int(parts[i + 3], 16)
        if size == 0:
            continue
        sections.append((addr, off, size))
    return sections


class Elf:
    """Đọc file ELF, ánh xạ virtual address -> file offset."""

    def __init__(self, path):
        self.f = open(path, "rb")
        self.sections = load_sections(path)

    def v2o(self, vaddr):
        for va, off, size in self.sections:
            if va <= vaddr < va + size:
                return off + (vaddr - va)
        raise ValueError("vaddr 0x%x nằm ngoài mọi section PROGBITS" % vaddr)

    def read(self, vaddr, size):
        self.f.seek(self.v2o(vaddr))
        return self.f.read(size)

    def cstr(self, vaddr, size):
        return self.read(vaddr, size).decode("utf-8", "replace")


def find_symbol(binpath, want):
    """Tìm virtual address của symbol trong binary Go (qua `go tool nm`)."""
    out = subprocess.run(
        ["go", "tool", "nm", binpath], capture_output=True, text=True).stdout
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 3 and parts[2] == want:
            return int(parts[0], 16)
    return None


def extract(binpath, symbol, outdir, prefix):
    sym_addr = find_symbol(binpath, symbol)
    if sym_addr is None:
        raise SystemExit("LỖI: không tìm thấy symbol '%s' trong %s" % (symbol, binpath))
    print("symbol %s = 0x%x" % (symbol, sym_addr))

    elf = Elf(binpath)

    # embed.FS = struct { files *[]file } -> đọc con trỏ, rồi đọc slice header
    fs_ptr = struct.unpack("<Q", elf.read(sym_addr, 8))[0]
    files_ptr, count, _cap = struct.unpack("<QQQ", elf.read(fs_ptr, 24))
    print("FS.files -> slice header @0x%x: ptr=0x%x count=%d"
          % (fs_ptr, files_ptr, count))

    written = 0
    skipped = 0
    for i in range(count):
        raw = elf.read(files_ptr + i * EMBED_FILE_ENTRY_SIZE, EMBED_FILE_ENTRY_SIZE)
        name_ptr, name_len, data_ptr, data_len = struct.unpack("<QQQQ", raw[:32])
        name = elf.cstr(name_ptr, name_len)
        if prefix and not name.startswith(prefix):
            skipped += 1
            continue
        # Entry thư mục có tên kết thúc bằng "/" và không có data
        if name.endswith("/"):
            skipped += 1
            continue
        rel = name[len(prefix):] if prefix else name
        dest = os.path.join(outdir, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as fh:
            fh.write(elf.read(data_ptr, data_len))
        written += 1
        print("  %-64s %9d bytes" % (name, data_len))

    print("Đã trích %d file (bỏ qua %d entry), vào %s" % (written, skipped, outdir))
    return written


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    binpath = sys.argv[1]
    symbol = sys.argv[2]
    outdir = sys.argv[3]
    prefix = sys.argv[4] if len(sys.argv) > 4 else ""
    if not os.path.isfile(binpath):
        raise SystemExit("LỖI: không thấy file binary '%s'" % binpath)
    if extract(binpath, symbol, outdir, prefix) == 0:
        raise SystemExit(
            "LỖI: không trích được file nào. Kiểm tra lại --prefix (ví dụ "
            "\"dist/assets-wasm-<version>/\") và tên symbol.")


if __name__ == "__main__":
    main()
