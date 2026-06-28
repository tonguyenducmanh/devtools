import prettier from "prettier/standalone";
import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";

export function registerTdApiPromodeFormatProvider(monacoInstance) {
  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "td-api-javascript",
    {
      async provideDocumentFormattingEdits(model, options, token) {
        const code = model.getValue();
        if (!code?.trim()) return [];

        try {
          const formatted = await prettier.format(code, {
            parser: "babel",
            plugins: [prettierPluginEstree, prettierPluginBabel],
            tabWidth: options.tabSize || 2,
            useTabs: !options.insertSpaces,
          });

          if (formatted === code) return [];
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        } catch (err) {
          console.warn("[td-api-javascript] Format error:", err);
          return [];
        }
      },
    },
  );
}
