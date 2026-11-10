import { TM_MONACO_CONTEXT_GROUP_ID } from "@/monarch/TMMonacoConstants.js";
import { deserializeJSONText, sortJSONTextByKey } from "./TMJSONUtils.js";

/**
 * Tạo một action descriptor cho Monaco.
 * Action chỉ lấy nội dung gốc qua editorApi, biến đổi bằng hàm thuần rồi
 * yêu cầu editorApi ghi lại nội dung -> TMTextEditor không cần biết gì về JSON.
 *
 * @param {Object} options
 * @param {string} options.id - id duy nhất của action
 * @param {string} options.labelKey - key i18n cho label
 * @param {number} options.order - thứ tự trong context menu
 * @param {(text: string) => string} options.transform - hàm biến đổi text
 * @param {Object} options.context - { editorApi, onError }
 */
function createApplyTextAction({
  id,
  labelKey,
  order,
  transform,
  context = {},
}) {
  return {
    id,
    labelKey,
    contextMenuGroupId: TM_MONACO_CONTEXT_GROUP_ID,
    contextMenuOrder: order,
    run: () => {
      try {
        const source = context.editorApi?.getSourceValue?.();
        if (!source || !source.trim()) {
          return;
        }
        context.editorApi.applyText(transform(source));
      } catch (error) {
        context.onError?.(error);
      }
    },
  };
}

/**
 * Danh sách action JSON hiển thị trên context menu (chuột phải) của editor.
 * @param {Object} context - { editorApi, onError }
 * @returns {Array<Object>}
 */
export function createJSONActions(context = {}) {
  return [
    createApplyTextAction({
      id: "tm-json-sort-by-key",
      labelKey: "i18nCommon.TMTextEditor.sortByKey",
      order: 1.1,
      transform: sortJSONTextByKey,
      context,
    }),
    createApplyTextAction({
      id: "tm-json-deserialize-recursive",
      labelKey: "i18nCommon.TMTextEditor.deserializeAction",
      order: 1.2,
      transform: deserializeJSONText,
      context,
    }),
  ];
}
