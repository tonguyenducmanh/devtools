import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import tdUtility from "@/common/TDUtility.js";

let isMacOS = tdUtility.isMacOS() ? "Cmd" : "Ctrl";

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
      if (config.action && typeof config.action === "function") {
        config.action(event);
      }
    }
  }

  initDefaultShortcuts() {
    this.register("search", {
      key: tdUtility.newGuid(),
      presentKey: [isMacOS ? "Cmd" : "Ctrl", "p"],
      labelKey: "i18nCommon.shortKeyAction.search",
      action: (event) => {
        if (event && (event.metaKey || event.ctrlKey) && event.key === "p") {
          event.preventDefault();
          TDDialogUtil.showPopup({
            dialogType: TDDialogEnum.TDGoToToolPopup,
          });
        }
      },
    });
    this.register("showCommandTextEditor", {
      key: tdUtility.newGuid(),
      presentKey: ["F1"],
      labelKey: "i18nCommon.shortKeyAction.showCommandTextEditor",
    });
    this.register("formatCodeTextEditor", {
      key: tdUtility.newGuid(),
      presentKey: ["Shift", isMacOS ? "Opiton" : "Alt", "f"],
      labelKey: "i18nCommon.shortKeyAction.formatCodeTextEditor",
    });
  }
}

const instance = new TDShortcutAction();
instance.initDefaultShortcuts();

export default instance;
