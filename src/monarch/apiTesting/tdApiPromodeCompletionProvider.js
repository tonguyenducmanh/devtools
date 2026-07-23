/**
 * Completion provider cho language "javascript".
 * Đăng ký Monaco CompletionItemProvider, documentation lấy từ file .md.
 */
import { API_ITEMS } from "./tdApiPromodeItems.js";

/**
 * Đăng ký completion provider cho javascript.
 * @param {object} monacoInstance - Monaco editor instance
 * @returns {object} Disposable
 */
export function registerTdApiPromodeCompletionProvider(monacoInstance) {
  return monacoInstance.languages.registerCompletionItemProvider("javascript", {
    triggerCharacters: [".", "'", '"', "`"],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const prefix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: position.column,
      });

      const lowerPrefix = prefix.toLowerCase();
      const filtered = API_ITEMS.filter((item) =>
        item.label.toLowerCase().startsWith(lowerPrefix),
      );

      const suggestions = filtered.map((item) => ({
        label: item.label,
        kind: monacoInstance.languages.CompletionItemKind.Function,
        insertText: item.insertText,
        insertTextRules:
          monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        sortText: "0" + item.sortText,
        detail: `${window.__env?.author || "tomanh"} API`,
        documentation: {
          value: `> **${window.__env?.author || "tomanh"} API**\n\n${item.documentation}`,
          isTrusted: true,
        },
        range,
      }));

      return { suggestions };
    },
  });
}
