/**
 * Worker mã hoá Cimbar.
 *
 * Worker chạy classic (xem TMCimbarWorkerClient.js) để dùng được
 * `importScripts()` — glue wasm của cimbar là script classic, không phải ESM.
 *
 * Luồng:
 *   init  → nhận OffscreenCanvas + URL glue/wasm, nạp wasm, tạo cửa sổ GL
 *   load  → nén dữ liệu bằng zstd trong wasm rồi tạo fountain stream
 *   timer → render + next_frame đều đặn để phát animation
 *
 * Toàn bộ phần nặng (nén, dựng frame) chạy trong worker nên main thread không
 * bị block (Luật 13).
 */

/* global importScripts */

// ── Polyfill tối thiểu cho emscripten GLFW trong worker ─────────────────────
if (typeof window === "undefined") {
  self.window = self;
}
if (typeof window.matchMedia === "undefined") {
  window.matchMedia = function () {
    return {
      matches: false,
      addEventListener: function () {},
      removeEventListener: function () {},
      addListener: function () {},
      removeListener: function () {},
    };
  };
}
if (typeof document === "undefined") {
  self.document = {
    fullscreenElement: null,
    mozFullScreenElement: null,
    webkitFullscreenElement: null,
    msFullscreenElement: null,
    getElementById: function () {
      return null;
    },
    addEventListener: function () {},
    removeEventListener: function () {},
    visibilityState: "visible",
    hidden: false,
  };
}

let wasmUrl = "";
let glueLoaded = false;
let ready = false;
let hasSource = false;
let paused = false;
let timer = null;
let intervalMs = 66;
let mode = 68;
// frameCount: số khung trong vòng fountain hiện tại (wasm reset về 1 khi quay
// vòng) — dùng để báo tiến trình 0→100% cho UI.
let frameCount = 0;
let cycleFrames = 0;

const MAX_INPUT_BYTES = 33 * 1024 * 1024;

function post(message, transfer) {
  if (transfer) {
    self.postMessage(message, transfer);
  } else {
    self.postMessage(message);
  }
}

function errorMessage(error) {
  if (!error) {
    return "unknown error";
  }
  return String(error && error.message ? error.message : error);
}

// Phải gán self.Module TRƯỚC importScripts: glue đọc `Module` toàn cục.
self.Module = {
  canvas: null,
  locateFile: function (path) {
    return wasmUrl && path && path.endsWith(".wasm") ? wasmUrl : path;
  },
  print: function () {},
  printErr: function () {},
  requestAnimationFrame: function (callback) {
    return setTimeout(function () {
      callback(performance.now());
    }, 16);
  },
  onRuntimeInitialized: function () {
    try {
      const M = self.Module;
      const initRes = M._cimbare_init_window(0, 0);
      if (initRes !== 0) {
        throw new Error("cimbare_init_window failed: " + initRes);
      }
      M._cimbare_configure(mode, -1);
      ready = true;
      post({
        type: "ready",
        aspect: M._cimbare_get_aspect_ratio(),
      });
    } catch (error) {
      post({ type: "error", message: errorMessage(error) });
    }
  },
};

function clearTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function startTimer() {
  clearTimer();
  timer = setInterval(tick, intervalMs);
}

function tick() {
  if (!ready || !hasSource || paused) {
    return;
  }
  try {
    const M = self.Module;
    M._cimbare_render();

    const previous = frameCount;
    const count = M._cimbare_next_frame(false);
    if (count <= 0) {
      return;
    }
    frameCount = count;

    // next_frame() trả về số khung trong vòng hiện tại; khi fountain stream
    // quay vòng, giá trị tụt về 1 → vòng vừa rồi đã phát đủ `previous` khung.
    // Đây là mốc "đã truyền xong toàn bộ dữ liệu một lần" để người dùng biết
    // có thể dừng quay màn hình.
    if (previous > 0 && count <= previous) {
      cycleFrames = previous;
      post({
        type: "frames",
        count: count,
        cycleFrames: cycleFrames,
        wrapped: true,
      });
      return;
    }

    post({
      type: "frames",
      count: count,
      cycleFrames: cycleFrames,
    });
  } catch (error) {
    post({ type: "error", message: errorMessage(error) });
  }
}

function loadSource(data) {
  clearTimer();
  hasSource = false;
  paused = false;
  frameCount = 0;
  cycleFrames = 0;

  if (!ready) {
    post({ type: "error", message: "wasm chưa sẵn sàng" });
    return;
  }

  const name = String(data.name || "data.bin");
  const buffer = data.buffer;
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) {
    post({ type: "error", message: "dữ liệu rỗng" });
    return;
  }
  if (buffer.byteLength > MAX_INPUT_BYTES) {
    post({
      type: "error",
      message: "Dữ liệu vượt quá giới hạn 33 MB của cimbar",
    });
    return;
  }

  const M = self.Module;

  // MD5 tính trong worker (không block main thread) để hiển thị cho người dùng
  // đối chiếu với MD5 ở máy giải mã. KHÔNG nhét MD5 vào dữ liệu/tên file.
  let md5 = "";
  if (self.TMMD5) {
    try {
      md5 = self.TMMD5.md5Hex(new Uint8Array(buffer));
    } catch (error) {
      post({
        type: "error",
        message: "không tính được MD5: " + errorMessage(error),
      });
      return;
    }
  }

  const nameBytes = new TextEncoder().encode(name);
  let namePtr = 0;
  let chunkPtr = 0;

  try {
    namePtr = M._malloc(nameBytes.length);
    if (!namePtr) {
      throw new Error("không cấp phát được bộ nhớ cho tên file");
    }
    M.HEAPU8.set(nameBytes, namePtr);

    const initRes = M._cimbare_init_encode(namePtr, nameBytes.length, -1);
    if (initRes !== 0) {
      throw new Error("cimbare_init_encode failed: " + initRes);
    }

    const chunkSize = M._cimbare_encode_bufsize() * 16;
    chunkPtr = M._malloc(chunkSize);
    if (!chunkPtr) {
      throw new Error("không cấp phát được bộ nhớ đệm");
    }

    let offset = 0;
    let encodeRes = 1;
    while (offset < buffer.byteLength) {
      const length = Math.min(chunkSize, buffer.byteLength - offset);
      M.HEAPU8.set(new Uint8Array(buffer, offset, length), chunkPtr);
      encodeRes = M._cimbare_encode(chunkPtr, length);
      offset += length;
      post({
        type: "progress",
        percent: Math.round((offset / buffer.byteLength) * 100),
      });
    }

    // Chunk cuối trùng bội số 16 KiB thì wasm chưa finalize → gọi flush size 0.
    if (encodeRes === 1) {
      encodeRes = M._cimbare_encode(chunkPtr, 0);
    }
    if (encodeRes !== 0) {
      throw new Error("cimbare_encode failed: " + encodeRes);
    }

    hasSource = true;
    post({
      type: "loaded",
      name: name,
      size: buffer.byteLength,
      md5: md5,
    });
    startTimer();
  } catch (error) {
    hasSource = false;
    clearTimer();
    post({ type: "error", message: errorMessage(error) });
  } finally {
    if (chunkPtr) {
      M._free(chunkPtr);
    }
    if (namePtr) {
      M._free(namePtr);
    }
  }
}

self.onmessage = function (event) {
  const data = event.data || {};
  try {
    switch (data.type) {
      case "init": {
        if (glueLoaded) {
          return;
        }
        wasmUrl = data.wasmUrl || "";
        mode = Number.isFinite(data.mode) ? data.mode : 68;
        self.Module.canvas = data.canvas;
        if (!data.glueUrl) {
          throw new Error("thiếu URL glue wasm");
        }
        if (data.md5Url) {
          importScripts(data.md5Url);
        }
        importScripts(data.glueUrl);
        glueLoaded = true;
        break;
      }
      case "load":
        loadSource(data);
        break;
      case "mode": {
        if (ready && !hasSource) {
          mode = Number.isFinite(data.mode) ? data.mode : 68;
          self.Module._cimbare_configure(mode, -1);
          post({
            type: "aspect",
            aspect: self.Module._cimbare_get_aspect_ratio(),
          });
        }
        break;
      }
      case "fps": {
        const fps = Number(data.fps);
        if (fps > 0) {
          intervalMs = Math.max(16, Math.round(1000 / fps));
          if (hasSource) {
            startTimer();
          }
        }
        break;
      }
      case "pause":
        paused = !!data.value;
        break;
      case "stop":
        hasSource = false;
        paused = false;
        frameCount = 0;
        cycleFrames = 0;
        clearTimer();
        post({ type: "stopped" });
        break;
      case "destroy":
        clearTimer();
        self.close();
        break;
      default:
        break;
    }
  } catch (error) {
    post({ type: "error", message: errorMessage(error) });
  }
};
