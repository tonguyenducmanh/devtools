#!/usr/bin/env node
/**
 * Tải logo 76 ngân hàng NAPAS về src/assets/vietqr/logos/{bin}.png
 *
 * Nguồn ảnh lấy theo `code` ngân hàng (VD: VCB.png) từ CDN VietQR:
 *   https://vietqr.net/portal-service/resources/icons/{code}.png
 * Nếu mạng trực tiếp bị chặn (vd mạng công ty), set biến môi trường
 *   VIETQR_LOGO_PROXY=<prefix proxy>  (VD: https://proxy.internal/?url=)
 * để script fallback qua proxy đó.
 *
 * File lưu theo `bin` (duy nhất, làm tên file sạch) vì 1 số code có dấu
 * cách ("IBK - HN", "BNP HN"...) không hợp lệ làm tên file/URL.
 *
 * Cách chạy:
 *   node scripts/download_vietqr_logos.mjs           # bỏ qua file đã có
 *   node scripts/download_vietqr_logos.mjs --force   # tải đè toàn bộ
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BANKS_PATH = resolve(ROOT, "src/common/vietqr/banks.json");
const OUT_DIR = resolve(ROOT, "src/assets/vietqr/logos");
const DIRECT_BASE = "https://vietqr.net/portal-service/resources/icons/";
const PROXY_BASE = process.env.VIETQR_LOGO_PROXY ?? "";

const force = process.argv.includes("--force");
const banks = JSON.parse(readFileSync(BANKS_PATH, "utf8"));
mkdirSync(OUT_DIR, { recursive: true });

async function fetchPng(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "devtools-vietqr-logo-fetcher" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  // PNG magic: 89 50 4E 47
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50) {
    throw new Error(`không phải PNG (${buf.length} bytes)`);
  }
  return buf;
}

async function downloadOne(bank) {
  const outFile = resolve(OUT_DIR, `${bank.bin}.png`);
  if (!force && existsSync(outFile)) {
    return { bank, status: "skipped" };
  }
  const iconUrl = `${DIRECT_BASE}${encodeURIComponent(bank.code)}.png`;
  const candidates = PROXY_BASE
    ? [iconUrl, `${PROXY_BASE}${iconUrl}`]
    : [iconUrl];
  for (const url of candidates) {
    try {
      const buf = await fetchPng(url);
      writeFileSync(outFile, buf);
      return { bank, status: "ok", bytes: buf.length };
    } catch (error) {
      // thử candidate kế tiếp
    }
  }
  return { bank, status: "failed" };
}

// Chạy tối đa 5 request song song cho khỏi dập server
const queue = [...banks];
const results = [];
async function worker() {
  while (queue.length) {
    results.push(await downloadOne(queue.shift()));
  }
}
await Promise.all(Array.from({ length: 5 }, worker));

const ok = results.filter((r) => r.status === "ok");
const skipped = results.filter((r) => r.status === "skipped");
const failed = results.filter((r) => r.status === "failed");
for (const r of ok) {
  console.log(`  ok      ${r.bank.bin} ${r.bank.code} (${r.bytes} bytes)`);
}
for (const r of failed) {
  console.error(`  FAILED  ${r.bank.bin} ${r.bank.code}`);
}
console.log(
  `\nTải xong: ${ok.length} mới, ${skipped.length} đã có (bỏ qua), ${failed.length} lỗi.`,
);
console.log(`Thư mục: ${OUT_DIR}`);
if (failed.length) {
  process.exitCode = 1;
}
