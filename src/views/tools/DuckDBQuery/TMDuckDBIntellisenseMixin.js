// mixin chứa toàn bộ logic xử lý intellisense (gợi ý code, tô màu cú pháp) cho tool DuckDB Query
// tách riêng file để dễ đọc và bảo trì, được import vào TMDuckDBQuery.vue
import TMCache from "@/common/cache/TMCache.js";
import {
  registerDuckdbLanguage,
  updateDuckdbIntellisenseData,
  clearDuckdbIntellisenseData,
} from "@/monarch/duckdb/duckdbLanguage.js";
import { registerDuckdbFormatProvider } from "@/monarch/duckdb/duckdbFormatProvider.js";

// Completion/Hover provider của Monaco đăng ký theo NGÔN NGỮ (global), không theo editor/component.
// Nếu để mỗi lần apply/mỗi instance tự giữ disposable riêng thì provider cũ bị "rò" khi 2 lần
// applyMonacoIntellisense chạy chồng nhau (await import bên dưới) → mỗi gợi ý hiện 2-3 lần.
// Vì vậy giữ disposable + số thứ tự apply ở cấp module để luôn chỉ có 1 bộ provider đang sống.
let _providerDisposables = [];
let _applySeq = 0;

// Từ khoá luôn không được dùng làm alias (đứng ngay sau tên bảng trong FROM/JOIN)
const NON_ALIAS_KEYWORDS = new Set([
  "where",
  "join",
  "on",
  "using",
  "left",
  "right",
  "inner",
  "outer",
  "full",
  "cross",
  "natural",
  "asof",
  "positional",
  "semi",
  "anti",
  "lateral",
  "group",
  "order",
  "having",
  "qualify",
  "window",
  "limit",
  "offset",
  "union",
  "intersect",
  "except",
  "returning",
  "select",
  "from",
  "and",
  "or",
  "with",
  "as",
  "tablesample",
  "pivot",
  "unpivot",
  "sample",
]);

export default {
  created() {
    // đăng ký ngôn ngữ duckdb cho Monaco Editor ngay khi component được tạo
    registerDuckdbLanguage();
  },
  methods: {
    /**
     * Đăng ký lại intellisense từ cache khi tab được active
     */
    registerIntellisense() {
      let me = this;
      if (me.currentSessionId) {
        me.loadCachedIntellisense();
      }
    },

    /**
     * Hủy bỏ tất cả intellisense provider khi tab bị inactive
     */
    disposeIntellisense() {
      let me = this;
      _applySeq++; // huỷ mọi lần apply đang chờ import monaco
      _providerDisposables.forEach((d) => d?.dispose?.());
      _providerDisposables = [];
      me.intellisenseDisposable = null;
    },

    /**
     * Tải toàn bộ dữ liệu intellisense (keywords, tables, columns) từ session DuckDB
     * Kết quả được lưu vào IndexedDB cache và áp dụng lên Monaco Editor.
     * Sau mỗi lần upload file, nên gọi lại hàm này để thêm tên bảng/cột mới vào gợi ý.
     */
    async handleLoadIntellisense() {
      let me = this;
      if (!me.currentSessionId) return;
      me.isLoadingIntellisense = true;
      try {
        // Xoá cache cũ của session này để tránh dữ liệu rác
        const cacheKey = me.$tmEnum.cacheConfig.DuckDBQueryHistory;
        await TMCache.remove(cacheKey, { id: me.currentSessionId });

        let defaultQueryLimit = 5000;
        let limitResults = false;

        // Bước 1: Lấy danh sách keyword DuckDB từ hệ thống
        let keywordsResult = await me.fetchDuckDBKeywords(
          defaultQueryLimit,
          limitResults,
        );

        // Bước 2: Lấy danh sách bảng + cột từ session hiện tại (bao gồm cả file vừa upload)
        let schemaResult = await me.fetchDuckDBSchema(
          defaultQueryLimit,
          limitResults,
        );

        // Gom tất cả dữ liệu intellisense lại
        let intellisenseData = {
          keywords: keywordsResult,
          tables: schemaResult.tables,
          functions: schemaResult.functions,
        };

        // Lưu vào IndexedDB để lần sau load nhanh hơn, rồi áp dụng lên Monaco
        await TMCache.set(cacheKey, intellisenseData, {
          id: me.currentSessionId,
        });
        await me.applyMonacoIntellisense(intellisenseData);

        me.$tmToast.success(me.$t("i18nCommon.duckDBQuery.intellisenseLoaded"));
      } catch (error) {
        console.error("Load intellisense error:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      } finally {
        me.isLoadingIntellisense = false;
      }
    },

    /**
     * Lấy ra toàn bộ keyword của DuckDB từ hệ thống
     */
    async fetchDuckDBKeywords(defaultQueryLimit, limitResults) {
      let me = this;
      try {
        // DuckDB lưu danh sách keyword trong hệ thống tabla duckdb_keywords()
        let keywordResponse = await me.agentAPI.executeQuery(
          me.currentSessionId,
          "SELECT DISTINCT keyword_name, keyword_category FROM duckdb_keywords() ORDER BY keyword_name",
          defaultQueryLimit,
          limitResults,
        );
        let keywordResult =
          keywordResponse?.data?.data?.results?.[0] ||
          keywordResponse?.data?.data ||
          null;
        return keywordResponse?.data?.success ? keywordResult : null;
      } catch (error) {
        console.warn("Fetch DuckDB keywords warning:", error);
        return null;
      }
    },

    /**
     * Lấy toàn bộ bảng + cột từ session DuckDB hiện tại
     * Bao gồm cả bảng được tạo từ file upload, ưu tiên tên bảng và tên cột cao nhất
     */
    async fetchDuckDBSchema(defaultQueryLimit, limitResults) {
      let me = this;
      let allTableRows = [];
      let allFunctionRows = [];

      try {
        // Lấy danh sách cột từ information_schema.columns (DuckDB dùng table_schema)
        // Đây cũng là nguồn duy nhất để liệt kê bảng (distinct table_schema + table_name),
        // vì duckdb_tables() trong bản DuckDB này trả về rows = null.
        let columnsResponse = await me.agentAPI.executeQuery(
          me.currentSessionId,
          "SELECT table_schema, table_name, column_name, data_type, ordinal_position FROM information_schema.columns WHERE table_schema NOT IN ('information_schema', 'pg_catalog') ORDER BY table_schema, table_name, ordinal_position",
          defaultQueryLimit,
          limitResults,
        );

        let columnResult =
          columnsResponse?.data?.data?.results?.[0] ||
          columnsResponse?.data?.data ||
          null;
        if (columnsResponse?.data?.success && columnResult?.rows) {
          // Gom cột theo (schema, table). Dùng object thay vì split("." ) vì tên schema/bảng
          // có thể chứa dấu chấm.
          const tableMap = new Map();
          columnResult.rows.forEach((row) => {
            const key = JSON.stringify([row.table_schema, row.table_name]);
            if (!tableMap.has(key)) {
              tableMap.set(key, {
                schema_name: row.table_schema,
                table_schema: row.table_schema,
                table_name: row.table_name,
                _columns: [],
              });
            }
            tableMap.get(key)._columns.push(row);
          });
          allTableRows = Array.from(tableMap.values());
        }

        // Lấy danh sách hàm (nếu có)
        try {
          let funcsResponse = await me.agentAPI.executeQuery(
            me.currentSessionId,
            "SELECT DISTINCT function_name FROM duckdb_functions() ORDER BY function_name",
            defaultQueryLimit,
            limitResults,
          );
          let funcResult =
            funcsResponse?.data?.data?.results?.[0] ||
            funcsResponse?.data?.data ||
            null;
          if (funcsResponse?.data?.success && funcResult?.rows) {
            allFunctionRows = funcResult.rows;
          }
        } catch (e) {
          // DuckDB có thể không có duckdb_functions(), bỏ qua
        }
      } catch (error) {
        console.error("Fetch DuckDB schema error:", error);
      }

      // Đóng gói kết quả bảng đúng cấu trúc để Monaco xử lý
      // Thêm cột _columns vào từng dòng để applyMonacoIntellisense có thể dùng
      let tablesResult = {
        columns: [
          "table_schema",
          "table_name",
          "table_type",
          "column_name",
          "data_type",
          "ordinal_position",
        ],
        rows: allTableRows,
      };

      let functionsResult = {
        columns: ["function_schema", "function_name"],
        rows: allFunctionRows,
      };

      return { tables: tablesResult, functions: functionsResult };
    },

    /**
     * Tải intellisense từ IndexedDB cache của session hiện tại
     * (nếu đã từng load trước đó) và áp dụng lên Monaco.
     * Giúp khởi động nhanh, không cần query database lại.
     */
    async loadCachedIntellisense() {
      let me = this;
      if (!me.currentSessionId) return;
      try {
        const cacheKey = me.$tmEnum.cacheConfig.DuckDBQueryHistory;
        let cached = await TMCache.get(cacheKey, {
          id: me.currentSessionId,
        });
        if (cached) {
          await me.applyMonacoIntellisense(cached);
        } else {
          // Nếu chưa có cache session, vẫn áp dụng dữ liệu rỗng để có language highlight
          await me.applyMonacoIntellisense({});
        }
      } catch {}
    },

    /**
     * Xoá cache gợi ý của 1 session.
     * Nếu xoá đúng session đang dùng thì dọn luôn dữ liệu đang nạp trong Monaco
     * để gợi ý cũ không còn hiển thị.
     * @param {string} sessionId id session cần xoá cache
     */
    async handleDeleteIntellisenseCache(sessionId) {
      let me = this;
      if (!sessionId) {
        me.$tmToast.warning(me.$t("i18nCommon.duckDBQuery.noSessionSelected"));
        return false;
      }
      try {
        const cacheKey = me.$tmEnum.cacheConfig.DuckDBQueryHistory;
        await TMCache.remove(cacheKey, { id: sessionId });

        if (sessionId === me.currentSessionId) {
          me.disposeIntellisense();
          me._duckdbKeywordSet = new Set();
          clearDuckdbIntellisenseData();
        }

        me.$tmToast.success(
          me.$t("i18nCommon.duckDBQuery.deleteIntellisenseCacheSuccess"),
        );
        return true;
      } catch (error) {
        console.error("Delete intellisense cache error:", error);
        me.$tmToast.error(
          me.$t("i18nCommon.duckDBQuery.deleteIntellisenseCacheErr"),
        );
        return false;
      }
    },

    /**
     * Đăng ký completion provider và hover provider cho Monaco Editor
     * để gợi ý keyword, bảng, cột, function khi user gõ SQL DuckDB.
     * Dữ liệu gợi ý được xây dựng từ tham số data đã load trước đó.
     */
    async applyMonacoIntellisense(data) {
      let me = this;
      try {
        // Mỗi lần apply có 1 số thứ tự; nếu trong lúc chờ import có lần apply mới hơn
        // (hoặc disposeIntellisense) thì lần này bỏ, tránh đăng ký 2 bộ provider.
        const seq = ++_applySeq;

        // Lazy-load Monaco Editor (chỉ import khi cần)
        const monaco = await import("monaco-editor");
        if (seq !== _applySeq) return;

        // Từ đây đến lúc đăng ký provider KHÔNG có await nào → dispose + register là nguyên tử.
        _providerDisposables.forEach((d) => d?.dispose?.());
        _providerDisposables = [];

        // ── Helper nháy kép identifier nếu chứa ký tự đặc biệt ──────────────────
        // DuckDB: identifier được phép chứa Unicode letters, số, _, bắt đầu bằng chữ cái/_.
        // Tên có dấu cách/ký tự đặc biệt khác/bắt đầu bằng số phải bọc bằng "...".
        const quoteIdentifier = (name) => {
          const n = String(name);
          // Cho phép Unicode letters (Lu, Ll, Lt, Lm, Lo, Nd, Nl, No, Pc, Mn, Mc)
          // \p{L} = bất kỳ chữ cái Unicode nào, \p{N} = số, \p{Pc} = underscore
          if (/^[\p{L}_][\p{L}\p{M}\p{N}_]*$/u.test(n)) return n;
          return '"' + n.replace(/"/g, '""') + '"';
        };

        // Đăng ký language + Monarch + semantic provider + cập nhật dữ liệu
        registerDuckdbLanguage();
        updateDuckdbIntellisenseData(data);

        // Đăng ký format provider
        registerDuckdbFormatProvider(monaco);

        // ── Xây dựng danh sách keyword DuckDB ──────────────────────────────
        const keywords = data?.keywords?.rows ?? [];
        let keywordSuggestions = [];
        const seenKeyword = new Set();
        // keyword không được làm alias (reserved / type_function như LEFT, JOIN, FULL...)
        const reservedKeywordSet = new Set(NON_ALIAS_KEYWORDS);
        keywords.forEach((row) => {
          const name = String(row.keyword_name ?? row.word ?? "").trim();
          if (!name) return;
          const upper = name.toUpperCase();
          if (
            row.keyword_category === "reserved" ||
            row.keyword_category === "type_function"
          ) {
            reservedKeywordSet.add(name.toLowerCase());
          }
          if (seenKeyword.has(upper)) return;
          seenKeyword.add(upper);
          keywordSuggestions.push({
            label: upper,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: upper,
            detail: row.description ?? "DuckDB keyword",
          });
        });

        // Lưu set keyword để kiểm tra xung đột khi tạo alias tự động
        me._duckdbKeywordSet = new Set(
          keywords
            .map((k) => String(k.keyword_name ?? k.word).toLowerCase())
            .filter(Boolean),
        );

        // ── Xây dựng lookup map cho bảng/view/cột ──────────────────────────────
        const tableRows = data?.tables?.rows ?? [];
        const columnsByTable = new Map(); // table_name -> column list, schema.table -> column list
        const tablesBySchema = new Map(); // schema -> Set<table_name>
        const allSchemas = new Set(); // tất cả schema
        const allTables = new Set(); // tất cả tên bảng (không kèm schema)
        const allColumns = []; // tất cả cột (dùng khi không có alias)

        tableRows.forEach((row) => {
          const tbl = row.table_name;
          const schema = row.schema_name ?? row.table_schema;
          // Đọc cột từ _columns (được gộp từ information_schema.columns trong fetchDuckDBSchema)
          const cols = row._columns || [];

          // Key tra cứu luôn là chữ thường vì SQL không phân biệt hoa/thường
          // và text người dùng gõ được lowercase khi so khớp.
          const tblKey = String(tbl).toLowerCase();
          const schemaKey = String(schema).toLowerCase();

          allSchemas.add(schema);
          allTables.add(tbl);

          // Nhóm bảng theo schema
          if (!tablesBySchema.has(schemaKey))
            tablesBySchema.set(schemaKey, new Set());
          tablesBySchema.get(schemaKey).add(tbl);

          // Map cột theo tên bảng và theo schema.table
          if (!columnsByTable.has(tblKey)) columnsByTable.set(tblKey, []);
          if (!columnsByTable.has(`${schemaKey}.${tblKey}`))
            columnsByTable.set(`${schemaKey}.${tblKey}`, []);

          const seenCol = new Set();
          cols.forEach((colRow) => {
            const col = colRow.column_name;
            if (seenCol.has(col)) return;
            seenCol.add(col);
            const dtype = colRow.data_type;

            const colDef = {
              label: String(col),
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: quoteIdentifier(col),
              detail: `${tbl}.${col} (${dtype})`,
            };

            // cùng 1 bảng có thể xuất hiện ở nhiều schema/catalog → chỉ thêm nếu chưa có
            const byTbl = columnsByTable.get(tblKey);
            if (!byTbl.some((c) => c.label === colDef.label))
              byTbl.push(colDef);
            columnsByTable.get(`${schemaKey}.${tblKey}`).push(colDef);
            allColumns.push(colDef);
          });
        });

        // ── Build inspect lookup (dùng cho hover) ───────────────
        me._duckdbInspectLookup = {
          tables: new Map(), // key: table_name hoặc schema.table -> { schema, name }
        };

        tableRows.forEach((row) => {
          const tbl = String(row.table_name).toLowerCase();
          const schema = String(
            row.schema_name ?? row.table_schema,
          ).toLowerCase();
          const key = `${schema}.${tbl}`;
          if (!me._duckdbInspectLookup.tables.has(key))
            me._duckdbInspectLookup.tables.set(key, { schema, name: tbl });
          if (!me._duckdbInspectLookup.tables.has(tbl))
            me._duckdbInspectLookup.tables.set(tbl, { schema, name: tbl });
        });

        // ── Xây dựng function suggestions ──────────────────────────────────────
        // duckdb_functions() trả về 1 dòng cho MỖI overload (abs có hàng chục dòng) và cả
        // toán tử (+, ||, ~~ ...) → chỉ giữ tên hợp lệ, mỗi tên 1 lần.
        const functionRows = data?.functions?.rows ?? [];
        const functionSuggestions = [];
        const functionsBySchema = new Map();
        const seenFn = new Set();

        functionRows.forEach((row) => {
          const fnName = String(row.function_name ?? "");
          const fnKey = fnName.toLowerCase();
          if (!fnName || seenFn.has(fnKey)) return;
          if (!/^[\p{L}_][\p{L}\p{M}\p{N}_]*$/u.test(fnName)) return;
          if (fnName.startsWith("__")) return; // hàm nội bộ
          seenFn.add(fnKey);

          functionsBySchema.set("", functionsBySchema.get("") || []);
          functionsBySchema.get("").push({
            label: fnName,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: fnName,
            detail: `fn ${fnName}`,
            sortText: "0" + fnName,
          });

          functionSuggestions.push({
            label: fnName,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: fnName,
            detail: `fn ${fnName}`,
            sortText: "1" + fnName,
          });
        });

        // Tên vừa là keyword vừa là hàm (LEFT, RIGHT, CAST, REPLACE...) → chỉ hiện 1 mục (hàm),
        // nếu không Monaco hiện "LEFT" và "left" thành 2 dòng.
        keywordSuggestions = keywordSuggestions.filter(
          (k) => !seenFn.has(k.label.toLowerCase()),
        );

        // Set hàm built-in không nên tạo alias (chỉ dùng cho table/view)
        const builtinFunctionSet = seenFn;

        // ═══════════════════════════════════════════════════════════════════════
        //  ĐĂNG KÝ COMPLETION PROVIDER
        // ════════════════════════════════════════════════════════════════════════
        const disposable = monaco.languages.registerCompletionItemProvider(
          "duckdb",
          {
            triggerCharacters: ["."],
            provideCompletionItems(model, position) {
              const word = model.getWordUntilPosition(position);

              let range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };

              const text = model.getValue();
              const aliasMap = new Map();

              // Regex hỗ trợ cả identifier thường (có Unicode/tiếng Việt) và quoted identifier
              // ("..." hoặc `...`)
              // Group 1-3: table/schema (quoted " / quoted ` / thường)
              // Group 4-6: table nếu có schema
              // Group 7-9: alias
              const regex =
                /(?:from|join)\s+(?:"([^"]+)"|`([^`]+)`|([\p{L}\p{M}\p{N}_]+))(?:\.(?:"([^"]+)"|`([^`]+)`|([\p{L}\p{M}\p{N}_]+)))?(?:\s+as)?\s+(?:"([^"]+)"|`([^`]+)`|([\p{L}\p{M}\p{N}_]+))?/giu;
              let match;

              while ((match = regex.exec(text)) !== null) {
                let schemaOrTable = match[1] || match[2] || match[3] || "";
                let tableIfSchema = match[4] || match[5] || match[6] || "";
                let aliasOrTable = match[7] || match[8] || match[9] || "";

                let schema = "";
                let table = "";
                let alias = "";
                let explicit = false;

                if (tableIfSchema) {
                  schema = schemaOrTable.toLowerCase();
                  table = tableIfSchema.toLowerCase();
                } else {
                  table = schemaOrTable.toLowerCase();
                }

                if (
                  aliasOrTable &&
                  !reservedKeywordSet.has(aliasOrTable.toLowerCase())
                ) {
                  alias = aliasOrTable.toLowerCase();
                  explicit = true;
                } else {
                  alias = table;
                }
                aliasMap.set(alias, { schema, table, explicit });
              }

              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforePointer = lineContent.substring(
                0,
                position.column - 1,
              );

              const dotMatch = textBeforePointer.match(
                /(?:"([^"]+)"|`([^`]+)`|([\p{L}\p{M}\p{N}_]+))\.\s*([\p{L}\p{M}\p{N}_]*)$/u,
              );

              let suggestions = [];

              // ── TRƯỜNG HỢP 1: CÓ DẤU CHẤP (context: "prefix.") ──────────────
              if (dotMatch) {
                // dotMatch groups: [1]=double-quoted, [2]=backtick, [3]=unquoted, [4]=typed word
                const prefix = (
                  dotMatch[1] ||
                  dotMatch[2] ||
                  dotMatch[3] ||
                  ""
                ).toLowerCase();
                const typedWord = dotMatch[4] || "";

                // độ dài đúng của "prefix." + từ đang gõ (kể cả dấu " ` và khoảng trắng sau dấu chấm)
                const totalOffset = dotMatch[0].length;
                range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - totalOffset,
                  endColumn: position.column,
                };

                // 1a. Prefix là alias -> gợi ý cột của bảng mà alias trỏ đến
                if (aliasMap.has(prefix)) {
                  const mapped = aliasMap.get(prefix);
                  let key = mapped.schema
                    ? `${mapped.schema}.${mapped.table}`
                    : mapped.table;
                  let cols =
                    columnsByTable.get(key) ||
                    columnsByTable.get(mapped.table) ||
                    [];
                  const seenAliasCol = new Set();
                  cols.forEach((c) => {
                    if (seenAliasCol.has(c.label)) return;
                    seenAliasCol.add(c.label);
                    suggestions.push({
                      ...c,
                      filterText: `${prefix}.${c.label}`,
                      insertText: `${quoteIdentifier(prefix)}.${c.insertText}`,
                    });
                  });
                }
                // 1b. Prefix là tên bảng -> gợi ý cột của bảng đó
                else if (columnsByTable.has(prefix)) {
                  let cols = columnsByTable.get(prefix) || [];
                  const seenTableCol = new Set();
                  cols.forEach((c) => {
                    if (seenTableCol.has(c.label)) return;
                    seenTableCol.add(c.label);
                    suggestions.push({
                      ...c,
                      filterText: `${prefix}.${c.label}`,
                      insertText: `${quoteIdentifier(prefix)}.${c.insertText}`,
                    });
                  });
                }
                // 1c. Prefix là tên schema -> gợi ý bảng + functions trong schema đó
                else if (
                  tablesBySchema.has(prefix) ||
                  functionsBySchema.has(prefix)
                ) {
                  (tablesBySchema.get(prefix) ?? new Set()).forEach((tbl) => {
                    const alias = me._generateUniqueAlias(
                      tbl,
                      text,
                      me._duckdbKeywordSet,
                    );
                    suggestions.push({
                      label: tbl,
                      kind: monaco.languages.CompletionItemKind.Module,
                      filterText: `${prefix}.${tbl}`,
                      insertText: alias
                        ? `${prefix}.${quoteIdentifier(tbl)} ${alias} `
                        : `${prefix}.${quoteIdentifier(tbl)}`,
                      detail: `Table (${prefix})`,
                    });
                  });

                  (functionsBySchema.get(prefix) ?? []).forEach((fnItem) => {
                    // Không tạo alias cho built-in function
                    const isBuiltin = builtinFunctionSet.has(
                      fnItem.label.toLowerCase(),
                    );
                    const alias = isBuiltin
                      ? null
                      : me._generateUniqueAlias(
                          fnItem.label,
                          text,
                          me._duckdbKeywordSet,
                        );
                    suggestions.push({
                      ...fnItem,
                      filterText: `${prefix}.${fnItem.label}`,
                      insertText: alias
                        ? `${fnItem.insertText} ${alias} `
                        : fnItem.insertText,
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                    });
                  });
                }
              }
              // ── TRƯỜNG HỢP 2: KHÔNG CÓ DẤU CHẤM (gõ chay) ──────────────────
              else {
                suggestions.push(...keywordSuggestions);

                allSchemas.forEach((schema) => {
                  suggestions.push({
                    label: schema,
                    kind: monaco.languages.CompletionItemKind.Folder,
                    insertText: schema,
                    detail: "Schema",
                  });
                });

                allTables.forEach((tbl) => {
                  const alias = me._generateUniqueAlias(
                    tbl,
                    text,
                    me._duckdbKeywordSet,
                  );
                  suggestions.push({
                    label: tbl,
                    kind: monaco.languages.CompletionItemKind.Module,
                    insertText: alias
                      ? `${quoteIdentifier(tbl)} ${alias} `
                      : quoteIdentifier(tbl),
                    detail: "Table",
                  });
                });

                suggestions.push(
                  ...functionSuggestions.map((fnItem) => {
                    // Không tạo alias cho built-in function (array_agg, count, etc.)
                    const isBuiltin = builtinFunctionSet.has(
                      fnItem.label.toLowerCase(),
                    );
                    const alias = isBuiltin
                      ? null
                      : me._generateUniqueAlias(
                          fnItem.label,
                          text,
                          me._duckdbKeywordSet,
                        );
                    return alias
                      ? {
                          ...fnItem,
                          insertText: `${fnItem.insertText} ${alias} `,
                        }
                      : fnItem;
                  }),
                );

                if (aliasMap.size > 0) {
                  aliasMap.forEach((mapped, alias) => {
                    // Bảng không đặt alias thì alias == tên bảng: đã có mục "Table" rồi,
                    // thêm mục Variable nữa sẽ bị trùng 2 dòng.
                    if (mapped.explicit) {
                      suggestions.push({
                        label: alias,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: quoteIdentifier(alias),
                        sortText: "0" + alias,
                        detail: mapped.schema
                          ? `${mapped.schema}.${mapped.table}`
                          : mapped.table,
                      });
                    }
                    let key = mapped.schema
                      ? `${mapped.schema}.${mapped.table}`
                      : mapped.table;
                    let cols =
                      columnsByTable.get(key) ||
                      columnsByTable.get(mapped.table) ||
                      [];
                    cols.forEach((c) => {
                      suggestions.push({
                        ...c,
                        sortText: "1" + c.label,
                      });
                    });
                  });
                }
              }

              // Loại bỏ các suggestion trùng nhau
              // Key không phân biệt hoa/thường; mục xuất hiện trước được giữ lại.
              const uniqueMap = new Map();
              suggestions.forEach((s) => {
                const key = `${s.kind}|${String(s.label).toLowerCase()}|${s.insertText}`;
                if (!uniqueMap.has(key)) uniqueMap.set(key, s);
              });

              const finalSuggestions = Array.from(uniqueMap.values()).map(
                (s) => ({
                  ...s,
                  range,
                  ...(s.insertTextRules != null
                    ? { insertTextRules: s.insertTextRules }
                    : {}),
                }),
              );

              return {
                suggestions: finalSuggestions,
              };
            },
          },
        );

        _providerDisposables = [disposable];
        me.intellisenseDisposable = _providerDisposables;

        // ═══════════════════════════════════════════════════════════════════════
        //  ĐĂNG KÝ HOVER PROVIDER
        // ════════════════════════════════════════════════════════════════════════
        function findInspectObject(word) {
          if (!me._duckdbInspectLookup) return null;
          const w = word.toLowerCase();
          let entry = me._duckdbInspectLookup.tables.get(w);
          if (entry) return { ...entry, type: "table" };
          return null;
        }

        const hoverDisposable = monaco.languages.registerHoverProvider(
          "duckdb",
          {
            provideHover: async (model, position) => {
              if (!me.currentSessionId || !me._duckdbInspectLookup) return null;

              const word = model.getWordAtPosition(position);
              if (!word) return null;
              const objectName = word.word.toLowerCase();

              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforeWord = lineContent.substring(
                0,
                word.startColumn - 1,
              );
              const dotMatch = textBeforeWord.match(
                /(?:"([^"]+)"|`([^`]+)`|([\p{L}\p{M}\p{N}_]+))\.$/u,
              );

              if (dotMatch) {
                const schemaName = (
                  dotMatch[1] ||
                  dotMatch[2] ||
                  dotMatch[3] ||
                  ""
                ).toLowerCase();
                const key = `${schemaName}.${objectName}`;
                const obj = findInspectObject(key);
                if (!obj) return null;
                return buildHoverContent(obj, objectName);
              }

              const obj = findInspectObject(objectName);
              if (!obj) return null;
              return buildHoverContent(obj, objectName);
            },
          },
        );
        _providerDisposables.push(hoverDisposable);

        function buildHoverContent(obj, name) {
          const typeLabel = obj.type === "table" ? "TABLE" : "VIEW";
          const fullName = `${obj.schema}.${obj.name}`;
          const contents = [
            { value: `**${typeLabel}** \`${fullName}\``, isTrusted: true },
          ];
          contents.push({
            value: `\n\n_${me.$t("i18nCommon.duckDBQuery.dbInspectHint")}_`,
            isTrusted: true,
          });
          return { contents };
        }
      } catch (error) {
        console.error("applyMonacoIntellisense error:", error);
      }
    },

    /**
     * Tạo alias tự động từ tên object (table/view/function) dạng viết tắt chữ cái đầu.
     * Ví dụ: "account_object" -> "ao", "inventory_item" -> "ii".
     */
    _generateUniqueAlias(objectName, sqlText, keywordSet) {
      if (!objectName) return null;

      const parts = objectName.split(".");
      const name = parts[parts.length - 1];

      const words = name.split("_").filter((w) => w.length > 0);
      if (words.length === 0) return null;

      // Chỉ lấy chữ cái đầu của các từ bắt đầu bằng a-z, tránh alias bắt đầu bằng số
      // (VD: "_1000000_rows" -> "r" thay vì "1r", không hợp lệ trong SQL)
      const alphaWords = words.filter((w) => /\p{L}/u.test(w[0]));
      let base = alphaWords.length
        ? alphaWords
            .map((w) => w[0])
            .join("")
            .toLowerCase()
        : "t";
      if (!base) base = "t";

      const used = new Set();
      const re =
        /(?:from|join)\s+([\p{L}\p{M}\p{N}_]+)(?:\.([\p{L}\p{M}\p{N}_]+))?(?:\s+as)?\s+([\p{L}\p{M}\p{N}_]+)?/giu;
      let m;
      while ((m = re.exec(sqlText)) !== null) {
        if (m[1]) used.add(m[1].toLowerCase());
        if (m[2]) used.add(m[2].toLowerCase());
        if (m[3]) used.add(m[3].toLowerCase());
      }

      let finalAlias = base;
      let counter = 1;
      while (
        used.has(finalAlias) ||
        (keywordSet && keywordSet.has(finalAlias))
      ) {
        counter++;
        finalAlias = base + counter;
        if (counter > 1000) return base;
      }

      return finalAlias;
    },
  },
};
