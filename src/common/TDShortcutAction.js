import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

class TDShortcutAction {
  constructor() {
    // danh sách các shortcut đang lưu trong store
    this.activeShortcuts = new Map();
    // object lưu danh sách các hàm handler event
    this.handlers = {};
    this.isListening = false;
    // danh sách các hàm callback được tạo khi có 1 component có nhu cầu lắng nghe computed danh sách event được thêm, xóa khỏi class này
    this.listeners = [];

    // --- Blink-free focus tracking ---
    // Mỗi "nhóm" shortcut (ví dụ: 1 monaco editor) có 1 groupId.
    // Khi blur → đặt pendingUnregister cho group đó.
    // Nếu focus mới đến cùng group trước khi timeout chạy → cancel ngay.
    this._pendingUnregisters = new Map(); // groupId → timeoutId
  }

  // ─── Core register / unregister ──────────────────────────────────────────

  /**
   * đăng ký 1 event mới
   */
  register(name, config) {
    if (!this.activeShortcuts.has(name)) {
      this.activeShortcuts.set(name, config);
      this.updateListeners();
      this.notifyListeners();
    }
  }

  /**
   * remove 1 event đã có
   */
  unregister(name) {
    if (this.activeShortcuts.has(name)) {
      this.activeShortcuts.delete(name);
      this.updateListeners();
      this.notifyListeners();
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Thêm một nhóm shortcut vào danh sách hiển thị.
   * Nếu đang có pending-remove của cùng groupId → cancel ngay (blink-free).
   * Nếu event trùng tên → bỏ qua, không add.
   *
   * @param {string} groupId   - ID định danh nhóm (thường là component uid)
   * @param {Array}  shortcuts - [{ name, config }, ...]
   */
  addEvent(groupId, shortcuts) {
    if (this._pendingUnregisters.has(groupId)) {
      clearTimeout(this._pendingUnregisters.get(groupId));
      this._pendingUnregisters.delete(groupId);
      return; // shortcuts đã tồn tại, không cần add lại
    }

    shortcuts.forEach(({ name, config }) => {
      if (!this.activeShortcuts.has(name)) {
        this.activeShortcuts.set(name, config);
      }
    });
    this.updateListeners();
    this.notifyListeners();
  }

  /**
   * Xóa một nhóm shortcut khỏi danh sách hiển thị.
   * Dùng setTimeout(0) để addEvent mới có cơ hội cancel trước khi xóa.
   *
   * @param {string}   groupId - ID định danh nhóm
   * @param {string[]} names   - Danh sách tên shortcut cần xóa
   */
  removeEvent(groupId, names) {
    if (this._pendingUnregisters.has(groupId)) return;

    const timeoutId = setTimeout(() => {
      this._pendingUnregisters.delete(groupId);
      names.forEach((name) => this.activeShortcuts.delete(name));
      this.updateListeners();
      this.notifyListeners();
    }, 0);

    this._pendingUnregisters.set(groupId, timeoutId);
  }

  // ─── Listeners / state ───────────────────────────────────────────────────

  /**
   * có đang active 1 event cụ thể không
   */
  isActive(name) {
    return this.activeShortcuts.has(name);
  }

  /**
   * trả về danh sách shortcut đã add global
   */
  getActiveShortcuts() {
    return Array.from(this.activeShortcuts.values());
  }

  /**
   * thêm hàm call back để sau này raise event khi có thay đổi về danh sách shortcut
   * return hàm để loại bỏ call back đã add từ đầu
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * có bao nhiêu listener đang nghe về danh sách short cut thì gọi hàm call back tương ứng để raise event
   * 1 dạng như computed của vue nhưng trigger chủ động
   */
  notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  // ─── Keyboard listener ───────────────────────────────────────────────────

  updateListeners() {
    const needsListening = this.activeShortcuts.size > 0;
    if (needsListening && !this.isListening) {
      this.startListening();
    } else if (!needsListening && this.isListening) {
      this.stopListening();
    }
  }

  startListening() {
    this.handlers.keydown = this.handleKeydown.bind(this);
    window.addEventListener("keydown", this.handlers.keydown, true);
    this.isListening = true;
  }

  stopListening() {
    if (this.handlers.keydown) {
      window.removeEventListener("keydown", this.handlers.keydown, true);
    }
    this.isListening = false;
  }

  handleKeydown(event) {
    for (const [, config] of this.activeShortcuts) {
      const ctrlMatch = config.requireCtrl
        ? event.metaKey || event.ctrlKey
        : !event.ctrlKey && !event.metaKey && !event.shiftKey;

      if (ctrlMatch && event.key === config.key) {
        // Phím ảo: để monaco / component tự handle
        if (config.isVirtual) return;

        event.preventDefault();
        if (config.action) config.action();
        break;
      }
    }
  }

  // ─── Default shortcuts ───────────────────────────────────────────────────

  /**
   * Khởi tạo 1 số shortcuts mặc định khi run app
   */
  initDefaultShortcuts() {
    this.register("search", {
      key: "p",
      labelKey: "i18nCommon.search.placeholder",
      requireCtrl: true,
      action: () => {
        TDDialogUtil.showPopup({ dialogType: TDDialogEnum.TDGoToToolPopup });
      },
    });
  }
}

const instance = new TDShortcutAction();
instance.initDefaultShortcuts();

export default instance;
