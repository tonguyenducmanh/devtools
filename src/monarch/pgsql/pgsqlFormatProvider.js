import { format as sqlFormat } from "sql-formatter";
/**
 * hàm format đặc thù dành cho PostgreSQL, vì monaco editor hiện tại chưa support format
 * language này nên cần dùng thư viện sql-formatter để làm hàm format chính
 * @param {*} monacoInstance instance monaco editor để inject hàm format
 */
export function registerPgsqlFormatProvider(monacoInstance) {
  // gọi hàm đăng ký sự kiện format với language pgsql
  monacoInstance.languages.registerDocumentFormattingEditProvider("pgsql", {
    provideDocumentFormattingEdits(model) {
      // lấy ra giá trị đang nhập liệu của editor
      const rawCode = model.getValue();
      if (!rawCode?.trim()) return [];
      try {
        // gọi hàm format dữ liệu
        const formattedCode = sqlFormat(rawCode, {
          language: "postgresql", // cấu hình ngôn ngữ format của thư viện sql-formatter
          indent: "  ", // khoảng cách tab cấu hình
          uppercase: true,
        });
        return [
          {
            // lấy range của toàn bộ tài liệu
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
