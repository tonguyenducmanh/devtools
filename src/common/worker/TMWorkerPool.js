/**
 * TMWorkerPool - worker pool nhỏ, dùng chung cho các tác vụ nặng chạy nền.
 *
 * Vì sao cần:
 * - Đọc QR (jsQR + tiền xử lý ảnh: median filter, sharpen, binarize, xoay ảnh)
 *   rất nặng CPU. Chạy trên main thread khiến UI đứng hình, user phải đợi
 *   xong mới click được tab/button khác.
 * - Tạo QR (`qrcode.toDataURL`) encode PNG 1000px cho hàng chục → hàng trăm
 *   chunk cũng giữ main thread lâu.
 *
 * Cách dùng:
 *   import { getWorkerPool } from "@/common/worker/TMWorkerPool.js";
 *
 *   const pool = getWorkerPool("qrcode", () =>
 *     new Worker(
 *       new URL("../qrcode/TMQRCodeWorker.js", import.meta.url),
 *       { type: "module" },
 *     ),
 *   );
 *
 *   const result = await pool.run({ type: "scan", payload: { ... } });
 *
 * LƯU Ý QUAN TRỌNG: `new Worker(new URL("./xxx.js", import.meta.url))` phải nằm
 * LITERALLY trong module gọi hàm, Vite mới nhận ra để đóng gói riêng worker
 * (plugin `vite:worker-import-meta-url`). Truyền `new Worker(workerUrl)` với
 * biến sẽ KHÔNG được Vite transform → build xong worker không tồn tại.
 *
 * Message protocol (giữ nguyên cho mọi worker):
 *   main → worker: { id, type, payload, transfer? }
 *   worker → main: { id, final: true, ok, result | error }
 *                   { id, final: false, ... }  // message tiến trình (optional)
 */

const POOL_REGISTRY = new Map();

/** Số worker tối đa cho 1 pool (trừ 1 core cho UI + main thread). */
function getDefaultMaxWorker() {
  const cpu =
    (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
  return Math.max(1, Math.min(4, cpu - 1));
}

/** Pool không có task nào trong X ms thì tự hủy worker, giải phóng bộ nhớ. */
const IDLE_TERMINATE_TIMEOUT = 60 * 1000;

class TMWorkerPool {
  /**
   * @param {string} name tên pool (để tra cứu trong registry)
   * @param {Function} createWorker factory tạo Worker, phải chứa literal `new Worker(new URL(...))`
   * @param {Object} options
   * @param {number} options.maxWorker số worker tối đa
   */
  constructor(name, createWorker, options = {}) {
    this.name = name;
    this.createWorker = createWorker;
    this.maxWorker = options.maxWorker || getDefaultMaxWorker();
    /** @type {Array<{worker: Worker, busy: number}>} */
    this.workers = [];
    /** @type {Array<Object>} task đang chờ được gán cho worker */
    this.queue = [];
    /** @type {Map<number, Object>} task đang chạy, key = id */
    this.running = new Map();
    this.taskId = 0;
    this.idleTimer = null;
  }

  /**
   * Chạy 1 task trong worker và chờ kết quả.
   * @param {Object} message { type, payload }
   * @param {Object} options
   * @param {Transferable[]} options.transfer danh sách transfer cho postMessage
   * @param {Function} options.onMessage callback cho message tiến trình (final !== true)
   * @returns {Promise<any>} resolve với `result` của message final
   */
  run(message, options = {}) {
    const { transfer, onMessage } = options;
    this.clearIdleTimer();

    const id = ++this.taskId;
    const task = {
      id,
      message,
      transfer,
      onMessage,
      resolve: null,
      reject: null,
      worker: null,
    };

    const promise = new Promise((resolve, reject) => {
      task.resolve = resolve;
      task.reject = reject;
    });

    this.queue.push(task);
    this.pump();
    return promise;
  }

  /**
   * Hủy toàn bộ worker của pool (task đang chạy sẽ reject).
   */
  terminate() {
    this.clearIdleTimer();
    const error = new Error(`Worker pool "${this.name}" đã bị terminate`);
    for (const task of this.running.values()) {
      task.reject(error);
    }
    for (const task of this.queue) {
      task.reject(error);
    }
    this.running.clear();
    this.queue = [];
    for (const item of this.workers) {
      item.worker.terminate();
    }
    this.workers = [];
  }

  /* ────────────────────────── nội bộ ────────────────────────── */

  pump() {
    while (this.queue.length > 0) {
      const item = this.workers.find((w) => !w.busy);
      if (!item) {
        if (this.workers.length >= this.maxWorker) {
          return; // đã hết worker rảnh, chờ worker nào xong thì gọi lại pump
        }
        this.workers.push(this.spawnWorker());
        continue;
      }
      const task = this.queue.shift();
      this.dispatch(item, task);
    }
    this.scheduleIdleTerminate();
  }

  spawnWorker() {
    const worker = this.createWorker();
    const item = { worker, busy: false };

    worker.onmessage = (event) => this.handleMessage(item, event.data);
    worker.onerror = (event) => {
      console.error(
        `[TMWorkerPool:${this.name}] worker error:`,
        event.message || event,
      );
      this.handleWorkerFailure(
        item,
        new Error(event.message || "Worker error"),
      );
    };
    worker.onmessageerror = () => {
      this.handleWorkerFailure(item, new Error("Worker message error"));
    };

    return item;
  }

  dispatch(item, task) {
    item.busy = true;
    task.worker = item;
    this.running.set(task.id, task);
    try {
      const payload = {
        id: task.id,
        type: task.message.type,
        payload: task.message.payload,
      };
      item.worker.postMessage(payload, task.transfer || []);
    } catch (error) {
      this.running.delete(task.id);
      item.busy = false;
      if (error && error.name === "DataCloneError") {
        console.error(
          `[TMWorkerPool:${this.name}] payload không clone được. Không được truyền ` +
            `object reactive của Vue (Proxy), function hay DOM node — hãy tạo object ` +
            `thuần ở ngoài component hoặc dùng markRaw().`,
          error,
        );
      }
      task.reject(error);
      this.pump();
    }
  }

  handleMessage(item, data) {
    if (!data || typeof data.id !== "number") {
      return;
    }
    const task = this.running.get(data.id);
    if (!task) {
      return;
    }
    if (data.final === true) {
      this.running.delete(data.id);
      item.busy = false;
      if (data.ok) {
        task.resolve(data.result);
      } else {
        const error = new Error(data.error || "Worker task failed");
        error.workerData = data;
        task.reject(error);
      }
      this.pump();
      return;
    }
    // message tiến trình, không release worker
    if (typeof task.onMessage === "function") {
      try {
        task.onMessage(data);
      } catch (error) {
        console.warn(`[TMWorkerPool:${this.name}] onMessage lỗi:`, error);
      }
    }
  }

  handleWorkerFailure(item, error) {
    // reject mọi task đang chạy trên worker này
    for (const [id, task] of this.running) {
      if (task.worker === item) {
        this.running.delete(id);
        task.reject(error);
      }
    }
    this.workers = this.workers.filter((w) => w !== item);
    try {
      item.worker.terminate();
    } catch (e) {
      // ignore
    }
    this.pump();
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  scheduleIdleTerminate() {
    this.clearIdleTimer();
    if (this.workers.length === 0) {
      return;
    }
    this.idleTimer = setTimeout(() => {
      if (this.running.size === 0 && this.queue.length === 0) {
        for (const item of this.workers) {
          item.worker.terminate();
        }
        this.workers = [];
      }
      this.idleTimer = null;
    }, IDLE_TERMINATE_TIMEOUT);
  }
}

/**
 * Lấy (hoặc tạo) worker pool theo tên, để các module khác dùng chung pool.
 * @param {string} name
 * @param {Function} createWorker factory tạo Worker
 * @param {Object} [options]
 * @returns {TMWorkerPool}
 */
export function getWorkerPool(name, createWorker, options = {}) {
  if (!POOL_REGISTRY.has(name)) {
    POOL_REGISTRY.set(name, new TMWorkerPool(name, createWorker, options));
  }
  return POOL_REGISTRY.get(name);
}

export default { getWorkerPool, TMWorkerPool };
