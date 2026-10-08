import { createApp } from "vue";

/**
 * Enum định nghĩa các loại dialog
 *
 * Giá trị chỉ dùng nội bộ làm key tra cứu, không lưu vào database nên có thể
 * đánh số lại khi bỏ bớt dialog. Luôn thêm mới ở cuối danh sách.
 */
export const TMDialogEnum = {
  TMGoToToolPopup: 1,
  TMAPIImportCURLPopup: 2,
  TMAPIMokingImportPopup: 3,
  TMPostgreSQLConnectionPopup: 4,
  TMPostgreSQLInspect: 5,
  TMQuickPreview: 6,
  TMPostgreSQLDatabaseList: 7,
  TMPostgreSQLCloneCachePopup: 8,
  TMShowAllShortcutPopup: 9,
  TMPostgreSQLBackupPopup: 10,
  TMPostgreSQLRestorePopup: 11,
  TMPostgreSQLClonePopup: 12,
  TMRDPRemoteFilesPopup: 13,
  TMRDPConnectionPopup: 14,
  // ── Dialog dùng chung cho pattern master-detail ──────────────────────────
  TMCollectionGroupPopup: 15,
  TMCollectionPickerPopup: 16,
  TMConfirmPopup: 17,
  TMAgreementPopup: 18,
};

/**
 * Map DialogType với component tương ứng
 * CHỈ QUẢN LÝ TRONG FILE NÀY
 */
const DialogComponentMap = {
  [TMDialogEnum.TMGoToToolPopup]: () =>
    import("@/views/dialogs/TMGoToToolPopup.vue"),
  [TMDialogEnum.TMAPIImportCURLPopup]: () =>
    import("@/views/dialogs/TMAPIImportCURLPopup.vue"),
  [TMDialogEnum.TMAPIMokingImportPopup]: () =>
    import("@/views/dialogs/TMAPIMokingImportPopup.vue"),
  [TMDialogEnum.TMPostgreSQLConnectionPopup]: () =>
    import("@/views/dialogs/postgresql/TMPostgreSQLConnectionPopup.vue"),
  [TMDialogEnum.TMPostgreSQLInspect]: () =>
    import("@/views/dialogs/postgresql/TMPostgreSQLInspect.vue"),
  [TMDialogEnum.TMQuickPreview]: () =>
    import("@/views/dialogs/TMQuickPreview.vue"),
  [TMDialogEnum.TMPostgreSQLDatabaseList]: () =>
    import("@/views/dialogs/postgresql/TMPostgreSQLDatabaseList.vue"),
  [TMDialogEnum.TMPostgreSQLCloneCachePopup]: () =>
    import("@/views/dialogs/postgresql/TMPostgreSQLCloneCachePopup.vue"),
  [TMDialogEnum.TMShowAllShortcutPopup]: () =>
    import("@/views/dialogs/TMShowAllShortcutPopup.vue"),
  [TMDialogEnum.TMPostgreSQLBackupPopup]: () =>
    import("@/views/dialogs/postgresql/TMPostgreSQLBackupPopup.vue"),
  [TMDialogEnum.TMPostgreSQLRestorePopup]: () =>
    import("@/views/dialogs/postgresql/TMPostgreSQLRestorePopup.vue"),
  [TMDialogEnum.TMPostgreSQLClonePopup]: () =>
    import("@/views/dialogs/postgresql/TMPostgreSQLClonePopup.vue"),
  [TMDialogEnum.TMRDPRemoteFilesPopup]: () =>
    import("@/views/dialogs/TMRDPRemoteFilesPopup.vue"),
  [TMDialogEnum.TMRDPConnectionPopup]: () =>
    import("@/views/dialogs/rdp/TMRDPConnectionPopup.vue"),
  [TMDialogEnum.TMCollectionGroupPopup]: () =>
    import("@/views/dialogs/TMCollectionGroupPopup.vue"),
  [TMDialogEnum.TMCollectionPickerPopup]: () =>
    import("@/views/dialogs/TMCollectionPickerPopup.vue"),
  [TMDialogEnum.TMConfirmPopup]: () =>
    import("@/views/dialogs/TMConfirmPopup.vue"),
  [TMDialogEnum.TMAgreementPopup]: () =>
    import("@/views/dialogs/TMAgreementPopup.vue"),
};

class TMDialogUtil {
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
        // (vd: TMDialogUtil.confirm) vẫn được chạy và không bị treo promise.
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
    const dialogId = `tm-dialog-${dialogType}-${++this.dialogCounter}`;

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
        dialogType: TMDialogEnum.TMConfirmPopup,
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

export default new TMDialogUtil();
