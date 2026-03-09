import { createApp } from "vue";
import TDContextMenu from "@/components/TDContextMenu.vue";

/**
 * ContextMenuManager — singleton quản lý context menu toàn cục
 */
class ContextMenuManager {
  constructor() {
    this.instance = null;
    this.container = null;
    this._init();
  }

  _init() {
    this.container = document.createElement("div");
    this.container.id = "td-context-menu-global";
    document.body.appendChild(this.container);

    const app = createApp(TDContextMenu);
    this.instance = app.mount(this.container);
  }

  /**
   * Mở context menu.
   * @param {MouseEvent} event  - Event chuột (dùng để lấy vị trí)
   * @param {Array}      items  - Danh sách item: [{ key, label, icon?, danger?, action }]
   *
   * @example
   * this.$tdContextMenu.open(event, [
   *   { key: "duplicate", label: "Nhân bản tab", action: () => duplicateTab(id) },
   *   { key: "close",     label: "Đóng tab",     danger: true, action: () => closeTab(id) },
   * ]);
   */
  open(event, items) {
    if (!this.instance) return;
    this.instance.open({
      x: event.clientX,
      y: event.clientY,
      items,
    });
  }

  /** Đóng menu theo chương trình */
  close() {
    this.instance?.close();
  }

  destroy() {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.instance = null;
    this.container = null;
  }
}

// Singleton
const contextMenuManager = new ContextMenuManager();

export const contextMenu = {
  open: (event, items) => contextMenuManager.open(event, items),
  close: () => contextMenuManager.close(),
};

// Vue plugin
export const TDContextMenuPlugin = {
  install(app) {
    app.config.globalProperties.$tdContextMenu = contextMenu;
    app.provide("tdContextMenu", contextMenu);
  },
};

export default TDContextMenuPlugin;
