import { toast } from "@/common/plugin/TDToastPlugin.js";
import i18nData from "@/i18n/i18nData.js";
import cache from "@/common/cache/TDCache.js";
import enumeration from "@/common/TDEnum.js";
import { getUserSettingDefault } from "@/common/TDUserSettingDefault.js";
/**
 * các method TDutility dùng cho toàn bộ frontend
 * tất cả các file vue đều inject sẵn class này vào dùng
 * Created by tdmanh 19.09.2024
 */
class TDUtility {
  constructor() {
    this.copyQueue = [];
    this.batchTimeout = null;
  }
  isMacOS() {
    let OS = this.getOS();
    return OS === "mac";
  }
  isLinux() {
    let OS = this.getOS();
    return OS === "linux";
  }
  isWindows() {
    let OS = this.getOS();
    return OS === "windows";
  }
  /**
   * trả về hệ điều hành đang dùng, mac/windows/linux
   */
  getOS() {
    let OS = "windows";
    if (navigator.userAgent.indexOf("Mac") !== -1) {
      OS = "mac";
    } else if (navigator.userAgent.indexOf("Linux") !== -1) {
      OS = "linux";
    }
    return OS;
  }
  /**
   * Lấy ra tiêu đề app mặc định
   */
  defaultTitleApp() {
    const appName = window.__env.appName;
    return `${appName}`;
  }

  /**
   * Lấy ra tên tác giả app mặc định
   */
  getAuthorApp() {
    const appName = window.__env.author;
    return `${appName}`;
  }

  /**
   * Xóa html trong string
   * @param {string} htmlString chuỗi html
   * @returns {string} chuỗi html đã xóa html
   */
  stripHtml(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return doc.body.textContent || "";
  }

  /**
   * go to source code link
   */
  goToSource(subPath) {
    let me = this;
    if (window.__env.githubSource && window.__env.githubSource.url) {
      let url = window.__env.githubSource.url;
      if (subPath) {
        url += `/${subPath}`;
      }
      window.open(url, "_blank").focus();
    }
  }
  /**
   * Thực hiện duyệt từng phần tử của bảng hoặc thuộc tính của object để call fn
   * @param {Array/Object/...} obj
   * @param {Function} fn hàm thực hiện khi for
   * Created by tdmanh 19.09.2024
   */
  forEach(obj, fn) {
    if (obj === null || typeof obj === "undefined") {
      return;
    }

    // Force an array if not already something
    if (typeof obj !== "object") {
      obj = [obj];
    }

    if (obj instanceof Array) {
      // Duyệt từng phần tử của mảng
      for (var i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // nếu là Object thì duyệt từng thuộc tính
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }

  /**
   * định dạng ngày tháng
   */
  formatDate(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * dd/mm/yyyy hh:mm:ss
   */
  formatFullDateTime(date) {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Tháng trong JS chạy từ 0-11
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  /**
   * clone 1 object để tránh reference
   * @param {object} obj
   */
  cloneDeep(obj) {
    return structuredClone(obj);
  }

  /**
   * copy dữ liệu vào bộ nhớ tạm
   * @param {string} value văn bản cần copy
   * @param {boolean} showNoti có bắn noti kết quả không
   */
  copyToClipboard(value, showNoti = true, logEvent = true) {
    let me = this;
    let copySucess = true;
    try {
      navigator.clipboard.writeText(value);
    } catch (error) {
      copySucess = false;
      console.log(error);
    }
    if (showNoti) {
      if (copySucess) {
        toast.success(i18nData.global.t("i18nCommon.toastMessage.copy"));
      } else {
        toast.error(i18nData.global.t("i18nCommon.toastMessage.cannotCopy"));
      }
    }
    try {
      if (logEvent) {
        this.handleCopyTextToEvent(value);
      }
    } catch (error) {
      console.log("Coy event to log error", error);
    }
  }

  /**
   * tạo uuid v4 mới
   * @returns uuid
   */
  newGuid() {
    if (crypto?.randomUUID) {
      return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * thiết lập chủ đề giao diện ứng dụng
   * @param {string} currentTheme
   */
  setTheme(currentTheme) {
    document.body.setAttribute("data-theme", currentTheme);
  }

  /**
   * apply giá trị mock ( fake data ) cho 1 file vue, đỡ phải nhập liệu nhiều
   * @param  vm vue instance
   * @param {object} mockObj dữ liệu fake
   */
  applyMock(vm, mockObj) {
    if (vm && vm.$data && typeof vm.$data == "object" && mockObj) {
      for (const [key, value] of Object.entries(mockObj)) {
        vm.$data[key] = value;
      }
      toast.success(
        i18nData.global.t("i18nCommon.toastMessage.applyMockSuccess"),
      );
    }
  }

  getValueByPath(obj, path) {
    const regex = /(?:\[(["'])(.*?)\1\])|(?:\[(\d+)\])|(?:\.?([^.\[\]]+))/g;
    const keys = [];
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[2] !== undefined) {
        // bracket string: ["web-app"]
        keys.push(match[2]);
      } else if (match[3] !== undefined) {
        // bracket index: [0]
        keys.push(Number(match[3]));
      } else if (match[4] !== undefined) {
        // dot or bareword: .key or key
        keys.push(match[4]);
      }
    }

    return keys.reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      obj,
    );
  }

  getKeyByValue(obj, value) {
    for (const key in obj) {
      if (obj[key] === value) {
        return key;
      }
    }
    return null; // hoặc giá trị mặc định nếu không tìm thấy
  }

  /**
   * Json parse unsafe
   * @param {*} obj
   * @returns object
   */
  JSONParse(source) {
    let obj = [];
    try {
      obj = JSON.parse(source);
    } catch (error) {
      console.error("Không thể try parse được bằng JSON" + errorSub);
    }
    return obj;
  }

  /**
   * copy ảnh từ url
   */
  async copyImageFromUrl(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      await this.copyImageFromBlob(blob);
      toast.success(i18nData.global.t("i18nCommon.toastMessage.copy"));
    } catch (error) {
      console.error("❌ Lỗi khi copy ảnh:", error);
      toast.error(i18nData.global.t("i18nCommon.toastMessage.error"));
    }
  }

  /**
   * Show thông báo không tìm thấy server agent
   */
  showErrorNotFoundAgentServer() {
    toast.error(
      i18nData.global.t("i18nCommon.toastMessage.notFoundAgentServer"),
    );
  }

  /**
   * copy ảnh từ blob
   */
  async copyImageFromBlob(blob) {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  }
  /**
   * Tạo tên file an toàn để download
   * - Giữ nguyên tiếng Việt & dấu cách
   * - Chỉ loại ký tự cấm theo chuẩn OS
   */
  createFileDownloadName(
    input,
    { ext = "", maxLength = 120, fallback = "download" } = {},
  ) {
    if (typeof input !== "string") {
      input = fallback;
    }

    let name = input
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // ký tự cấm
      .replace(/\s+/g, " ") // gộp nhiều space
      .replace(/^\.+/, "") // không bắt đầu bằng .
      .replace(/[. ]+$/, "") // không kết thúc bằng . hoặc space
      .trim();

    if (!name) {
      name = fallback;
    }

    // Giới hạn độ dài (không cắt extension)
    if (name.length > maxLength) {
      name = name.slice(0, maxLength).trim();
    }

    // Gắn extension
    if (ext) {
      ext = ext.replace(/^\./, "");
      name += `.${ext}`;
    }

    return name;
  }
  /**
   * Tạo file tải xuống từ buffer
   */
  createDownloadFileFromBuffer(buffer, type, fileName) {
    // Tạo blob và mở popup tải file
    const blob = new Blob([buffer], {
      type: type,
    });
    if (blob) {
      this.createDownloadFileFromBlob(blob, fileName);
    }
  }
  /**
   * Tạo file tải xuống từ blob
   */
  createDownloadFileFromBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    this.createDownloadFileFromUrl(url, fileName);
  }
  /**
   * Tạo file tải xuống từ url file
   */
  createDownloadFileFromUrl(url, fileName) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
  /**
   * Chuyển ArrayBuffer -> Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  /**
   * Chuyển Base64 string -> ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Đóng băng sâu một object, ngăn chặn mọi thay đổi ở mọi cấp độ
   * @param {Object} obj Object cần đóng băng
   * @returns {Object} Object đã được đóng băng hoàn toàn
   * Created by tdmanh 17.06.2025
   */
  freezeDeepObject(obj) {
    // Lấy tất cả thuộc tính của object, bao gồm cả thuộc tính không liệt kê được
    const propNames = Object.getOwnPropertyNames(obj);

    // Đóng băng các thuộc tính trước khi đóng băng object cha
    propNames.forEach((name) => {
      const prop = obj[name];

      // Nếu prop là object và không null, đệ quy đóng băng nó
      if (prop && typeof prop === "object") {
        this.freezeDeepObject(prop);
      }
    });

    // Đóng băng object cha
    return Object.freeze(obj);
  }
  reloadApp() {
    window.location.reload();
  }
  /**
   * lấy ra thiết lập hiện tại
   */
  async getUserSettings(key) {
    let currentUserSetting = getUserSettingDefault();
    let cacheData = await cache.get(enumeration.cacheConfig.UserSettings);
    if (cacheData) {
      currentUserSetting = Object.assign(currentUserSetting, cacheData);
    }
    if (key) {
      return currentUserSetting[key];
    } else {
      return currentUserSetting;
    }
  }
  /**
   * lưu thiết lập user
   */
  async saveUserSettings(key, val) {
    let allSettings = await this.getUserSettings();
    allSettings[key] = val;
    await cache.set(enumeration.cacheConfig.UserSettings, allSettings);
  }
  /**
   * Lấy ngày trong năm (1-365/366)
   * @returns {number} Ngày trong năm
   */
  getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * handle sự kiện copy text
   */
  handleCopyEvent(event) {
    try {
      if (event instanceof ClipboardEvent && event.type === "copy") {
        let logEntry = document.getSelection().toString();
        this.handleCopyTextToEvent(logEntry);
      }
    } catch (error) {
      console.log(error);
    }
  }

  handleCopyTextToEvent(textCopy) {
    try {
      let enableLog = window.__env?.eventGlobal?.logCopy;
      let logDelay = window.__env?.eventGlobal?.logCopyDelay ?? 2000;
      if (textCopy && enableLog) {
        // Đưa vào hàng chờ (Queue)
        this.copyQueue.push(textCopy);

        // Thiết lập Batching: Chờ 2 giây nếu không có hành động copy mới thì mới lưu
        if (this.batchTimeout) clearTimeout(this.batchTimeout);

        this.batchTimeout = setTimeout(async () => {
          await this.flushCopyQueue();
        }, logDelay);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async flushCopyQueue() {
    try {
      if (this.copyQueue.length === 0) return;
      const me = this;
      const MAX_LOGS = 1000; // Giới hạn 1000 bản ghi

      // Lấy dữ liệu cũ từ cache
      let history = await cache.get(enumeration.cacheConfig.CopyTextHistory);
      if (history) {
        if (!Array.isArray(history)) {
          // Nếu history là mảng, không cần xử lý gì thêm
          history = JSON.parse(history);
        }
      } else {
        history = [];
      }
      // Gộp queue mới vào lịch sử (history)
      history = [...history, ...this.copyQueue];

      if (history.length > MAX_LOGS) {
        history = history.slice(-MAX_LOGS);
      }

      // Lưu lại vào cache
      await cache.set(
        enumeration.cacheConfig.CopyTextHistory,
        JSON.stringify(history),
      );

      // Xóa sạch queue sau khi đã lưu thành công
      this.copyQueue = [];
    } catch (error) {
      console.error("Lỗi khi lưu cache clipboard data:", error);
    }
  }
}
const instance = new TDUtility();
export default instance;
