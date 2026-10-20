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
  console.log("tổng số khung hình:", client.frame_count());
  console.log("payload đã gửi:", JSON.stringify(client.sent_payloads(), null, 1));
  finish(client.is_connected() ? 0 : 2);
}, 40000);
