import { createApp, h } from "vue";
import TDPopup from "@/components/TDPopup.vue";

/**
 * Enum định nghĩa các loại dialog
 */
export const TDDialogEnum = {
  TDAPISaveToCollectionPopup: "TDAPISaveToCollectionPopup",
  // Thêm các loại dialog khác ở đây
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

  /**
   * Hiển thị popup
   * @param {String} dialogType - DialogType enum
   * @param {Component} ownerForm - Component cha
   * @param {Object} props - Props truyền vào component
   * @param {Object} popupProps - Props cho TDPopup
   * @param {Function} onClose - Callback khi đóng popup (result, type)
   */
  async show({
    dialogType,
    ownerForm = null,
    props = {},
    popupProps = {},
    onClose = null,
  }) {
    const component = await this.loadComponent(dialogType);
    const dialogId = `td-dialog-${++this.dialogCounter}`;
    const container = document.createElement("div");
    container.id = dialogId;
    document.body.appendChild(container);

    let appInstance = null;

    const closeDialog = (result, type) => {
      if (onClose) onClose(result, type);

      if (appInstance) appInstance.unmount();
      setTimeout(() => {
        container.remove();
        this.activeDialogs.delete(dialogId);
      }, 300);
    };

    const dialogController = {
      id: dialogId,
      close: (result, type = "close") => closeDialog(result, type),
    };

    const DialogWrapper = {
      data() {
        return { visible: false };
      },
      mounted() {
        this.$nextTick(() => {
          this.visible = true;
        });
      },
      render() {
        return h(
          TDPopup,
          {
            visible: this.visible,
            ...popupProps,
          },
          {
            default: () =>
              h(component, {
                ...props,
                ownerForm,
                dialogInstance: dialogController,
                onClose: (data) =>
                  closeDialog(data.result, data.type || "close"),
              }),
          }
        );
      },
    };

    appInstance = createApp(DialogWrapper);

    // Copy context từ ownerForm nếu có
    if (ownerForm?.$?.appContext) {
      Object.assign(appInstance._context, ownerForm.$.appContext);
    }

    appInstance.mount(container);

    this.activeDialogs.set(dialogId, dialogController);
    return dialogController;
  }

  /**
   * Đóng tất cả popup
   */
  closeAll() {
    this.activeDialogs.forEach((dialog) => dialog.close());
  }

  /**
   * Đóng popup theo ID
   */
  closeById(dialogId) {
    this.activeDialogs.get(dialogId)?.close();
  }
}

export default new TDDialogUtil();
