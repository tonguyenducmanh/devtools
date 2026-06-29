// cấu hình import sql từ file raw
const codeModules = import.meta.glob("./*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Tạo object trống cho pgQueries trước
const queriesObj = {};

// Duyệt qua codeModules để vừa build mảng, vừa gán giá trị vào object
const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".sql", "");
  let labelKey = `i18nTemplate.postgreSQLTemplate.${key}`;

  // Gán vào object mới
  queriesObj[key] = code;

  return { key, labelKey, code };
});

// Export object mới
export const pgQueries = queriesObj;

// Export default mảng như cũ
export default templates;
