import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

class TDShortcutAction {
  constructor() {
    this.activeShortcuts = new Map();
    this.handlers = {};
    this.isListening = false;
    this.listeners = [];
  }

  register(name, config) {
    if (!this.activeShortcuts.has(name)) {
      this.activeShortcuts.set(name, config);
      this.updateListeners();
      this.notifyListeners();
    }
  }

  unregister(name) {
    if (this.activeShortcuts.has(name)) {
      this.activeShortcuts.delete(name);
      this.updateListeners();
      this.notifyListeners();
    }
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
    this.listeners.forEach(cb => cb());
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
      const ctrlMatch = config.requireCtrl ? (event.metaKey || event.ctrlKey) : !event.ctrlKey && !event.metaKey && !event.shiftKey;
      const shiftMatch = config.requireShift ? event.shiftKey : !event.shiftKey;
      
      if (ctrlMatch && shiftMatch && event.key === config.key) {
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