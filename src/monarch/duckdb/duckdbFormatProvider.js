import { format as sqlFormat } from "sql-formatter";
/**
 * hàm format đặc thù dành cho DuckDB, vì monaco editor hiện tại chưa support format
 * language này nên cần dùng thư viện sql-formatter để làm hàm format chính
 * @param {*} monacoInstance instance monaco editor để inject hàm format
 */
let _formatProviderDisposable = null;

export function registerDuckdbFormatProvider(monacoInstance) {
  // Hàm này được gọi ở onInit của editor và ở mỗi lần applyMonacoIntellisense.
  // Nếu không chặn thì mỗi lần gọi lại đăng ký thêm 1 provider (Monaco hỏi chọn formatter / format nhiều lần).
  if (_formatProviderDisposable) return;
  _formatProviderDisposable =
    monacoInstance.languages.registerDocumentFormattingEditProvider("duckdb", {
      provideDocumentFormattingEdits(model) {
        const rawCode = model.getValue();
        if (!rawCode?.trim()) return [];
        try {
          const formattedCode = sqlFormat(rawCode, {
            language: "sql",
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
