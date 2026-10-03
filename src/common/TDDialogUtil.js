import { createApp } from "vue";

/**
 * Enum định nghĩa các loại dialog
 *
 * Giá trị chỉ dùng nội bộ làm key tra cứu, không lưu vào database nên có thể
 * đánh số lại khi bỏ bớt dialog. Luôn thêm mới ở cuối danh sách.
 */
export const TDDialogEnum = {
  TDGoToToolPopup: 1,
  TDAPIImportCURLPopup: 2,
  TDAPIMokingImportPopup: 3,
  TDPostgreSQLConnectionPopup: 4,
  TDPostgreSQLInspect: 5,
  TDQuickPreview: 6,
  TDPostgreSQLDatabaseList: 7,
  TDPostgreSQLCloneCachePopup: 8,
  TDShowAllShortcutPopup: 9,
  TDPostgreSQLBackupPopup: 10,
  TDPostgreSQLRestorePopup: 11,
  TDPostgreSQLClonePopup: 12,
  TDRDPRemoteFilesPopup: 13,
  TDRDPConnectionPopup: 14,
  // ── Dialog dùng chung cho pattern master-detail ──────────────────────────
  TDCollectionGroupPopup: 15,
  TDCollectionPickerPopup: 16,
  TDConfirmPopup: 17,
};

/**
 * Map DialogType với component tương ứng
 * CHỈ QUẢN LÝ TRONG FILE NÀY
 */
const DialogComponentMap = {
  [TDDialogEnum.TDGoToToolPopup]: () =>
    import("@/views/dialogs/TDGoToToolPopup.vue"),
  [TDDialogEnum.TDAPIImportCURLPopup]: () =>
    import("@/views/dialogs/TDAPIImportCURLPopup.vue"),
  [TDDialogEnum.TDAPIMokingImportPopup]: () =>
    import("@/views/dialogs/TDAPIMokingImportPopup.vue"),
  [TDDialogEnum.TDPostgreSQLConnectionPopup]: () =>
    import("@/views/dialogs/postgresql/TDPostgreSQLConnectionPopup.vue"),
  [TDDialogEnum.TDPostgreSQLInspect]: () =>
    import("@/views/dialogs/postgresql/TDPostgreSQLInspect.vue"),
  [TDDialogEnum.TDQuickPreview]: () =>
    import("@/views/dialogs/TDQuickPreview.vue"),
  [TDDialogEnum.TDPostgreSQLDatabaseList]: () =>
    import("@/views/dialogs/postgresql/TDPostgreSQLDatabaseList.vue"),
  [TDDialogEnum.TDPostgreSQLCloneCachePopup]: () =>
    import("@/views/dialogs/postgresql/TDPostgreSQLCloneCachePopup.vue"),
  [TDDialogEnum.TDShowAllShortcutPopup]: () =>
    import("@/views/dialogs/TDShowAllShortcutPopup.vue"),
  [TDDialogEnum.TDPostgreSQLBackupPopup]: () =>
    import("@/views/dialogs/postgresql/TDPostgreSQLBackupPopup.vue"),
  [TDDialogEnum.TDPostgreSQLRestorePopup]: () =>
    import("@/views/dialogs/postgresql/TDPostgreSQLRestorePopup.vue"),
  [TDDialogEnum.TDPostgreSQLClonePopup]: () =>
    import("@/views/dialogs/postgresql/TDPostgreSQLClonePopup.vue"),
  [TDDialogEnum.TDRDPRemoteFilesPopup]: () =>
    import("@/views/dialogs/TDRDPRemoteFilesPopup.vue"),
  [TDDialogEnum.TDRDPConnectionPopup]: () =>
    import("@/views/dialogs/rdp/TDRDPConnectionPopup.vue"),
  [TDDialogEnum.TDCollectionGroupPopup]: () =>
    import("@/views/dialogs/TDCollectionGroupPopup.vue"),
  [TDDialogEnum.TDCollectionPickerPopup]: () =>
    import("@/views/dialogs/TDCollectionPickerPopup.vue"),
  [TDDialogEnum.TDConfirmPopup]: () =>
    import("@/views/dialogs/TDConfirmPopup.vue"),
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
        // Gọi onClose (nếu có) chứ không đóng thẳng, để callback của popup
        // (vd: TDDialogUtil.confirm) vẫn được chạy và không bị treo promise.
        const dialog = this.activeDialogs.get(lastId);
        if (dialog?.onClose) {
          dialog.onClose();
        } else {
          this.closeById(lastId);
        }
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
      // Giữ lại onClose để đóng bằng Escape vẫn chạy callback,
      // không bỏ sót promise đang chờ (xem _onKeydown)
      onClose: close,
    });

    this._updateKeydownListener();

    return dialogId;
  }

  /**
   * Hỏi xác nhận user, trả về Promise<boolean>
   * Dùng cho thao tác không thể hoàn tác như xoá nhóm (xoá luôn item bên trong)
   * @returns {Promise<boolean>} true nếu user đồng ý
   */
  async confirm({ ownerForm, title = "", message = "", confirmLabel = "", cancelLabel = "" }) {
    return new Promise((resolve) => {
      // Chốt 1 lần: callback của showPopup chỉ chạy 1 lần khi popup đóng,
      // nhưng guard lại để chắc chắn resolve chỉ đúng 1 lần
      let settled = false;
      const settle = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      this.showPopup({
        dialogType: TDDialogEnum.TDConfirmPopup,
        ownerForm,
        param: { title, message, confirmLabel, cancelLabel },
        callback: (result) => settle(!!result),
      }).catch((error) => {
        console.error("Không mở được popup xác nhận:", error);
        settle(false);
      });
    });
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
