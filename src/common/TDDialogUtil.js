import { createApp } from "vue";

/**
 * Enum định nghĩa các loại dialog
 */
export const TDDialogEnum = {
  TDAPISaveToCollectionPopup: 1,
  TDGoToToolPopup: 2,
  TDAPIImportCURLPopup: 3,
  TDAPIMokingImportPopup: 4,
};

/**
 * Map DialogType với component tương ứng
 * CHỈ QUẢN LÝ TRONG FILE NÀY
 */
const DialogComponentMap = {
  [TDDialogEnum.TDAPISaveToCollectionPopup]: () =>
    import("@/views/dialogs/TDAPISaveToCollectionPopup.vue"),
  [TDDialogEnum.TDGoToToolPopup]: () =>
    import("@/views/dialogs/TDGoToToolPopup.vue"),
  [TDDialogEnum.TDAPIImportCURLPopup]: () =>
    import("@/views/dialogs/TDAPIImportCURLPopup.vue"),
  [TDDialogEnum.TDAPIMokingImportPopup]: () =>
    import("@/views/dialogs/TDAPIMokingImportPopup.vue"),
};

class TDDialogUtil {
  constructor() {
    /**
     * activeDialogs:
     * key   : dialogId
     * value : { app, container }
     */
    this.activeDialogs = new Map();
    this.dialogCounter = 0;
    this._boundKeyHandler = null;
  }

  initGlobalListeners() {
    if (this._boundKeyHandler) return;
    this._boundKeyHandler = (event) => {
      if (event.key === "Escape" && this.activeDialogs.size > 0) {
        const topDialogId = this.getTopDialogId();
        if (topDialogId) {
          this.closeById(topDialogId);
        }
      }
    };
    document.addEventListener("keydown", this._boundKeyHandler);
  }

  removeGlobalListeners() {
    if (this._boundKeyHandler) {
      document.removeEventListener("keydown", this._boundKeyHandler);
      this._boundKeyHandler = null;
    }
  }

  getTopDialogId() {
    const ids = Array.from(this.activeDialogs.keys());
    return ids[ids.length - 1];
  }

  async loadComponent(dialogType) {
    const loader = DialogComponentMap[dialogType];
    if (!loader) {
      throw new Error(`DialogType "${dialogType}" không tồn tại`);
    }
    const module = await loader();
    return module.default || module;
  }

  /**
   * Hiển thị dialog
   * @returns dialogId
   */
  async showPopup({ dialogType, ownerForm, props = {}, param = {}, callback }) {
    const component = await this.loadComponent(dialogType);
    const dialogId = `td-dialog-${dialogType}-${++this.dialogCounter}`;

    const container = document.createElement("div");
    container.id = dialogId;
    document.body.appendChild(container);

    let app;

    const close = (payload) => {
      this.closeById(dialogId, payload);
      callback?.(payload);
    };

    app = createApp(component, {
      ...props,
      ownerForm,
      onClose: close, // popup con chỉ emit close
    });

    // kế thừa appContext (i18n, store, directive…)
    if (ownerForm?.$?.appContext) {
      Object.assign(app._context, ownerForm.$.appContext);
    }

    app.mount(container);
    const instance = app._component.methods;
    if (instance?.show && param !== undefined) {
      instance.show(param);
    } else {
      throw new Error(`DialogType "${dialogType}" chưa triển khai hàm show`);
    }
    this.activeDialogs.set(dialogId, {
      app,
      container,
    });

    this.initGlobalListeners();

    return dialogId;
  }

  /**
   * Đóng popup theo id
   */
  closeById(dialogId, payload) {
    const dialog = this.activeDialogs.get(dialogId);
    if (!dialog) return false;

    dialog.app.unmount();
    dialog.container.remove();

    this.activeDialogs.delete(dialogId);

    if (this.activeDialogs.size === 0) {
      this.removeGlobalListeners();
    }
    return true;
  }

  /**
   * Đóng toàn bộ popup
   */
  closeAll() {
    for (const dialogId of this.activeDialogs.keys()) {
      this.closeById(dialogId);
    }
    this.removeGlobalListeners();
  }

  /**
   * Có popup nào đang mở không
   */
  hasAnyOpen() {
    return this.activeDialogs.size > 0;
  }

  /**
   * (Optional) Lấy danh sách id popup đang mở
   */
  getActiveIds() {
    return Array.from(this.activeDialogs.keys());
  }
}

export default new TDDialogUtil();
