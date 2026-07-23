/**
 * Cấu hình IntelliSense cho language "javascript" trong Monaco Editor:
 * - Đăng ký TypeScript declaration cho 10 API functions
 * - Kế thừa toàn bộ built-in JavaScript intellisense
 */
import * as monaco from "monaco-editor";
import apiTypeDeclarations from "./apiTypes.d.ts?raw";

let _registered = false;

export function registerTdApiPromodeLanguage() {
  if (_registered) return;
  _registered = true;

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    moduleResolution:
      monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noSemanticValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    apiTypeDeclarations,
    "ts:api-types.d.ts",
  );
}

export function clearTdApiPromodeRegistration() {
  _registered = false;
}
