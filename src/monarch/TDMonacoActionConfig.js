/**
 * Cấu hình custom Monaco actions (context menu, keybinding) theo từng ngôn ngữ.
 * Mỗi action là một descriptor object chứa `id`, `labelKey`, các option của
 * editor.addAction và hàm `run`. TDTextEditor sẽ tự động add/dispose action
 * mỗi khi language thay đổi để tránh action cũ bị "treo" trên editor.
 */

/**
 * Group dành cho custom actions của TDTextEditor trên Monaco context menu.
 * Monaco hardcode group "navigation" luôn đứng đầu (sort logic trong menuService),
 * nên để action nằm ở trên cùng (trước "Go to Symbol", order 1.1) phải dùng đúng
 * group này kèm contextMenuOrder nhỏ.
 */
export const TD_MONACO_CONTEXT_GROUP_ID = "navigation";

/**
 * Sort đệ quy key của object JSON theo alphabet (giữ nguyên thứ tự mảng)
 * @param {*} obj
 * @returns {*}
 */
export function sortObjectByKey(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => sortObjectByKey(item));
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = sortObjectByKey(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

/**
 * Factory trả về action descriptor "Sort by key" cho editor JSON
 * @param {Object} ctx - { onSuccess(sortedText), onError(error) }
 */
function createJSONSortByKeyAction(ctx = {}) {
  return {
    id: "sort-json-keys",
    labelKey: "i18nCommon.TDTextEditor.sortByKey",
    contextMenuGroupId: TD_MONACO_CONTEXT_GROUP_ID,
    contextMenuOrder: 1.1,
    run: (editor) => {
      try {
        const raw = editor.getValue();
        if (!raw || !raw.trim()) return;
        const parsed = JSON.parse(raw.trim());
        const sorted = sortObjectByKey(parsed);
        const sortedText = JSON.stringify(sorted, null, 2);

        // Dùng executeEdits thay vì setValue để giữ undo stack (setValue sẽ reset undo)
        const model = editor.getModel();
        if (model) {
          editor.pushUndoStop();
          editor.executeEdits("sort-json-keys", [
            {
              range: model.getFullModelRange(),
              text: sortedText,
              forceMoveMarkers: true,
            },
          ]);
          editor.pushUndoStop();
        } else {
          editor.setValue(sortedText);
        }
        ctx.onSuccess?.(sortedText);
      } catch (error) {
        ctx.onError?.(error);
      }
    },
  };
}

/**
 * Lấy danh sách action descriptors theo ngôn ngữ
 * @param {string} language
 * @param {Object} context - context truyền vào factory (onSuccess, onError, ...)
 * @returns {Array<Object>}
 */
export function getMonacoActionsByLanguage(language, context) {
  const actions = [];
  switch (language) {
    case "json":
      actions.push(createJSONSortByKeyAction(context));
      break;
    default:
      break;
  }
  return actions;
}