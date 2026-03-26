import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

class TDShortcutAction {
  constructor() {
    this.activeShortcuts = new Map();
    this.handlers = {};
    this.isListening = false;
    this.listeners = [];
    this._notifyTimer = null;
  }

  register(name, config) {
    if (!this.activeShortcuts.has(name)) {
      this.activeShortcuts.set(name, config);
      this.updateListeners();
      this._scheduleNotify();
    }
  }

  unregister(name) {
    if (this.activeShortcuts.has(name)) {
      this.activeShortcuts.delete(name);
      this.updateListeners();
      this._scheduleNotify();
    }
  }
  // Gom nhiều register/unregister liên tiếp → chỉ notify 1 lần
  _scheduleNotify() {
    if (this._notifyTimer) {
      clearTimeout(this._notifyTimer);
    }
    this._notifyTimer = setTimeout(() => {
      this._notifyTimer = null;
      this.notifyListeners();
    }, 0); // setTimeout(0) = sau khi call stack hiện tại xong
  }
  
  isActive(name) {
    return this.activeShortcuts.has(name);
  }

  getActiveShortcuts() {
    return Array.from(this.activeShortcuts.values());
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  updateListeners() {
    const needsListening = this.activeShortcuts.size > 0;

    if (needsListening && !this.isListening) {
      this.startListening();
    } else if (!needsListening && this.isListening) {
      this.stopListening();
    }
  }

  startListening() {
    let me = this;
    me.handlers.keydown = me.handleKeydown.bind(me);
    window.addEventListener("keydown", me.handlers.keydown, true);
    me.isListening = true;
  }

  stopListening() {
    let me = this;
    if (me.handlers.keydown) {
      window.removeEventListener("keydown", me.handlers.keydown, true);
    }
    me.isListening = false;
  }

  handleKeydown(event) {
    for (const [name, config] of this.activeShortcuts) {
      const ctrlMatch = config.requireCtrl
        ? event.metaKey || event.ctrlKey
        : !event.ctrlKey && !event.metaKey && !event.shiftKey;

      if (ctrlMatch && event.key === config.key) {
        // nếu là phím ảo thì trôi xuống event của component handle event này thay vì chạy ở đây
        if (config && config.isVirtual) {
          return;
        }
        event.preventDefault();
        if (config.action) {
          config.action();
        }
        break;
      }
    }
  }

  initDefaultShortcuts() {
    this.register("search", {
      key: "p",
      labelKey: "i18nCommon.search.placeholder",
      requireCtrl: true,
      action: () => {
        TDDialogUtil.showPopup({
          dialogType: TDDialogEnum.TDGoToToolPopup,
        });
      },
    });
  }
}

const instance = new TDShortcutAction();
instance.initDefaultShortcuts();

export default instance;
