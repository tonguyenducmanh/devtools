import { createApp } from "vue";

/**
 * Enum định nghĩa các loại dialog
 */
export const TDDialogEnum = {
  TDAPISaveToCollectionPopup: 1,
  TDGoToToolPopup: 2,
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
  async show({ dialogType, ownerForm, props = {}, param = {}, callback }) {
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
    const instance = app._instance?.proxy;
    if (instance?.show && param !== undefined) {
      instance.show(param);
    } else {
      throw new Error(`DialogType "${dialogType}" chưa triển khai hàm show`);
    }
    this.activeDialogs.set(dialogId, {
      app,
      container,
    });

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
    return true;
  }

  /**
   * Đóng toàn bộ popup
   */
  closeAll() {
    for (const dialogId of this.activeDialogs.keys()) {
      this.closeById(dialogId);
    }
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
