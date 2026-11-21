/**
 * Tiện ích chung cho preview chạy trong iframe.
 * iframe là document riêng nên không kế thừa :root của app — phải copy CSS
 * custom property sang srcdoc để template/preview chỉ dùng var(--...).
 */

export function collectAppCssVariables() {
  if (typeof window === "undefined") return "";
  let vars = [];
  [document.documentElement, document.body].forEach((element) => {
    if (!element) return;
    let style = window.getComputedStyle(element);
    for (let i = 0; i < style.length; i++) {
      let name = style[i];
      if (name.indexOf("--") === 0) {
        vars.push(`${name}:${style.getPropertyValue(name).trim()};`);
      }
    }
  });
  return vars.join("");
}

export function injectAppCssVariables(html) {
  let rootVars = collectAppCssVariables();
  return (html || "").replace(
    "</head>",
    `<style>:root{${rootVars}}</style></head>`,
  );
}
