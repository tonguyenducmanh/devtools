/**
 * file định nghĩa cú pháp (Syntax Highlighting) cho thư viện monaco editor được dùng
 * làm editor chính của app này, do thư viện này chưa support chuẩn cho PostgreSQL
 * mà đang preview theo MySQL, cần tự định nghĩa 1 số rule đặc thù để hiển thị theo nhu cầu riêng
 */

import * as monaco from "monaco-editor";
import {
  BUILTIN_KEYWORDS,
  BUILTIN_TYPE_KEYWORDS,
  BUILTIN_OBJECT_KEYWORDS,
} from "./pgsqlKeyword.js";

// cấu hình màu sắc của chủ đề darrk mode
const DARK_THEME_RULES = [
  { token: "namespace", foreground: "66d9ef" },
  { token: "variable", foreground: "f8c555" },
  { token: "type", foreground: "66d9ef" },
  { token: "function", foreground: "a6e22e" },
  { token: "property", foreground: "fd971f" },
  { token: "string.sql", foreground: "e6db74" },
];

// cấu hình màu sắc của chủ đề light mode
const LIGHT_THEME_RULES = [
  { token: "namespace", foreground: "2674b8" },
  { token: "variable", foreground: "c04e01" },
  { token: "type", foreground: "2674b8" },
  { token: "function", foreground: "50a14f" },
  { token: "property", foreground: "d9730d" },
  { token: "string.sql", foreground: "8b7500" },
];

/**
 * Lấy ra rule theme tương ứng
 * @param {Boolean} isDark có phải chế độ dark mode không
 * @returns bộ rule theme tương ứng
 */
export function getPgsqlThemeRules(isDark) {
  return isDark ? DARK_THEME_RULES : LIGHT_THEME_RULES;
}

// các biến lưu lại thông tin được
// toàn bộ schema ứng với database hiện tại
let _allSchemas = new Set();
// toàn bộ bảng ứng với database hiện tại
let _allTables = new Set();
// toàn bộ function ứng với database hiện tại
let _allFunctionNames = new Set();
// toàn bộ keyword ứng với database hiện tại (tùy từng version PostgreSQL sẽ có bộ keyword có thể khác nhau)
let _pgKeywordSet = new Set();

// Trong Monaco Editor, Monarch và Semantic Highlighting là hai cơ chế tô màu cú pháp
// (syntax highlighting) hoàn toàn khác nhau về cách thức hoạt động, hiệu năng và độ chính xác.

// cờ nhận biết đã đăng ký monarch chưa
// Monarch (Tô màu dựa trên Khai báo Cú pháp / Từ vựng)
// Hoạt động dựa trên các quy tắc biểu thức chính quy (Regex) và máy trạng thái (state machine) tĩnh do dev định nghĩa trước. Nó quét qua từng dòng code độc lập, tìm các chuỗi
// khớp với Regex (ví dụ: if, function, chuỗi ký tự nằm trong dấu ngoặc kép "")
// và gán nhãn cho chúng (gọi là token như keyword, string, comment)
let _monarchRegistered = false;

// cờ nhận biết đã đăng ký semantic hightlight chưa
// Semantic Highlighting (Tô màu dựa trên Ngữ nghĩa)
// Hoạt động dựa trên kết quả phân tích của một Language Server hoặc Trình biên dịch
// (Compiler) đứng phía sau (ví dụ: TypeScript Language Service, LSP cho C++, Java, v.v.).
// Nó parse toàn bộ mã nguồn thành một Cây cú pháp trừu tượng (AST - Abstract Syntax Tree),
// từ đó hiểu rõ mối quan hệ giữa các thành phần.
let _semanticRegistered = false;

function buildMonarchDefinition() {
  const allKeywords = [
    ...new Set([
      ...BUILTIN_KEYWORDS,
      ...Array.from(_pgKeywordSet).map((k) => k.toUpperCase()),
    ]),
  ];

  const allTypeKeywords = [
    ...new Set([...BUILTIN_TYPE_KEYWORDS, ...BUILTIN_OBJECT_KEYWORDS]),
  ];

  return {
    defaultToken: "",
    ignoreCase: true,
    tokenPostfix: ".pgsql",
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
        [
          /\$[a-zA-Z_][a-zA-Z0-9_]*\$/,
          { token: "string.sql", next: "@pgCode" },
        ],
      ],
      string: [
        [/[^']+/, "string"],
        [/''/, "string"],
        [/'/, { token: "string", next: "@pop" }],
      ],
      pgCode: [
        [/\$[a-zA-Z_][a-zA-Z0-9_]*\$/, { token: "string.sql", next: "@pop" }],
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
      operators: [[/[<>=!~:&|+\-*/%^#]+/, "operator"]],
    },
  };
}

export function registerPgsqlLanguage() {
  if (_monarchRegistered) return;
  monaco.languages.register({ id: "pgsql" });
  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("pgsql", definition);
  _monarchRegistered = true;
  registerSemanticProvider();
}

const semanticLegend = {
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

function _extractAliases(text, outMap) {
  const clauseRe = /(?:from|join)\s+/gi;
  const tableAliasRe = /^(?:\w+\.)?(\w+)(?:\s+as)?\s+(\w+)$/i;
  const funcAliasRe = /^(?:\w+\.)?(\w+)\([^)]*\)\s+(?:as\s+)?(\w+)$/i;
  const clauseEndRe =
    /\b(?:where|group\s+by|order\s+by|having|limit|offset|returning|union|intersect|except)\b/i;
  let clauseMatch;

  while ((clauseMatch = clauseRe.exec(text)) !== null) {
    const after = clauseMatch.index + clauseMatch[0].length;
    const endRest = text.slice(after).search(clauseEndRe);
    const end = endRest === -1 ? text.length : after + endRest;
    let block = text.slice(after, end);
    // Strip ON/USING conditions to avoid false matches like "p.project_id = e.project_id"
    block = block.replace(/\s+ON\s+.+$/is, "");
    block = block.replace(/\s+USING\s*\([^)]*\)/gi, "");
    // Split by comma or newline to get individual table/alias references
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

function registerSemanticProvider() {
  if (_semanticRegistered) return;
  _semanticRegistered = true;

  monaco.languages.registerDocumentSemanticTokensProvider("pgsql", {
    getLegend() {
      return semanticLegend;
    },

    provideDocumentSemanticTokens(model) {
      const lines = model.getLinesContent();
      const data = [];
      const fullText = model.getValue();

      const aliasToTable = new Map();
      _extractAliases(fullText, aliasToTable);

      const kwSet = _pgKeywordSet;
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
                const typeIndex = semanticLegend.tokenTypes.indexOf(type);
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

const _reservedTypeSet = new Set(
  [...BUILTIN_TYPE_KEYWORDS, ...BUILTIN_OBJECT_KEYWORDS].map((k) =>
    k.toLowerCase(),
  ),
);

export function updatePgsqlIntellisenseData(data) {
  if (!data) return;

  const keywords = data?.keywords?.rows ?? [];
  _pgKeywordSet = new Set(
    keywords
      .map((k) => String(k.word).toLowerCase())
      .filter(Boolean)
      .filter((k) => !_reservedTypeSet.has(k)),
  );

  const tableRows = data?.tables?.rows ?? [];
  _allSchemas = new Set();
  _allTables = new Set();
  tableRows.forEach((row) => {
    _allSchemas.add(row.table_schema);
    _allTables.add(row.table_name);
  });

  const functionRows = data?.functions?.rows ?? [];
  _allFunctionNames = new Set(
    functionRows.map((fn) => String(fn.function_name).toLowerCase()),
  );

  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("pgsql", definition);

  monaco.editor.getModels().forEach((model) => {
    if (model.getLanguageId() === "pgsql") {
      monaco.editor.setModelLanguage(model, "pgsql");
    }
  });
}

export function clearPgsqlIntellisenseData() {
  _allSchemas = new Set();
  _allTables = new Set();
  _allFunctionNames = new Set();
  _pgKeywordSet = new Set();
}
