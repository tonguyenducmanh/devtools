// cấu hình import sql từ file raw
const codeModules = import.meta.glob("./*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Tạo object trống cho pgQueries trước
const queriesObj = {};

Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".sql", "");

  // Gán vào object mới
  queriesObj[key] = code;
});

// Export object mới
export const pgQueries = queriesObj;
