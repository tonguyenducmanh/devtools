import TMJSONFooterControls from "./TMJSONFooterControls.vue";
import { createJSONActions } from "./TMJSONActions.js";
import { deserializeJSONText } from "./TMJSONUtils.js";

/**
 * Language feature cho JSON.
 *
 * Contract chung (xem TMLanguageFeatureRegistry.js):
 * - languages: các language id Monaco mà feature này áp dụng.
 * - footerControls: component Vue render trong footer của TMTextEditor.
 * - getActions(context): danh sách action descriptor cho context menu.
 * - preview.transform(text): biến đổi text gốc thành text chỉ-đọc để xem trước.
 */
const jsonEditorFeature = {
  id: "json",
  languages: ["json"],
  footerControls: TMJSONFooterControls,
  getActions: createJSONActions,
  preview: {
    transform: deserializeJSONText,
  },
};

export default jsonEditorFeature;
