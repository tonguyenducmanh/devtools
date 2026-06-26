/**
 * file định nghĩa cú pháp (Syntax Highlighting) cho thư viện monaco editor được dùng
 * làm editor chính của app này, do thư viện này chưa hỗ trợ chuẩn cho PostgreSQL
 * mà đang preview theo MySQL, cần tự định nghĩa 1 số rule đặc thù để hiển thị theo nhu cầu riêng
 */

import * as monaco from "monaco-editor";
import {
  BUILTIN_KEYWORDS,
  BUILTIN_TYPE_KEYWORDS,
  BUILTIN_OBJECT_KEYWORDS,
  DARK_THEME_RULES,
  LIGHT_THEME_RULES,
  SEMANTIC_LEGEND,
} from "./pgsqlKeyword.js";

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

/**
 * build ra danh sách định nghĩa để gợi ý syntax cho editor
 */
function buildMonarchDefinition() {
  // build ra toàn bộ keyword bao gồm keyword default và keyword lấy được từ database
  const allKeywords = [
    ...new Set([
      ...BUILTIN_KEYWORDS,
      ...Array.from(_pgKeywordSet).map((k) => k.toUpperCase()),
    ]),
  ];

  // tượng tự, đây là toàn bộ type tìm được
  const allTypeKeywords = [
    ...new Set([...BUILTIN_TYPE_KEYWORDS, ...BUILTIN_OBJECT_KEYWORDS]),
  ];

  // return cấu hình monarch
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

// đăng ký language PostgreSQL vào trong monacoeditor
export function registerPgsqlLanguage() {
  if (_monarchRegistered) return;
  // đăng ký ngôn ngữ
  monaco.languages.register({ id: "pgsql" });
  // đăng ký sử dụng monarch để highlight syntax theo cú pháp đã xác định trước
  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("pgsql", definition);
  _monarchRegistered = true;
  // đăng ký sử dụng semantic để highlight syntax theo các từ khóa mới mà user nhập
  registerSemanticProvider();
}

/**
 * bóc tách văn bản user nhập liệu để xem đâu là alias
 * @param {*} text văn bản user nhập liệu
 * @param {*} outMap dictionary danh sách các alias
 */
function _extractAliases(text, outMap) {
  // regex tìm từ khóa FROM hoặc JOIN (có flag g để dùng lastIndex)
  // (?:from|join) - non-capturing group, khớp "from" hoặc "join" (không phân biệt hoa/thường nhờ flag i)
  // \s+ - theo sau bởi ít nhất 1 khoảng trắng
  // flag g: giúp regex nhớ vị trí lastIndex sau mỗi lần exec(), lần gọi sau sẽ tìm tiếp từ vị trí đó
  // flag i: ignore case, khớp cả FROM/from/From/...
  // ví dụ: "select * from tm.order ot join tm.invoice it" -> khớp "from " và "join "
  const clauseRe = /(?:from|join)\s+/gi;
  // regex nhận biết cặp "tên_bảng alias" (có thể có schema ở trước)
  // ^ - bắt đầu chuỗi
  // (?:\w+\.)? - optional non-capturing: tên schema + dấu chấm (vd: "tm."), \w+ = [a-zA-Z0-9_]+
  // (\w+) - capturing group 1: tên bảng
  // (?:\s+as)? - optional "as" (vd: "order AS o")
  // \s+(\w+)$ - capturing group 2: alias ở cuối chuỗi
  // ví dụ: "tm.order ot" -> group1="order", group2="ot"
  const tableAliasRe = /^(?:\w+\.)?(\w+)(?:\s+as)?\s+(\w+)$/i;
  // regex nhận biết cặp "tên_hàm(đối_số) alias"
  // (?:\w+\.)? - optional schema + dấu chấm
  // (\w+) - capturing group 1: tên hàm
  // \([^)]*\) - dấu ngoặc () chứa tham số (bất kỳ ký tự nào không phải dấu đóng ngoặc)
  // \s+(?:as\s+)? - khoảng trắng + optional "as"
  // (\w+)$ - capturing group 2: alias
  // ví dụ: "func_rebuild_invoice_dashboard(p_from_date, p_to_date) frid" -> group1="func...", group2="frid"
  const funcAliasRe = /^(?:\w+\.)?(\w+)\([^)]*\)\s+(?:as\s+)?(\w+)$/i;
  // regex tìm các từ khóa báo hiệu kết thúc mệnh đề FROM/JOIN
  // \b - word boundary để khớp đúng từ, tránh nhầm "where" trong "somewhere"
  // (?:...) - non-capturing group chứa các keyword: WHERE, GROUP BY, ORDER BY, HAVING, LIMIT, OFFSET, ...
  // ví dụ: "from tm.order ot where status = 1" -> khớp "where", dừng alias parsing tại đó
  const clauseEndRe =
    /\b(?:where|group\s+by|order\s+by|having|limit|offset|returning|union|intersect|except)\b/i;
  let clauseMatch;

  // vòng lặp dùng exec() với regex có flag g:
  // - mỗi lần gọi regex.exec(text), JS tìm match bắt đầu từ vị trí regex.lastIndex
  // - tìm thấy: cập nhật lastIndex = vị trí sau match, trả về mảng kết quả
  // - không tìm thấy: reset lastIndex về 0, trả về null => thoát vòng lặp
  // nhờ đó while duyệt lần lượt từng FROM/JOIN trong câu SQL mà không bị lặp vô hạn
  while ((clauseMatch = clauseRe.exec(text)) !== null) {
    // vị trí ngay sau từ khóa from/join, bắt đầu của danh sách bảng
    const after = clauseMatch.index + clauseMatch[0].length;
    // tìm điểm kết thúc của mệnh đề (khi gặp WHERE, GROUP BY, ...) để giới hạn phạm vi xử lý
    const endRest = text.slice(after).search(clauseEndRe);
    // nếu không tìm thấy dấu hiệu kết thúc thì lấy tới cuối chuỗi
    const end = endRest === -1 ? text.length : after + endRest;
    // cắt ra đoạn text chứa danh sách bảng và alias tương ứng
    let block = text.slice(after, end);
    // loại bỏ điều kiện ON và USING vì dễ gây nhầm lẫn (ví dụ: ON p.project_id = e.project_id)
    block = block.replace(/\s+ON\s+.+$/is, "");
    block = block.replace(/\s+USING\s*\([^)]*\)/gi, "");
    // tách danh sách thành từng phần tử dựa vào dấu phẩy hoặc xuống dòng
    const fragments = block.split(/[,\n]+/);
    // duyệt từng phần tử để bóc tách tên bảng (table) và tên viết tắt (alias)
    for (const fragment of fragments) {
      // loại bỏ khoảng trắng thừa và từ khóa join phía trước (inner, left, right,...)
      const trimmed = fragment
        .trim()
        .replace(
          /^(?:inner|cross|left|right|full|natural|outer)?\s*(?:from|join)\s+/i,
          "",
        );
      // nếu chuỗi rỗng thì bỏ qua
      if (!trimmed) continue;
      // thử khớp với pattern alias của table: schema.table alias
      let m = trimmed.match(tableAliasRe);
      if (m) {
        // m[2] là alias, m[1] là tên bảng => lưu vào map
        outMap.set(m[2].toLowerCase(), m[1].toLowerCase());
        continue;
      }
      // thử khớp với pattern alias của function: func_name(args) alias
      m = trimmed.match(funcAliasRe);
      if (m) {
        // m[2] là alias, m[1] là tên hàm => lưu vào map
        outMap.set(m[2].toLowerCase(), m[1].toLowerCase());
      }
    }
  }
}

/**
 * đăng ký semantic provider để tô màu cú pháp dựa trên ngữ nghĩa
 * (phân tích alias, schema, table, function, keyword từ database thực tế)
 * giúp hiển thị chính xác hơn so với monarch (chỉ dùng regex tĩnh)
 */
function registerSemanticProvider() {
  if (_semanticRegistered) return;
  _semanticRegistered = true;

  monaco.languages.registerDocumentSemanticTokensProvider("pgsql", {
    getLegend() {
      return SEMANTIC_LEGEND;
    },

    /**
     * cung cấp danh sách token ngữ nghĩa cho toàn bộ nội dung file
     * @param {*} model đối tượng model của monaco editor chứa nội dung cần phân tích
     * @returns danh sách token dạng Uint32Array chứa thông tin vị trí và loại token
     */
    provideDocumentSemanticTokens(model) {
      // lấy từng dòng và toàn bộ nội dung để phân tích
      const lines = model.getLinesContent();
      const data = [];
      const fullText = model.getValue();

      // bóc tách alias từ câu SQL để biết đâu là bí danh (alias) của bảng/hàm
      const aliasToTable = new Map();
      _extractAliases(fullText, aliasToTable);

      const kwSet = _pgKeywordSet;
      // biến lưu vị trí dòng và cột của token trước đó để tính delta
      let prevLine = 0;
      let prevChar = 0;

      // cờ theo dõi trạng thái đang ở trong block comment (/* */) hay string ('')
      let inBlockComment = false;
      let inSingleString = false;

      // duyệt từng dòng trong nội dung editor
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        let pos = 0;
        const len = line.length;

        // duyệt từng ký tự trong dòng
        while (pos < len) {
          // nếu đang ở trong block comment, tìm dấu kết thúc */ để thoát
          if (inBlockComment) {
            const closeIdx = line.indexOf("*/", pos);
            if (closeIdx === -1) break; // chưa kết thúc, chờ dòng sau
            pos = closeIdx + 2;
            inBlockComment = false;
            continue;
          }

          // nếu đang ở trong chuỗi (string), tìm dấu nháy đơn đóng
          if (inSingleString) {
            const closeIdx = line.indexOf("'", pos);
            if (closeIdx === -1) break; // chưa kết thúc, chờ dòng sau
            pos = closeIdx + 1;
            // xử lý trường hợp 2 dấu nháy đơn liên tiếp '' (escape trong SQL)
            if (pos < len && line[pos] === "'") {
              pos++;
              continue;
            }
            inSingleString = false;
            continue;
          }

          const ch = line[pos];
          const nextCh = pos + 1 < len ? line[pos + 1] : "";

          // comment 1 dòng kiểu -- : bỏ qua phần còn lại của dòng
          if (ch === "-" && nextCh === "-") break;
          // bắt đầu block comment /* */
          if (ch === "/" && nextCh === "*") {
            inBlockComment = true;
            pos += 2;
            continue;
          }
          // bắt đầu chuỗi ký tự (string)
          if (ch === "'") {
            inSingleString = true;
            pos++;
            continue;
          }

          // nếu gặp ký tự chữ cái hoặc gạch dưới => đây có thể là 1 từ (identifier)
          if (/[a-zA-Z_]/.test(ch)) {
            const wordMatch = line.slice(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            if (wordMatch) {
              const word = wordMatch[0];
              const offset = pos;
              const length = word.length;
              const lowerWord = word.toLowerCase();

              pos += length;

              let type = null;

              // ưu tiên xác định loại token dựa trên ngữ nghĩa:
              // - nếu là alias (bí danh) của bảng => variable
              if (aliasToTable.has(lowerWord)) {
                type = "variable";
              // - nếu là tên function và theo sau là dấu ( => function
              } else if (_allFunctionNames?.has(lowerWord)) {
                const after = line.slice(offset + length).trimStart();
                if (after.startsWith("(")) {
                  type = "function";
                }
              // - nếu là tên schema và theo sau là dấu . => namespace
              } else if (_allSchemas?.has(lowerWord)) {
                if (line[offset + length] === ".") {
                  type = "namespace";
                }
              } else {
                // - nếu đứng sau dấu . và là tên bảng => type
                const charBefore = line[offset - 1] || "";
                if (charBefore === "." && _allTables?.has(lowerWord)) {
                  type = "type";
                }
              }

              // nếu chưa xác định được loại, kiểm tra trong danh sách keyword
              if (!type && kwSet.has(lowerWord)) {
                type = "keyword";
              }

              // nếu đã xác định được loại, thêm vào mảng data dưới dạng delta
              if (type) {
                const typeIndex = SEMANTIC_LEGEND.tokenTypes.indexOf(type);
                if (typeIndex !== -1) {
                  // delta line, delta char, length, typeIndex, modifiers (luôn 0)
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

          // nếu gặp chữ số, bỏ qua cả số (không cần tô màu semantic cho số)
          if (/\d/.test(ch)) {
            const numMatch = line.slice(pos).match(/^\d+(\.\d+)?/);
            if (numMatch) {
              pos += numMatch[0].length;
              continue;
            }
          }

          // ký tự không đặc biệt, bỏ qua
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

// tập hợp các từ khóa loại type/object có sẵn, dùng để loại trừ khỏi keyword động từ database
// tránh trùng lặp vì monarch đã xử lý các type này qua @typeKeywords
const _reservedTypeSet = new Set(
  [...BUILTIN_TYPE_KEYWORDS, ...BUILTIN_OBJECT_KEYWORDS].map((k) =>
    k.toLowerCase(),
  ),
);

/**
 * cập nhật dữ liệu intellisense từ database thực tế
 * bao gồm keyword, tên bảng, schema, function để phục vụ tô màu và gợi ý
 * @param {*} data dữ liệu từ API chứa danh sách keyword, table, function
 */
export function updatePgsqlIntellisenseData(data) {
  if (!data) return;

  // cập nhật danh sách keyword động từ database, loại trừ các type có sẵn
  const keywords = data?.keywords?.rows ?? [];
  _pgKeywordSet = new Set(
    keywords
      .map((k) => String(k.word).toLowerCase())
      .filter(Boolean)
      .filter((k) => !_reservedTypeSet.has(k)),
  );

  // cập nhật danh sách schema và bảng
  const tableRows = data?.tables?.rows ?? [];
  _allSchemas = new Set();
  _allTables = new Set();
  tableRows.forEach((row) => {
    _allSchemas.add(row.table_schema);
    _allTables.add(row.table_name);
  });

  // cập nhật danh sách function
  const functionRows = data?.functions?.rows ?? [];
  _allFunctionNames = new Set(
    functionRows.map((fn) => String(fn.function_name).toLowerCase()),
  );

  // xây dựng lại monarch definition với keyword mới và đăng ký lại
  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("pgsql", definition);

  // force re-tokenize tất cả các model đang dùng ngôn ngữ pgsql
  monaco.editor.getModels().forEach((model) => {
    if (model.getLanguageId() === "pgsql") {
      monaco.editor.setModelLanguage(model, "pgsql");
    }
  });
}

/**
 * xóa toàn bộ dữ liệu intellisense (khi disconnect database chẳng hạn)
 */
export function clearPgsqlIntellisenseData() {
  _allSchemas = new Set();
  _allTables = new Set();
  _allFunctionNames = new Set();
  _pgKeywordSet = new Set();
}
