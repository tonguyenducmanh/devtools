/**
 * file định nghĩa cú pháp (Syntax Highlighting) cho SQLite trong Monaco Editor.
 * SQLite không được hỗ trợ sẵn trong Monaco, cần tự định nghĩa monarch rules.
 */

import * as monaco from "monaco-editor";
import { SQLITE_KEYWORDS, SQL_ALIAS_KEYWORDS } from "./sqliteKeyword.js";

// các biến lưu lại thông tin được cập nhật từ database thực tế
let _allTables = new Set();
let _allColumnsByTable = new Map();

// cờ nhận biết đã đăng ký monarch chưa
let _monarchRegistered = false;

// cờ nhận biết đã đăng ký semantic highlight chưa
let _semanticRegistered = false;

/**
 * bóc tách văn bản user nhập liệu để xem đâu là alias
 * @param {*} text văn bản user nhập liệu
 * @param {*} outMap dictionary danh sách các alias
 */
function _extractAliases(text, outMap) {
  const clauseRe = /(?:from|join)\s+/gi;
  const tableAliasRe = /^(\w+)(?:\s+as)?\s+(\w+)$/i;
  const clauseEndRe =
    /\b(?:where|group\s+by|order\s+by|having|limit|offset|union|intersect|except)\b/i;
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
      }
    }
  }
}

/**
 * build ra danh sách định nghĩa để gợi ý syntax cho editor
 */
function buildMonarchDefinition() {
  const allKeywords = [
    ...new Set([...SQLITE_KEYWORDS, ...SQL_ALIAS_KEYWORDS]),
  ];

  return {
    defaultToken: "",
    ignoreCase: true,
    tokenPostfix: ".sqlite",
    brackets: [{ open: "(", close: ")", token: "delimiter.parenthesis" }],
    keywords: allKeywords,
    builtinFunctions: [],
    typeKeywords: [],
    tokenizer: {
      root: [
        { include: "@comments" },
        { include: "@whitespace" },
        { include: "@numbers" },
        { include: "@strings" },
        { include: "@operators" },
        [
          /[a-zA-Z_][a-zA-Z0-9_]*/,
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
      ],
      string: [
        [/[^']+/, "string"],
        [/''/, "string"],
        [/'/, { token: "string", next: "@pop" }],
      ],
      operators: [[/[<>=!~:&|+\-*/%^]+/, "operator"]],
    },
  };
}

/**
 * đăng ký language SQLite vào trong monaco editor
 */
export function registerSqliteLanguage() {
  if (_monarchRegistered) return;
  monaco.languages.register({ id: "sqlite" });
  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("sqlite", definition);
  _monarchRegistered = true;
  registerSemanticProvider();
}

/**
 * đăng ký semantic provider để tô màu cú pháp dựa trên ngữ nghĩa
 */
function registerSemanticProvider() {
  if (_semanticRegistered) return;
  _semanticRegistered = true;

  const SEMANTIC_LEGEND = {
    tokenTypes: [
      "comment",
      "string",
      "keyword",
      "number",
      "operator",
      "namespace",
      "type",
      "function",
      "variable",
      "property",
    ],
    tokenModifiers: [],
  };

  monaco.languages.registerDocumentSemanticTokensProvider("sqlite", {
    getLegend() {
      return SEMANTIC_LEGEND;
    },

    provideDocumentSemanticTokens(model) {
      const lines = model.getLinesContent();
      const data = [];
      const fullText = model.getValue();

      const aliasToTable = new Map();
      _extractAliases(fullText, aliasToTable);

      const kwSet = new Set(SQLITE_KEYWORDS.map((k) => k.toLowerCase()));
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

          if (/[a-zA-Z_]/.test(ch)) {
            const wordMatch = line.slice(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            if (wordMatch) {
              const word = wordMatch[0];
              const offset = pos;
              const length = word.length;
              const lowerWord = word.toLowerCase();

              pos += length;

              let type = null;

              if (aliasToTable.has(lowerWord)) {
                type = "variable";
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
 * cập nhật dữ liệu intellisense từ database thực tế
 */
export function updateSqliteIntellisenseData(data) {
  if (!data) return;

  const tableRows = Array.isArray(data) ? data : [];
  _allTables = new Set();
  _allColumnsByTable = new Map();

  tableRows.forEach((row) => {
    const tbl = (row.table_name || "").toLowerCase();
    _allTables.add(tbl);
    if (row.columns && Array.isArray(row.columns)) {
      _allColumnsByTable.set(tbl, row.columns);
    }
  });

  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("sqlite", definition);

  monaco.editor.getModels().forEach((model) => {
    if (model.getLanguageId() === "sqlite") {
      monaco.editor.setModelLanguage(model, "sqlite");
    }
  });
}

/**
 * xóa toàn bộ dữ liệu intellisense
 */
export function clearSqliteIntellisenseData() {
  _allTables = new Set();
  _allColumnsByTable = new Map();
}
