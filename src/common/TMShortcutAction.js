import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";
import tmUtility from "@/common/TMUtility.js";

let isMacOS = tmUtility.isMacOS();
let isLinux = tmUtility.isLinux();
let isWindows = tmUtility.isWindows();

let currentOS = tmUtility.getOS();

export const TMShortcutActionEnum = {
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
  ChangeEditorTheme: "ChangeEditorTheme",
};

const ShortcutConfigMap = {
  [TMShortcutActionEnum.Search]: {
    sortOrder: 1,
    key: tmUtility.newGuid(),
    presentKey: (() => {
      return [tmUtility.ctrlKey(), "P"];
    })(),
    labelKey: "i18nCommon.shortKeyAction.search",
    action: (event) => {
      if (event && (event.metaKey || event.ctrlKey) && event.key === "p") {
        event.preventDefault();
        TMDialogUtil.showPopup({
          dialogType: TMDialogEnum.TMGoToToolPopup,
        });
      }
    },
  },
  [TMShortcutActionEnum.ShowIntelliSense]: {
    sortOrder: 2,
    key: tmUtility.newGuid(),
    presentKey: (() => {
      if (isMacOS) {
        return ["Option", "Esc"];
      } else {
        return ["Ctrl", "Space"];
      }
    })(),
    labelKey: "i18nCommon.shortKeyAction.showIntelliSense",
  },
  [TMShortcutActionEnum.ShowCommandTextEditor]: {
    sortOrder: 3,
    key: tmUtility.newGuid(),
    presentKey: ["F1"],
    labelKey: "i18nCommon.shortKeyAction.showCommandTextEditor",
  },
  [TMShortcutActionEnum.FormatCodeTextEditor]: {
    sortOrder: 4,
    key: tmUtility.newGuid(),
    // Shift+Alt+F là keybinding mặc định của monaco (editor.action.formatDocument),
    // handler keydown ở TMDynamicTabView cũng chỉ chặn khi không kèm modifier khác
    // → cấm dùng Alt+F (hoặc bất kỳ tổ hợp chứa Shift+Alt+F) cho shortcut khác.
    presentKey: (() => {
      if (isLinux) {
        return ["Ctrl", "Shift", "I"];
      } else if (isMacOS) {
        return ["Shift", "Option", "F"];
      } else {
        return ["Shift", "Alt", "F"];
      }
    })(),

    labelKey: "i18nCommon.shortKeyAction.formatCodeTextEditor",
  },
  [TMShortcutActionEnum.ChangeEditorTheme]: {
    sortOrder: 5,
    key: tmUtility.newGuid(),
    presentKey: (() => {
      return [tmUtility.ctrlKey(), "K"];
    })(),

    labelKey: "i18nCommon.changeMonacoTheme",
  },
};

class TMShortcutAction {
  constructor() {
    this.activeShortcuts = new Map();
    this.handlers = {};
    this.isListening = false;
    this.listeners = [];
  }

  register(name, config) {
    if (!this.activeShortcuts.has(name)) {
      config.key = tmUtility.newGuid();
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
    for (const key in TMShortcutActionEnum) {
      const actionKey = TMShortcutActionEnum[key];
      const config = ShortcutConfigMap[actionKey];
      if (config) {
        this.register(actionKey, config);
      }
    }
  }
}

const instance = new TMShortcutAction();
instance.initDefaultShortcuts();

export default instance;
