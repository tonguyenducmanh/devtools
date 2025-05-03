// src/shortkey.js
import utility from "@/common/TDUtility.js";

function handleShortcut(e) {
  e.preventDefault();
  handleShortcutFunction(e);
}

// xử lý sự kiện khi bấm tổ hợp phím tắt
let handleShortcutFunction = utility.debounce((e) => {
  // tổ hợp phím Ctrl + K
  if (e.ctrlKey && e.key.toLowerCase() === "k") {
    console.log("Ctrl + K pressed globally");
  }
}, 500);

window.addEventListener("keydown", handleShortcut);

// Optional cleanup (not required unless you need it)
export function removeShortcut() {
  window.removeEventListener("keydown", handleShortcut);
}
