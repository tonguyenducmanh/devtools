/**
 * Worker giải mã Cimbar từ frame video.
 *
 * Nhận ImageBitmap (RGBA) từ main thread, đưa vào wasm để:
 *   1. scan/extract các chunk trong frame
 *   2. fountain decode để ghép đủ dữ liệu
 *   3. giải nén zstd → file gốc
 *
 * Mỗi frame trả về đúng 1 message `frame-result` để main thread biết khi nào
 * được gửi frame tiếp theo (backpressure, không làm đầy queue).
 */

/* global importScripts */

let wasmUrl = "";
let glueLoaded = false;
let ready = false;
let mode = 68;
let lockedMode = 0;
let frameIndex = 0;

let canvas = null;
let ctx = null;
let canvasWidth = 0;
let canvasHeight = 0;

let imagePtr = 0;
let imageSize = 0;
let fountainPtr = 0;
let fountainSize = 0;
let errorPtr = 0;
const ERROR_BUFFER_SIZE = 4096;

const AUTO_MODES = [66, 68, 67, 4];

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

function getReport() {
  if (!errorPtr) {
    return null;
  }
  const M = self.Module;
  const length = M._cimbard_get_report(errorPtr, ERROR_BUFFER_SIZE);
  if (length <= 0) {
    return null;
  }
  const bytes = new Uint8Array(M.HEAPU8.buffer, errorPtr, length);
  const text = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function ensureImageBuffer(size) {
  const M = self.Module;
  if (imagePtr && imageSize >= size) {
    return;
  }
  if (imagePtr) {
    M._free(imagePtr);
    imagePtr = 0;
  }
  imagePtr = M._malloc(size);
  if (!imagePtr) {
    throw new Error("không cấp phát được bộ nhớ ảnh");
  }
  imageSize = size;
}

function decompressFile(id) {
  const M = self.Module;
  let name = "cimbar-" + id + ".bin";

  const nameLength = M._cimbard_get_filename(id, errorPtr, ERROR_BUFFER_SIZE);
  if (nameLength < 0) {
    throw new Error("không đọc được tên file (mã " + nameLength + ")");
  }
  if (nameLength > 0) {
    const nameBytes = new Uint8Array(M.HEAPU8.buffer, errorPtr, nameLength);
    name = new TextDecoder().decode(nameBytes) || name;
  }

  const bufferSize = M._cimbard_get_decompress_bufsize();
  const dataPtr = M._malloc(bufferSize);
  if (!dataPtr) {
    throw new Error("không cấp phát được bộ nhớ giải nén");
  }

  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const read = M._cimbard_decompress_read(id, dataPtr, bufferSize);
      if (read <= 0) {
        break;
      }
      const chunk = new Uint8Array(
        M.HEAPU8.buffer,
        dataPtr,
        read,
      ).slice();
      chunks.push(chunk);
      total += read;
    }
  } finally {
    M._free(dataPtr);
  }

  if (total <= 0) {
    throw new Error("giải nén thất bại (file rỗng)");
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  // MD5 để người dùng đối chiếu với MD5 hiển thị ở máy mã hoá.
  let md5 = "";
  if (self.TMMD5) {
    md5 = self.TMMD5.md5Hex(output);
  }

  return {
    name: name,
    buffer: output.buffer,
    size: total,
    md5: md5,
  };
}

function handleFrame(data) {
  const index = data.index;
  const bitmap = data.bitmap;
  const width = data.width;
  const height = data.height;
  let bitmapClosed = false;

  try {
    if (!ready) {
      throw new Error("wasm chưa sẵn sàng");
    }
    if (!bitmap || !width || !height) {
      throw new Error("frame không hợp lệ");
    }

    const M = self.Module;

    // Chế độ tự động: thử lần lượt các mode cho tới khi 1 frame extract được,
    // sau đó khoá mode đó lại (giống web decoder của upstream).
    if (mode === 0 && !lockedMode) {
      const tryMode = AUTO_MODES[frameIndex % AUTO_MODES.length];
      M._cimbard_configure_decode(tryMode);
      lockedMode = 0;
    } else if (mode !== 0) {
      // Mode cố định đã được configure lúc init.
    }

    if (!canvas || canvasWidth !== width || canvasHeight !== height) {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvasWidth = width;
      canvasHeight = height;
    }
    if (!ctx) {
      throw new Error("không tạo được canvas 2D trong worker");
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    bitmapClosed = true;

    const pixels = ctx.getImageData(0, 0, width, height).data;
    ensureImageBuffer(pixels.length);
    M.HEAPU8.set(pixels, imagePtr);

    const chunkLength = M._cimbard_scan_extract_decode(
      imagePtr,
      width,
      height,
      4, // RGBA
      fountainPtr,
      fountainSize,
    );

    if (chunkLength <= 0) {
      post({
        type: "frame-result",
        index: index,
        status: chunkLength === 0 ? "nodata" : "failed",
        length: chunkLength,
        report: getReport(),
        mode: mode,
      });
      return;
    }

    if (mode === 0) {
      lockedMode = AUTO_MODES[frameIndex % AUTO_MODES.length];
    }

    const decodeResult = M._cimbard_fountain_decode(
      fountainPtr,
      chunkLength,
    );
    const report = getReport();

    if (decodeResult > 0n) {
      const id = Number(BigInt.asUintN(32, decodeResult));
      const file = decompressFile(id);
      post(
        {
          type: "frame-result",
          index: index,
          status: "done",
          length: chunkLength,
          report: report,
          mode: mode,
          lockedMode: lockedMode,
          file: file,
        },
        [file.buffer],
      );
      return;
    }

    post({
      type: "frame-result",
      index: index,
      status: "decoded",
      length: chunkLength,
      report: report,
      mode: mode,
      lockedMode: lockedMode,
    });
  } catch (error) {
    if (bitmap && !bitmapClosed) {
      try {
        bitmap.close();
      } catch (closeError) {
        // ignore
      }
    }
    post({
      type: "frame-result",
      index: index,
      status: "error",
      error: errorMessage(error),
    });
  }
}

// Phải gán self.Module TRƯỚC importScripts.
self.Module = {
  locateFile: function (path) {
    return wasmUrl && path && path.endsWith(".wasm") ? wasmUrl : path;
  },
  print: function () {},
  printErr: function () {},
  onRuntimeInitialized: function () {
    try {
      const M = self.Module;
      M._cimbard_configure_decode(mode === 0 ? 68 : mode);
      fountainSize = M._cimbard_get_bufsize();
      fountainPtr = M._malloc(fountainSize);
      errorPtr = M._malloc(ERROR_BUFFER_SIZE);
      if (!fountainPtr || !errorPtr) {
        throw new Error("không cấp phát được bộ nhớ decoder");
      }
      ready = true;
      post({ type: "ready", fountainSize: fountainSize });
    } catch (error) {
      post({ type: "error", message: errorMessage(error) });
    }
  },
};

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
      case "frame": {
        frameIndex += 1;
        handleFrame(data);
        break;
      }
      case "destroy":
        self.close();
        break;
      default:
        break;
    }
  } catch (error) {
    post({
      type: "frame-result",
      index: data.index,
      status: "error",
      error: errorMessage(error),
    });
  }
};
