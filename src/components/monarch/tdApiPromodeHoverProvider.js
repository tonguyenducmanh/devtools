/**
 * Hover provider cho language "td-api-javascript".
 * Đăng ký Monaco HoverProvider, documentation lấy từ file .md.
 */
import { API_ITEMS, getItemLabels } from "./tdApiPromodeItems.js";

/**
 * Đăng ký hover provider cho td-api-javascript.
 * @param {object} monacoInstance - Monaco editor instance
 * @returns {object} Disposable
 */
export function registerTdApiPromodeHoverProvider(monacoInstance) {
  const itemLabels = getItemLabels();

  return monacoInstance.languages.registerHoverProvider(
    "td-api-javascript",
    {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const name = word.word;
        if (!itemLabels.includes(name)) return null;

        const item = API_ITEMS.find((i) => i.label === name);
        if (!item) return null;

        return {
          contents: [{ value: item.documentation, isTrusted: true }],
        };
      },
    },
  );
}
