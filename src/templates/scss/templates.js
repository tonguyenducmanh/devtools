// Code SCSS được import dạng raw để editor hiển thị nguyên nội dung file.
const codeModules = import.meta.glob("./*.scss", {
  query: "?raw",
  import: "default",
  eager: true,
});

// HTML mẫu cho preview: cùng tên với file scss, đặt trong previews/.
const previewModules = import.meta.glob("./previews/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

/**
 * Gói HTML cho iframe preview theo cách TMHTMLPreview: srcdoc là HTML hoàn chỉnh,
 * không chèn thêm CSS/layout riêng từ tool.
 */
function buildPreviewDocument(code, body) {
  let css = (code || "").replace(/<\/style/gi, "<\\/style");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${css}</style>
</head>
<body>
${body || ""}
</body>
</html>`;
}

const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".scss", "");
  let labelKey = `i18nTemplate.scssTemplate.${key}`;
  let previewHtml = buildPreviewDocument(
    code,
    previewModules[`./previews/${key}.html`] || "",
  );

  return { key, labelKey, code, previewHtml };
});

export default templates;
