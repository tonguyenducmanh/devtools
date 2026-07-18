import { createApp } from "vue";

/**
 * Enum định nghĩa các loại dialog
 */
export const TDDialogEnum = {
  TDAPISaveToCollectionPopup: 1,
  TDGoToToolPopup: 2,
  TDAPIImportCURLPopup: 3,
  TDAPIMokingImportPopup: 4,
  TDPostgreSQLConnectionPopup: 5,
  TDPostgreSQLInspect: 6,
  TDQuickPreview: 7,
  TDPostgreSQLDatabaseList: 8,
  TDPostgreSQLCloneCachePopup: 9,
  TDShowAllShortcutPopup: 10,
  TDPostgreSQLBackupPopup: 11,
  TDPostgreSQLRestorePopup: 12,
  TDPostgreSQLClonePopup: 13,
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
  [TDDialogEnum.TDPostgreSQLConnectionPopup]: () =>
    import("@/views/dialogs/TDPostgreSQLConnectionPopup.vue"),
  [TDDialogEnum.TDPostgreSQLInspect]: () =>
    import("@/views/dialogs/TDPostgreSQLInspect.vue"),
  [TDDialogEnum.TDQuickPreview]: () =>
    import("@/views/dialogs/TDQuickPreview.vue"),
  [TDDialogEnum.TDPostgreSQLDatabaseList]: () =>
    import("@/views/dialogs/TDPostgreSQLDatabaseList.vue"),
  [TDDialogEnum.TDPostgreSQLCloneCachePopup]: () =>
    import("@/views/dialogs/TDPostgreSQLCloneCachePopup.vue"),
  [TDDialogEnum.TDShowAllShortcutPopup]: () =>
    import("@/views/dialogs/TDShowAllShortcutPopup.vue"),
  [TDDialogEnum.TDPostgreSQLBackupPopup]: () =>
    import("@/views/dialogs/TDPostgreSQLBackupPopup.vue"),
  [TDDialogEnum.TDPostgreSQLRestorePopup]: () =>
    import("@/views/dialogs/TDPostgreSQLRestorePopup.vue"),
  [TDDialogEnum.TDPostgreSQLClonePopup]: () =>
    import("@/views/dialogs/TDPostgreSQLClonePopup.vue"),
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
    this.globalAppContext = null;
    this._boundKeydown = this._onKeydown.bind(this);
  }

  _onKeydown(event) {
    if (event.key === "Escape" && this.activeDialogs.size > 0) {
      const lastId = Array.from(this.activeDialogs.keys()).pop();
      if (lastId) {
        this.closeById(lastId);
      }
    }
  }

  _updateKeydownListener() {
    if (this.activeDialogs.size > 0) {
      window.addEventListener("keydown", this._boundKeydown);
    } else {
      window.removeEventListener("keydown", this._boundKeydown);
    }
  }

  setAppContext(context) {
    this.globalAppContext = context;
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
    } else if (this.globalAppContext) {
      Object.assign(app._context, this.globalAppContext);
    }

    const vm = app.mount(container);
    // Gọi hàm show trên component instance (vm) thay vì object methods
    if (typeof vm.show === "function" && param !== undefined) {
      vm.show(param);
    } else if (app._component.methods?.show && param !== undefined) {
      // Dành cho trường hợp fallback nếu chưa expose (Vue 3 script setup)
      app._component.methods.show.call(vm, param);
    } else {
      throw new Error(`DialogType "${dialogType}" chưa triển khai hàm show`);
    }

    this.activeDialogs.set(dialogId, {
      app,
      container,
    });

    this._updateKeydownListener();

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

    this._updateKeydownListener();

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
