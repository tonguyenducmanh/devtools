import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import tdUtility from "@/common/TDUtility.js";

let isMacOS = tdUtility.isMacOS();
let isLinux = tdUtility.isLinux();
let isWindows = tdUtility.isWindows();

let currentOS = tdUtility.getOS();

export const TDShortcutActionEnum = {
  Search: "search",
  ShowCommandTextEditor: "showCommandTextEditor",
  FormatCodeTextEditor: "formatCodeTextEditor",
  ShowIntelliSense: "ShowIntelliSense",
  TabPrevious: "TabPrevious",
  TabNext: "TabNext",
  TabClose: "TabClose",
  TabZenMode: "TabZenMode",
  ExecuteAPITesting: "ExecuteAPITesting",
  ExecutePosgreSQLCode: "ExecutePosgreSQLCode",
  DllInspect: "DllInspect",
};

const ShortcutConfigMap = {
  [TDShortcutActionEnum.Search]: {
    sortOrder: 1,
    key: tdUtility.newGuid(),
    presentKey: (() => {
      return [tdUtility.ctrlKey(), "p"];
    })(),
    labelKey: "i18nCommon.shortKeyAction.search",
    action: (event) => {
      if (event && (event.metaKey || event.ctrlKey) && event.key === "p") {
        event.preventDefault();
        TDDialogUtil.showPopup({
          dialogType: TDDialogEnum.TDGoToToolPopup,
        });
      }
    },
  },
  [TDShortcutActionEnum.ShowIntelliSense]: {
    sortOrder: 2,
    key: tdUtility.newGuid(),
    presentKey: (() => {
      if (isMacOS) {
        return ["Option", "Esc"];
      } else {
        return ["Ctrl", "Space"];
      }
    })(),
    labelKey: "i18nCommon.shortKeyAction.showIntelliSense",
  },
  [TDShortcutActionEnum.ShowCommandTextEditor]: {
    sortOrder: 3,
    key: tdUtility.newGuid(),
    presentKey: ["F1"],
    labelKey: "i18nCommon.shortKeyAction.showCommandTextEditor",
  },
  [TDShortcutActionEnum.FormatCodeTextEditor]: {
    sortOrder: 4,
    key: tdUtility.newGuid(),
    presentKey: (() => {
      if (isLinux) {
        return ["Ctrl", "Shift", "i"];
      } else if (isMacOS) {
        return ["Shift", "Option", "f"];
      } else {
        return ["Shift", "Alt", "f"];
      }
    })(),

    labelKey: "i18nCommon.shortKeyAction.formatCodeTextEditor",
  },
};

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

  registerByEnum(enumKey) {
    const config = ShortcutConfigMap[enumKey];
    if (config) {
      this.register(enumKey, config);
    }
  }

  unregisterByEnum(enumKey) {
    this.unregister(enumKey);
  }

  isActive(name) {
    return this.activeShortcuts.has(name);
  }

  getActiveShortcuts() {
    return Array.from(this.activeShortcuts.values()).sort(
      (x, y) => x.sortOrder - y.sortOrder,
    );
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
    for (const key in TDShortcutActionEnum) {
      const actionKey = TDShortcutActionEnum[key];
      const config = ShortcutConfigMap[actionKey];
      if (config) {
        this.register(actionKey, config);
      }
    }
  }
}

const instance = new TDShortcutAction();
instance.initDefaultShortcuts();

export default instance;
