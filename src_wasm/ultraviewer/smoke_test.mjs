// Smoke test: chạy module WASM UltraViewer thật (bản build cho web) trong Node
// để kiểm tra kết nối tới một máy đang chạy UltraViewer.
//
// Dùng: node smoke_test.mjs <partnerID> <password> [wsUrl]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PARTNER_ID = process.argv[2] || "";
const PASSWORD = process.argv[3] || "";
const WS_URL = process.argv[4] || "ws://localhost:7777/ultraviewer/ws";
// Thư mục module đã build (pkg/ultraviewer).
const PKG = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../pkg/ultraviewer",
);

const module = await import(path.join(PKG, "ultraviewer_client.js"));
await module.default(fs.readFileSync(path.join(PKG, "ultraviewer_client_bg.wasm")));

const client = new module.UltraViewerClient();

let done = false;
const finish = (code) => {
  if (done) return;
  done = true;
  setTimeout(() => process.exit(code), 200);
};

client.on_status((message) => console.log("[status]", message));
client.on_connected((width, height) =>
  console.log("[connected]", width + "x" + height),
);
client.on_view_only((viewOnly) => console.log("[view_only]", viewOnly));
client.on_chat((text) => console.log("[chat]", text));
client.on_typing((typing) => console.log("[typing]", typing));
client.on_clipboard((text) => console.log("[clipboard]", text));
client.on_closed((message) => {
  console.log("[closed]", message);
  finish(1);
});

console.log("đang kết nối tới", PARTNER_ID, "qua", WS_URL);
client.connect(
  WS_URL,
  PARTNER_ID,
  PASSWORD,
  "DevToolsTest",
  "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  "",
  420,
  1920,
  1080,
);

// Di chuyển chuột trên máy đối tác để kích hoạt báo vị trí con trỏ (lệnh 28).
let moved = false;
const mover = setInterval(() => {
  if (!client.is_connected() || moved) return;
  moved = true;
  for (let i = 0; i < 5; i++) {
    client.pointer_move(400 + i * 20, 300 + i * 10);
  }
  console.log("[input] đã gửi chuyển động chuột tới máy đối tác");
}, 3000);

// Giữ process sống tối đa 40 giây để chờ phiên.
// Đo toạ độ chuột: canvas hiển thị ở đâu, canvas gốc ở đâu, và toRemotePoint ra gì.
const mouse = await page.evaluate(() => {
  const c = document.querySelector(".tm-uv-canvas");
  const cur = document.querySelector(".tm-uv-cursor-canvas");
  const r = c.getBoundingClientRect();
  const rc = cur ? cur.getBoundingClientRect() : null;
  const scaleX = r.width ? c.width / r.width : 1;
  const scaleY = r.height ? c.height / r.height : 1;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  return {
    canvasAttr: { w: c.width, h: c.height },
    canvasRect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    cursorRect: rc ? { x: Math.round(rc.x), y: Math.round(rc.y), w: Math.round(rc.width), h: Math.round(rc.height) } : null,
    scale: { x: +scaleX.toFixed(3), y: +scaleY.toFixed(3) },
    toRemotePointCenter: {
      x: Math.round((cx - r.left) * scaleX),
      y: Math.round((cy - r.top) * scaleY),
    },
    expectedCenter: { x: Math.round(c.width / 2), y: Math.round(c.height / 2) },
  };
});
console.log("ĐO TOẠ ĐỘ CHUỘT:", JSON.stringify(mouse, null, 1));

const timer = setInterval(() => {
  console.log(
    "[tick] frames=" + client.frame_count() +
      " connected=" + client.is_connected() +
      " cmds=[" + Array.from(client.received_commands()).join(",") + "]" +
      " cursor=" + JSON.stringify(client.cursor_position()),
  );
}, 2000);

setTimeout(() => {
  clearInterval(timer);
  clearInterval(mover);
  console.log("hết thời gian chờ");
  const stats = client.frame_stats();
  console.log(
    "thống kê: frames=" + stats[0] +
    " tổng ms giải mã=" + stats[1] +
    " (trung bình " + (stats[0] ? Math.round(stats[1] / stats[0]) : 0) + " ms/khung)" +
    " tổng byte nén=" + Math.round(stats[2] / 1024) + " KB" +
    " (trung bình " + (stats[0] ? Math.round(stats[2] / stats[0] / 1024) : 0) + " KB/khung)",
  );
  console.log("payload đã gửi:", JSON.stringify(client.sent_payloads(), null, 1));
  finish(client.is_connected() ? 0 : 2);
}, 40000);
