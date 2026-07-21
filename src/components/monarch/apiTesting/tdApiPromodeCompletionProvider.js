/**
 * Completion provider cho language "td-api-javascript".
 * Đăng ký Monaco CompletionItemProvider, documentation lấy từ file .md.
 */
import { API_ITEMS } from "./tdApiPromodeItems.js";

/**
 * Đăng ký completion provider cho td-api-javascript.
 * @param {object} monacoInstance - Monaco editor instance
 * @returns {object} Disposable
 */
export function registerTdApiPromodeCompletionProvider(monacoInstance) {
  return monacoInstance.languages.registerCompletionItemProvider(
    "td-api-javascript",
    {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = API_ITEMS.map((item) => ({
          label: item.label,
          kind: monacoInstance.languages.CompletionItemKind.Function,
          insertText: item.insertText,
          insertTextRules:
            monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          sortText: item.sortText,
          detail: item.label,
          documentation: {
            value: item.documentation,
            isTrusted: true,
          },
          range,
        }));

        return { suggestions };
      },
    },
  );
}
