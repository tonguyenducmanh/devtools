import { createApp } from "vue";

/**
 * Enum định nghĩa các loại dialog
 */
export const TDDialogEnum = {
  TDAPISaveToCollectionPopup: "TDAPISaveToCollectionPopup",
};
/**
 * Map DialogType với component tương ứng
 * CHỈ ĐƯỢC QUẢN LÝ TRONG FILE NÀY
 */
const DialogComponentMap = {
  [TDDialogEnum.TDAPISaveToCollectionPopup]: () =>
    import("@/views/dialogs/TDAPISaveToCollectionPopup.vue"),
};
/**
 * TDDialogUtil - Utility quản lý popup động
 */
class TDDialogUtil {
  constructor() {
    this.activeDialogs = new Map();
    this.dialogCounter = 0;
  }
  /**
   * Load component từ DialogType
   */
  async loadComponent(dialogType) {
    const loader = DialogComponentMap[dialogType];
    if (!loader) {
      throw new Error(`DialogType "${dialogType}" không tồn tại`);
    }
    const module = await loader();
    return module.default || module;
  }

  async show({ dialogType, ownerForm, props = {} }, callback = null) {
    const component = await this.loadComponent(dialogType);
    const dialogId = `td-dialog-${++this.dialogCounter}`;
    const container = document.createElement("div");
    container.id = dialogId;
    document.body.appendChild(container);

    let appInstance;

    const closeDialog = (callbackObj) => {
      appInstance?.unmount();
      el.remove();
      if (callback && typeof callback == "functions") {
        callback(callbackObj);
      }
    };

    appInstance = createApp(component, {
      ...props,
      ownerForm,
      onClose: closeDialog,
    });

    // copy appContext
    if (ownerForm?.$?.appContext) {
      Object.assign(app._context, ownerForm.$.appContext);
    }

    appInstance.mount(el);
  }
}

export default new TDDialogUtil();
