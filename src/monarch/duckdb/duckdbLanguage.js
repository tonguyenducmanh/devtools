/**
 * file định nghĩa cú pháp (Syntax Highlighting) cho thư viện monaco editor,
 * ngôn ngữ "duckdb" (DuckDB SQL). DuckDB chưa có chuẩn built-in trong Monaco,
 * nên tự định nghĩa rule tô màu và semantic highlighting riêng.
 */

import * as monaco from "monaco-editor";
import {
  BUILTIN_KEYWORDS,
  BUILTIN_TYPE_KEYWORDS,
  BUILTIN_OBJECT_KEYWORDS,
  SEMANTIC_LEGEND,
} from "./duckdbKeyword.js";

// biến trạng thái toàn bộ schema/bảng/hàm/keyword của session DuckDB hiện tại
let _allSchemas = new Set();
let _allTables = new Set();
let _allFunctionNames = new Set();
let _duckdbKeywordSet = new Set();

let _monarchRegistered = false;
let _semanticRegistered = false;

/**
 * build ra danh sách định nghĩa để gợi ý syntax cho editor
 */
function buildMonarchDefinition() {
  const allKeywords = [
    ...new Set([
      ...BUILTIN_KEYWORDS,
      ...Array.from(_duckdbKeywordSet).map((k) => k.toUpperCase()),
    ]),
  ];

  const allTypeKeywords = [
    ...new Set([...BUILTIN_TYPE_KEYWORDS, ...BUILTIN_OBJECT_KEYWORDS]),
  ];

  return {
    defaultToken: "",
    ignoreCase: true,
    tokenPostfix: ".duckdb",
    brackets: [{ open: "(", close: ")", token: "delimiter.parenthesis" }],
    keywords: allKeywords,
    builtinFunctions: [],
    typeKeywords: allTypeKeywords,
    tokenizer: {
      root: [
        { include: "@comments" },
        { include: "@whitespace" },
        { include: "@numbers" },
        { include: "@strings" },
        { include: "@operators" },
        [
          // \u00C0-\u024F + \u1E00-\u1EFF + \u0300-\u036F: chữ Latin có dấu, tiếng Việt (NFC) và dấu kết hợp (NFD)
          /[a-zA-Z_\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F][a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F]*/,
          {
            cases: {
              "@typeKeywords": "type",
              "@keywords": "keyword",
              "@builtinFunctions": "predefined",
              "@default": "identifier",
            },
          },
        ],
        [/[;,.()]/, "delimiter"],
      ],
      comments: [
        [/--.*$/, "comment"],
        [/\/\*/, { token: "comment.quote", next: "@comment" }],
      ],
      comment: [
        [/[^*/]+/, "comment"],
        [/\*\//, { token: "comment.quote", next: "@pop" }],
        [/./, "comment"],
      ],
      whitespace: [[/[ \t\r\n]+/, "white"]],
      numbers: [[/(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?/, "number"]],
      strings: [
        [/'/, { token: "string", next: "@string" }],
        // identifier trong nháy kép: "bảng tính lương"
        [/"([^"]|"")*"/, "identifier.quote"],
      ],
      string: [
        [/[^']+/, "string"],
        [/''/, "string"],
        [/'/, { token: "string", next: "@pop" }],
      ],
      operators: [[/[<>=!~:&|+\-*/%^#]+/, "operator"]],
    },
  };
}

/**
 * đăng ký language "duckdb" vào trong monacoeditor
 */
export function registerDuckdbLanguage() {
  if (_monarchRegistered) return;
  monaco.languages.register({ id: "duckdb" });
  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("duckdb", definition);
  _monarchRegistered = true;
  registerSemanticProvider();
}

/**
 * bóc tách văn bản user nhập liệu để xem đâu là alias (tương tự PostgreSQL)
 * @param {*} text văn bản user nhập liệu
 * @param {*} outMap dictionary danh sách các alias
 */
function _extractAliases(text, outMap) {
  const clauseRe = /(?:from|join)\s+/gi;
  // \w không khớp chữ có dấu → dùng \p{L}\p{M}\p{N}_ (cờ u)
  const tableAliasRe =
    /^(?:[\p{L}\p{M}\p{N}_]+\.)?([\p{L}\p{M}\p{N}_]+)(?:\s+as)?\s+([\p{L}\p{M}\p{N}_]+)$/iu;
  const funcAliasRe =
    /^(?:[\p{L}\p{M}\p{N}_]+\.)?([\p{L}\p{M}\p{N}_]+)\([^)]*\)\s+(?:as\s+)?([\p{L}\p{M}\p{N}_]+)$/iu;
  const clauseEndRe =
    /\b(?:where|group\s+by|order\s+by|having|limit|offset|returning|union|intersect|except)\b/i;
  let clauseMatch;
  while ((clauseMatch = clauseRe.exec(text)) !== null) {
    const after = clauseMatch.index + clauseMatch[0].length;
    const endRest = text.slice(after).search(clauseEndRe);
    const end = endRest === -1 ? text.length : after + endRest;
    let block = text.slice(after, end);
    block = block.replace(/\s+ON\s+.+$/is, "");
    block = block.replace(/\s+USING\s*\([^)]*\)/gi, "");
    const fragments = block.split(/[,\n]+/);
    for (const fragment of fragments) {
      const trimmed = fragment
        .trim()
        .replace(
          /^(?:inner|cross|left|right|full|natural|outer)?\s*(?:from|join)\s+/i,
          "",
        );
      if (!trimmed) continue;
      let m = trimmed.match(tableAliasRe);
      if (m) {
        outMap.set(m[2].toLowerCase(), m[1].toLowerCase());
        continue;
      }
      m = trimmed.match(funcAliasRe);
      if (m) {
        outMap.set(m[2].toLowerCase(), m[1].toLowerCase());
      }
    }
  }
}

/**
 * đăng ký semantic provider để tô màu cú pháp dựa trên ngữ nghĩa
 */
function registerSemanticProvider() {
  if (_semanticRegistered) return;
  _semanticRegistered = true;

  monaco.languages.registerDocumentSemanticTokensProvider("duckdb", {
    getLegend() {
      return SEMANTIC_LEGEND;
    },

    provideDocumentSemanticTokens(model) {
      const lines = model.getLinesContent();
      const data = [];
      const fullText = model.getValue();

      const aliasToTable = new Map();
      _extractAliases(fullText, aliasToTable);

      const kwSet = _duckdbKeywordSet;
      let prevLine = 0;
      let prevChar = 0;
      let inBlockComment = false;
      let inSingleString = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        let pos = 0;
        const len = line.length;

        while (pos < len) {
          if (inBlockComment) {
            const closeIdx = line.indexOf("*/", pos);
            if (closeIdx === -1) break;
            pos = closeIdx + 2;
            inBlockComment = false;
            continue;
          }

          if (inSingleString) {
            const closeIdx = line.indexOf("'", pos);
            if (closeIdx === -1) break;
            pos = closeIdx + 1;
            if (pos < len && line[pos] === "'") {
              pos++;
              continue;
            }
            inSingleString = false;
            continue;
          }

          const ch = line[pos];
          const nextCh = pos + 1 < len ? line[pos + 1] : "";

          if (ch === "-" && nextCh === "-") break;
          if (ch === "/" && nextCh === "*") {
            inBlockComment = true;
            pos += 2;
            continue;
          }
          if (ch === "'") {
            inSingleString = true;
            pos++;
            continue;
          }
          // identifier trong nháy kép: bỏ qua nguyên khối để keyword bên trong không bị tô màu
          if (ch === '"') {
            let j = pos + 1;
            while (j < len) {
              if (line[j] === '"') {
                if (line[j + 1] === '"') {
                  j += 2;
                  continue;
                }
                break;
              }
              j++;
            }
            pos = j + 1;
            continue;
          }

          if (/[\p{L}_]/u.test(ch)) {
            const wordMatch = line
              .slice(pos)
              .match(/^[\p{L}_][\p{L}\p{M}\p{N}_]*/u);
            if (wordMatch) {
              const word = wordMatch[0];
              const offset = pos;
              const length = word.length;
              const lowerWord = word.toLowerCase();

              pos += length;

              let type = null;

              if (aliasToTable.has(lowerWord)) {
                type = "variable";
              } else if (_allFunctionNames?.has(lowerWord)) {
                const after = line.slice(offset + length).trimStart();
                if (after.startsWith("(")) {
                  type = "function";
                }
              } else if (_allSchemas?.has(lowerWord)) {
                if (line[offset + length] === ".") {
                  type = "namespace";
                }
              } else {
                const charBefore = line[offset - 1] || "";
                if (charBefore === "." && _allTables?.has(lowerWord)) {
                  type = "type";
                }
              }

              if (!type && kwSet.has(lowerWord)) {
                type = "keyword";
              }

              if (type) {
                const typeIndex = SEMANTIC_LEGEND.tokenTypes.indexOf(type);
                if (typeIndex !== -1) {
                  data.push(
                    i - prevLine,
                    prevLine === i ? offset - prevChar : offset,
                    length,
                    typeIndex,
                    0,
                  );
                  prevLine = i;
                  prevChar = offset;
                }
              }
              continue;
            }
          }

          if (/\d/.test(ch)) {
            const numMatch = line.slice(pos).match(/^\d+(\.\d+)?/);
            if (numMatch) {
              pos += numMatch[0].length;
              continue;
            }
          }

          pos++;
        }
      }

      return {
        data: new Uint32Array(data),
        resultId: null,
      };
    },

    releaseDocumentSemanticTokens() {},
  });
}

/**
 * cập nhật dữ liệu intellisense từ database thực tế (bao gồm cả schema từ file đã upload)
 * @param {*} data dữ liệu từ API chứa danh sách keyword, table, function
 */
export function updateDuckdbIntellisenseData(data) {
  if (!data) return;

  const keywords = data?.keywords?.rows ?? [];
  _duckdbKeywordSet = new Set(
    keywords
      .map((k) => String(k.keyword_name ?? k.word ?? "").toLowerCase())
      .filter(Boolean),
  );

  const tableRows = data?.tables?.rows ?? [];
  _allSchemas = new Set();
  _allTables = new Set();
  tableRows.forEach((row) => {
    _allSchemas.add(String(row.table_schema).toLowerCase());
    _allTables.add(String(row.table_name).toLowerCase());
  });

  const functionRows = data?.functions?.rows ?? [];
  _allFunctionNames = new Set(
    functionRows.map((fn) => String(fn.function_name).toLowerCase()),
  );

  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("duckdb", definition);

  monaco.editor.getModels().forEach((model) => {
    if (model.getLanguageId() === "duckdb") {
      monaco.editor.setModelLanguage(model, "duckdb");
    }
  });
}

/**
 * xóa toàn bộ dữ liệu intellisense (khi disconnect database chẳng hạn)
 */
export function clearDuckdbIntellisenseData() {
  _allSchemas = new Set();
  _allTables = new Set();
  _allFunctionNames = new Set();
  _duckdbKeywordSet = new Set();
}
