/**
 * Đăng ký ngôn ngữ "td-api-javascript" cho Monaco Editor:
 * - Syntax highlighting dùng tokenizer của JavaScript
 * - KHÔNG có built-in completion provider (chỉ gợi ý những gì được đăng ký riêng)
 */
import {
  conf as jsConf,
  language as jsLanguage,
} from "monaco-editor/esm/vs/basic-languages/javascript/javascript.js";
import * as monaco from "monaco-editor";

let _registered = false;

export function registerTdApiPromodeLanguage() {
  if (_registered) return;
  _registered = true;

  monaco.languages.register({ id: "td-api-javascript" });
  monaco.languages.setLanguageConfiguration("td-api-javascript", jsConf);
  monaco.languages.setMonarchTokensProvider("td-api-javascript", jsLanguage);
}

export function clearTdApiPromodeRegistration() {
  _registered = false;
}
