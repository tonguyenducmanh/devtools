// mixin chứa toàn bộ logic xử lý intellisense (gợi ý code, tô màu cú pháp) cho tool DuckDB Query
// tách riêng file để dễ đọc và bảo trì, được import vào TMDuckDBQuery.vue
import TMCache from "@/common/cache/TMCache.js";
import {
  registerDuckdbLanguage,
  updateDuckdbIntellisenseData,
  clearDuckdbIntellisenseData,
} from "@/monarch/duckdb/duckdbLanguage.js";
import { registerDuckdbFormatProvider } from "@/monarch/duckdb/duckdbFormatProvider.js";

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
      if (me.intellisenseDisposable) {
        me.intellisenseDisposable.forEach((d) => d?.dispose?.());
        me.intellisenseDisposable = null;
      }
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
        let keywordsResult = await me.fetchDuckDBKeywords(defaultQueryLimit, limitResults);

        // Bước 2: Lấy danh sách bảng + cột từ session hiện tại (bao gồm cả file vừa upload)
        let schemaResult = await me.fetchDuckDBSchema(defaultQueryLimit, limitResults);

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

        me.$tmToast.success(
          me.$t("i18nCommon.duckDBQuery.intellisenseLoaded"),
        );
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
          "SELECT * FROM duckdb_keywords() ORDER BY keyword_name",
          defaultQueryLimit,
          limitResults,
        );
        let keywordResult =
          keywordResponse?.data?.data?.results?.[0] ||
          keywordResponse?.data?.data ||
          null;
        return keywordResponse?.data?.success
          ? keywordResult
          : null;
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
          "SELECT table_schema, table_name, column_name, data_type, ordinal_position FROM information_schema.columns ORDER BY table_schema, table_name, ordinal_position",
          defaultQueryLimit,
          limitResults,
        );

        let columnResult =
          columnsResponse?.data?.data?.results?.[0] ||
          columnsResponse?.data?.data ||
          null;
        if (columnsResponse?.data?.success && columnResult?.rows) {
          // Tạo map table_name -> columns
          const columnsByTable = new Map();
          columnResult.rows.forEach((row) => {
            const key = `${row.table_schema}.${row.table_name}`;
            if (!columnsByTable.has(key)) {
              columnsByTable.set(key, []);
            }
            columnsByTable.get(key).push(row);
          });

          // Xây dựng rows bảng từ các key duy nhất (schema.table)
          columnsByTable.forEach((cols, key) => {
            const parts = key.split(".");
            const schema = parts[0];
            const tbl = parts.slice(1).join(".");
            allTableRows.push({
              schema_name: schema,
              table_schema: schema,
              table_name: tbl,
              _columns: cols,
            });
          });
        }

        // Lấy danh sách hàm (nếu có)
        try {
          let funcsResponse = await me.agentAPI.executeQuery(
            me.currentSessionId,
            "SELECT function_name FROM duckdb_functions() ORDER BY function_name",
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
        me.$tmToast.warning(
          me.$t("i18nCommon.duckDBQuery.noSessionSelected"),
        );
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
        // Xoá các provider cũ trước khi đăng ký mới, tránh chồng chéo
        if (me.intellisenseDisposable) {
          me.intellisenseDisposable.forEach((d) => d?.dispose?.());
        }

        // Lazy-load Monaco Editor (chỉ import khi cần)
        const monaco = await import("monaco-editor");

        // Đăng ký language + Monarch + semantic provider + cập nhật dữ liệu
        registerDuckdbLanguage();
        updateDuckdbIntellisenseData(data);

        // Đăng ký format provider
        registerDuckdbFormatProvider(monaco);

        // ── Xây dựng danh sách keyword DuckDB ──────────────────────────────
        const keywords = data?.keywords?.rows ?? [];
        const keywordSuggestions = [];
        keywords.forEach((row) => {
          keywordSuggestions.push({
            label: String(row.keyword_name ?? row.word ?? "").toUpperCase(),
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: String(row.keyword_name ?? row.word ?? "").toUpperCase(),
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

          allSchemas.add(schema);
          allTables.add(tbl);

          // Nhóm bảng theo schema
          if (!tablesBySchema.has(schema))
            tablesBySchema.set(schema, new Set());
          tablesBySchema.get(schema).add(tbl);

          // Map cột theo tên bảng và theo schema.table
          if (!columnsByTable.has(tbl)) columnsByTable.set(tbl, []);
          if (!columnsByTable.has(`${schema}.${tbl}`))
            columnsByTable.set(`${schema}.${tbl}`, []);

          const seenCol = new Set();
          cols.forEach((colRow) => {
            const col = colRow.column_name;
            if (seenCol.has(col)) return;
            seenCol.add(col);
            const dtype = colRow.data_type;

            const colDef = {
              label: String(col),
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: String(col),
              detail: `${tbl}.${col} (${dtype})`,
            };

            columnsByTable.get(tbl).push(colDef);
            columnsByTable.get(`${schema}.${tbl}`).push(colDef);
            allColumns.push(colDef);
          });
        });

        // ── Build inspect lookup (dùng cho hover) ───────────────
        me._duckdbInspectLookup = {
          tables: new Map(), // key: table_name hoặc schema.table -> { schema, name }
        };

        tableRows.forEach((row) => {
          const tbl = String(row.table_name).toLowerCase();
          const schema = String(row.schema_name ?? row.table_schema).toLowerCase();
          const key = `${schema}.${tbl}`;
          if (!me._duckdbInspectLookup.tables.has(key))
            me._duckdbInspectLookup.tables.set(key, { schema, name: tbl });
          if (!me._duckdbInspectLookup.tables.has(tbl))
            me._duckdbInspectLookup.tables.set(tbl, { schema, name: tbl });
        });

        // ── Xây dựng function suggestions ──────────────────────────────────────
        const functionRows = data?.functions?.rows ?? [];
        const functionSuggestions = [];
        const functionsBySchema = new Map();

        functionRows.forEach((row) => {
          const fnName = row.function_name;

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

              const regex =
                /(?:from|join)\s+([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_]+))?(?:\s+as)?\s+([a-zA-Z0-9_]+)?/gi;
              let match;
              const sqlKeywords = [
                "where", "join", "on", "left", "right", "inner", "outer",
                "cross", "group", "order", "having", "limit", "select",
                "and", "or", "with", "as",
              ];

              while ((match = regex.exec(text)) !== null) {
                let schemaOrTable = match[1];
                let tableIfSchema = match[2];
                let aliasOrTable = match[3];

                let schema = "";
                let table = "";
                let alias = "";

                if (tableIfSchema) {
                  schema = schemaOrTable.toLowerCase();
                  table = tableIfSchema.toLowerCase();
                } else {
                  table = schemaOrTable.toLowerCase();
                }

                if (
                  aliasOrTable &&
                  !sqlKeywords.includes(aliasOrTable.toLowerCase())
                ) {
                  alias = aliasOrTable.toLowerCase();
                } else {
                  alias = table;
                }
                aliasMap.set(alias, { schema, table });
              }

              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforePointer = lineContent.substring(
                0,
                position.column - 1,
              );

              const dotMatch = textBeforePointer.match(
                /([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/,
              );

              let suggestions = [];

              // ── TRƯỜNG HỢP 1: CÓ DẤU CHẤP (context: "prefix.") ──────────────
              if (dotMatch) {
                const prefix = dotMatch[1].toLowerCase();
                const typedWord = dotMatch[2];

                const totalOffset = prefix.length + 1 + typedWord.length;
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
                      insertText: `${prefix}.${c.insertText}`,
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
                      insertText: `${prefix}.${c.insertText}`,
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
                        ? `${prefix}.${tbl} ${alias} `
                        : `${prefix}.${tbl}`,
                      detail: `Table (${prefix})`,
                    });
                  });

                  (functionsBySchema.get(prefix) ?? []).forEach((fnItem) => {
                    const alias = me._generateUniqueAlias(
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
                    insertText: alias ? `${tbl} ${alias} ` : tbl,
                    detail: "Table",
                  });
                });

                suggestions.push(
                  ...functionSuggestions.map((fnItem) => {
                    const alias = me._generateUniqueAlias(
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
                    suggestions.push({
                      label: alias,
                      kind: monaco.languages.CompletionItemKind.Variable,
                      insertText: alias,
                      sortText: "0" + alias,
                      detail: mapped.schema
                        ? `${mapped.schema}.${mapped.table}`
                        : mapped.table,
                    });
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
              const uniqueMap = new Map();
              suggestions.forEach((s) => {
                uniqueMap.set(s.label + s.kind + s.insertText, s);
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

        me.intellisenseDisposable = [disposable];

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
              if (!me.currentSessionId || !me._duckdbInspectLookup)
                return null;

              const word = model.getWordAtPosition(position);
              if (!word) return null;
              const objectName = word.word.toLowerCase();

              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforeWord = lineContent.substring(
                0,
                word.startColumn - 1,
              );
              const dotMatch = textBeforeWord.match(/([a-zA-Z0-9_]+)\.$/);

              if (dotMatch) {
                const schemaName = dotMatch[1].toLowerCase();
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
        me.intellisenseDisposable.push(hoverDisposable);

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
    const alphaWords = words.filter((w) => /[a-zA-Z]/.test(w[0]));
    let base = alphaWords.length
      ? alphaWords.map((w) => w[0]).join("").toLowerCase()
      : "t";
    if (!base) base = "t";

    const used = new Set();
    const re =
      /(?:from|join)\s+([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_]+))?(?:\s+as)?\s+([a-zA-Z0-9_]+)?/gi;
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
