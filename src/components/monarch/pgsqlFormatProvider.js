import { format as sqlFormat } from "sql-formatter";

export function registerPgsqlFormatProvider(monacoInstance) {
  monacoInstance.languages.registerDocumentFormattingEditProvider("pgsql", {
    provideDocumentFormattingEdits(model) {
      const rawCode = model.getValue();
      if (!rawCode?.trim()) return [];
      try {
        const formattedCode = sqlFormat(rawCode, {
          language: "postgresql",
          indent: "  ",
          uppercase: true,
        });
        return [
          {
            range: model.getFullModelRange(),
            text: formattedCode,
          },
        ];
      } catch {
        return [];
      }
    },
  });
}
