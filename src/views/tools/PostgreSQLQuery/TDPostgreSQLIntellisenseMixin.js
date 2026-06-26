// mixin chứa toàn bộ logic xử lý intellisense (gợi ý code, tô màu cú pháp) cho tool PostgreSQL Query
// tách riêng file để dễ đọc và bảo trì, được import vào TDPostgreSQLQuery.vue
import TDCache from "@/common/cache/TDCache.js";
import pgQueries from "./templates.js";
import {
  registerPgsqlLanguage,
  updatePgsqlIntellisenseData,
} from "@/components/monarch/pgsqlLanguage.js";

export default {
  created() {
    // đăng ký ngôn ngữ pgsql cho Monaco Editor ngay khi component được tạo
    registerPgsqlLanguage();
  },
  methods: {
    /**
     * Tải toàn bộ dữ liệu intellisense (keywords, tables, functions) từ database
     * bằng cách gọi các câu SQL mẫu trong templates.js, phân trang để tránh quá tải.
     * Kết quả được lưu vào IndexedDB cache và áp dụng lên Monaco Editor.
     */
    async handleLoadIntellisense() {
      let me = this;
      // Bỏ qua nếu chưa chọn connection
      if (!me.selectedConnectionId) return;
      me.isLoadingIntellisense = true;
      try {
        // Xoá cache cũ của connection này để tránh dữ liệu rác
        const cacheKey = me.$tdEnum.cacheConfig.PostgreSQLQueryHistory;
        await TDCache.remove(cacheKey, { id: me.selectedConnectionId });

        // Mỗi lần gọi SQL chỉ lấy 5000 dòng, tránh timeout
        let defaultQueryLimit = 5000;
        let limitResults = false;

        // Bước 1: Lấy danh sách keyword PostgreSQL từ hệ thống
        let keywordsResult = await me.fetchAllKeyWordInCurrentDatabase();

        // Bước 2: Đếm tổng số bảng/view để biết số trang cần tải
        let totalRows = await me.fetchTotalTableAndViewInCurrentDatabase();

        // Bước 3: Tải dữ liệu bảng/view theo từng trang (LIMIT/OFFSET)
        let tablesResult = await me.fetchAllTableRows(
          totalRows,
          defaultQueryLimit,
          limitResults,
        );

        // Bước 4: Tải functions (chỉ khi user bật tuỳ chọn trong sidebar)
        let functionsResult = await me.fetchAllFunctionInCurrentDatabase(
          defaultQueryLimit,
          limitResults,
        );

        // Gom tất cả dữ liệu intellisense lại
        let intellisenseData = {
          keywords: keywordsResult,
          tables: tablesResult,
          functions: functionsResult,
        };

        // Lưu vào IndexedDB để lần sau load nhanh hơn, rồi áp dụng lên Monaco
        await TDCache.set(cacheKey, intellisenseData, {
          id: me.selectedConnectionId,
        });
        await me.applyMonacoIntellisense(intellisenseData);

        me.$tdToast.success(
          me.$t("i18nCommon.postgreSQLQuery.intellisenseLoaded"),
        );
      } catch (error) {
        console.error("Load intellisense error:", error);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      } finally {
        me.isLoadingIntellisense = false;
      }
    },

    /**
     * Lấy ra toàn bộ keyword của database hiện tại
     */
    async fetchAllKeyWordInCurrentDatabase() {
      let me = this;
      let keywordResponse = await me.agentAPI.executeQuery(
        me.selectedConnectionId,
        pgQueries.pg_get_keywords,
        9999,
        true,
      );
      // Trích xuất kết quả keywords từ response
      let keywordResult =
        keywordResponse?.data?.data?.results?.[0] ||
        keywordResponse?.data?.data ||
        null;

      let keywordsResult = keywordResponse?.data?.success
        ? keywordResult
        : null;
      return keywordsResult;
    },

    /**
     * Đếm tổng số bản ghi table và view có trong database hiện tại
     */
    async fetchTotalTableAndViewInCurrentDatabase() {
      let me = this;
      let totalRows = 0;
      let countResponse = await me.agentAPI.executeQuery(
        me.selectedConnectionId,
        pgQueries.pg_get_tables_count,
        1,
      );

      const countResult =
        countResponse?.data?.data?.results?.[0] ||
        countResponse?.data?.data ||
        null;

      if (countResponse?.data?.success && countResult?.rows?.length > 0) {
        totalRows = parseInt(countResult.rows[0].total || 0, 10);
      }
      return totalRows;
    },

    /**
     * lấy toàn bộ dữ liệu table và view ở database hiện tại
     */
    async fetchAllTableRows(totalRows, defaultQueryLimit, limitResults) {
      let me = this;
      let allTableRows = [];

      for (let offset = 0; offset < totalRows; offset += defaultQueryLimit) {
        // Ghép LIMIT/OFFSET vào câu SQL mẫu
        let pagingQuery = `${pgQueries.pg_get_tables_paging} LIMIT ${defaultQueryLimit} OFFSET ${offset};`;

        let pagingResponse = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          pagingQuery,
          defaultQueryLimit,
          !limitResults,
        );

        const pagingResult =
          pagingResponse?.data?.data?.results?.[0] ||
          pagingResponse?.data?.data ||
          null;

        // Nếu lỗi ở trang nào thì dừng luôn để tránh treo
        if (pagingResponse?.data?.success && pagingResult?.rows) {
          allTableRows.push(...pagingResult.rows);
        } else {
          console.error(
            `Gặp lỗi khi tải dữ liệu tại vị trí dòng (offset): ${offset}`,
          );
          break;
        }
      }

      // Đóng gói kết quả bảng/view đúng cấu trúc để Monaco xử lý
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
      return tablesResult;
    },

    /**
     * lấy ra toàn bộ function từ db hiện tại
     */
    async fetchAllFunctionInCurrentDatabase(defaultQueryLimit, limitResults) {
      let me = this;
      let allFunctionRows = [];
      if (me.currentConfigLayout.loadFunctionIntellisense) {
        try {
          // Đếm tổng số function để phân trang
          let funcCountResponse = await me.agentAPI.executeQuery(
            me.selectedConnectionId,
            pgQueries.pg_get_functions_count,
            defaultQueryLimit,
            !limitResults,
          );

          let totalFuncRows = 0;
          const funcCountResult =
            funcCountResponse?.data?.data?.results?.[0] ||
            funcCountResponse?.data?.data ||
            null;

          if (
            funcCountResponse?.data?.success &&
            funcCountResult?.rows?.length > 0
          ) {
            totalFuncRows = parseInt(funcCountResult.rows[0].total || 0, 10);
          }

          // Tải từng trang function
          for (
            let offset = 0;
            offset < totalFuncRows;
            offset += defaultQueryLimit
          ) {
            let funcPagingQuery = `${pgQueries.pg_get_functions_paging} LIMIT ${defaultQueryLimit} OFFSET ${offset};`;

            let funcPagingResponse = await me.agentAPI.executeQuery(
              me.selectedConnectionId,
              funcPagingQuery,
              defaultQueryLimit,
              !limitResults,
            );

            const funcPagingResult =
              funcPagingResponse?.data?.data?.results?.[0] ||
              funcPagingResponse?.data?.data ||
              null;

            if (funcPagingResponse?.data?.success && funcPagingResult?.rows) {
              allFunctionRows.push(...funcPagingResult.rows);
            } else {
              console.error(
                `Gặp lỗi khi tải functions tại vị trí dòng (offset): ${offset}`,
              );
              break;
            }
          }
        } catch (e) {
          console.warn("Load functions intellisense warning:", e);
        }
      }

      // Đóng gói kết quả functions
      let functionsResult = {
        columns: [
          "function_schema",
          "function_name",
          "function_arguments",
          "return_type",
          "function_oid",
        ],
        rows: allFunctionRows,
      };
      return functionsResult;
    },

    /**
     * Tải intellisense từ IndexedDB cache của connection hiện tại
     * (nếu đã từng load trước đó) và áp dụng lên Monaco.
     * Giúp khởi động nhanh, không cần query database lại.
     */
    async loadCachedIntellisense() {
      let me = this;
      if (!me.selectedConnectionId) return;
      try {
        const cacheKey = me.$tdEnum.cacheConfig.PostgreSQLQueryHistory;
        let cached = await TDCache.get(cacheKey, {
          id: me.selectedConnectionId,
        });
        if (cached) {
          await me.applyMonacoIntellisense(cached);
        }
      } catch {}
    },

    /**
     * Đăng ký completion provider và hover provider cho Monaco Editor
     * để gợi ý keyword, bảng, cột, function, alias khi user gõ SQL.
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

        // ── Xây dựng danh sách keyword PostgreSQL ──────────────────────────────
        const keywords = data?.keywords?.rows ?? [];
        const keywordSuggestions = [];
        keywords.forEach((row) => {
          keywordSuggestions.push({
            label: String(row.word ?? "").toUpperCase(),
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: String(row.word ?? "").toUpperCase(),
            detail: row.catdesc ?? "PostgreSQL keyword",
          });
        });

        // Lưu set keyword để kiểm tra xung đột khi tạo alias tự động
        me._pgKeywordSet = new Set(
          keywords.map((k) => String(k.word).toLowerCase()).filter(Boolean),
        );

        // Đăng ký language + Monarch + semantic provider + cập nhật dữ liệu
        registerPgsqlLanguage();
        updatePgsqlIntellisenseData(data);

        // ── Xây dựng lookup map cho bảng/view/cột ──────────────────────────────
        const tableRows = data?.tables?.rows ?? [];
        const columnsByTable = new Map(); // table_name -> column list, schema.table -> column list
        const tablesBySchema = new Map(); // schema -> Set<table_name>
        const allSchemas = new Set(); // tất cả schema
        const allTables = new Set(); // tất cả tên bảng (không kèm schema)
        const allColumns = []; // tất cả cột (dùng khi không có alias)

        tableRows.forEach((row) => {
          const tbl = row.table_name;
          const schema = row.table_schema;
          const col = row.column_name;
          const dtype = row.data_type;

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

        // ── Build inspect lookup (dùng cho hover và F12 inspect) ───────────────
        me._inspectLookup = {
          tables: new Map(), // key: table_name hoặc schema.table -> { schema, name }
          views: new Map(), // key: view_name hoặc schema.view -> { schema, name }
          functions: new Map(), // key: function_name hoặc schema.func -> { schema, name, args, ... }
        };

        // Phân loại bảng (table_type = 'VIEW' -> view, còn lại -> table)
        tableRows.forEach((row) => {
          const tbl = String(row.table_name).toLowerCase();
          const schema = String(row.table_schema).toLowerCase();
          const type = String(row.table_type || "").toUpperCase();
          const key = `${schema}.${tbl}`;

          if (type === "VIEW") {
            if (!me._inspectLookup.views.has(key))
              me._inspectLookup.views.set(key, { schema, name: tbl });
            if (!me._inspectLookup.views.has(tbl))
              me._inspectLookup.views.set(tbl, { schema, name: tbl });
          } else {
            if (!me._inspectLookup.tables.has(key))
              me._inspectLookup.tables.set(key, { schema, name: tbl });
            if (!me._inspectLookup.tables.has(tbl))
              me._inspectLookup.tables.set(tbl, { schema, name: tbl });
          }
        });

        // ── Xử lý function arguments và tạo snippet ────────────────────────────

        // Parse chuỗi arguments "name type, name type" thành mảng {name, type}
        function parseFunctionArgs(argsStr) {
          if (!argsStr || !argsStr.trim()) return [];
          return argsStr.split(",").map((segment) => {
            const parts = segment.trim().split(/\s+/);
            const name = parts.length >= 2 ? parts[0] : null;
            let type = parts.length >= 2 ? parts.slice(1).join(" ") : parts[0];
            // Loại bỏ phần DEFAULT … dư thừa (vd: "date DEFAULT NULL::date" -> "date")
            const defaultIdx = type.search(/\bDEFAULT\b/i);
            if (defaultIdx !== -1) {
              type = type.substring(0, defaultIdx).trim();
            }
            return { name: name || null, type: type || "" };
          });
        }

        // Tạo snippet function call không kèm schema, có tabstop cho từng param
        function buildFunctionCallSnippet(fnName, argsStr) {
          const args = parseFunctionArgs(argsStr);
          if (args.length === 0) {
            return `${fnName}()`;
          }
          let tabStop = 1;
          const paramLines = args.map((arg) => {
            const ts = tabStop++;
            if (arg.name) {
              return `  ${arg.name} => '\${${ts}}'::${arg.type}`;
            }
            return `  '\${${ts}}'::${arg.type}`;
          });
          return `${fnName}(\n` + paramLines.join(",\n") + `\n)`;
        }

        // Tạo snippet function call kèm schema prefix
        function buildFunctionCallSnippetWithSchema(schema, fnName, argsStr) {
          const args = parseFunctionArgs(argsStr);
          if (args.length === 0) {
            return `${schema}.${fnName}()`;
          }
          let tabStop = 1;
          const paramLines = args.map((arg) => {
            const ts = tabStop++;
            if (arg.name) {
              return `  ${arg.name} => '\${${ts}}'::${arg.type}`;
            }
            return `  '\${${ts}}'::${arg.type}`;
          });
          return `${schema}.${fnName}(\n` + paramLines.join(",\n") + `\n)`;
        }

        // ── Xây dựng function suggestions ──────────────────────────────────────
        const functionRows = data?.functions?.rows ?? [];
        const functionSuggestions = []; // dùng cho context không có dấu chấm
        const functionsBySchema = new Map(); // schema -> function items, dùng cho context có dấu chấm

        functionRows.forEach((row) => {
          const schema = row.function_schema;
          const fnName = row.function_name;
          const argsStr = row.function_arguments || "";
          const returnType = row.return_type || "";

          // Nội dung documentation hiển thị khi hover
          const docValue = [
            `**${schema}.${fnName}**`,
            ``,
            `Arguments: \`${argsStr || "(none)"}\``,
            `Returns: \`${returnType}\``,
          ].join("\n");

          const pureSnippet = buildFunctionCallSnippet(fnName, argsStr);
          const fullSnippet = buildFunctionCallSnippetWithSchema(
            schema,
            fnName,
            argsStr,
          );

          // Item dùng cho context schema prefix (vd: "sme."), ưu tiên sort cao hơn
          if (!functionsBySchema.has(schema)) functionsBySchema.set(schema, []);
          functionsBySchema.get(schema).push({
            label: fnName,
            kind: monaco.languages.CompletionItemKind.Function,
            pureInsertText: pureSnippet,
            fullInsertText: fullSnippet,
            detail: `fn ${schema}.${fnName}(${argsStr}) \u2192 ${returnType}`,
            documentation: { value: docValue, isTrusted: true },
            sortText: "0" + fnName,
          });

          // Item dùng cho context không có dấu chấm
          functionSuggestions.push({
            label: fnName,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: fullSnippet,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `fn ${schema}.${fnName}(${argsStr}) \u2192 ${returnType}`,
            documentation: { value: docValue, isTrusted: true },
            sortText: "1" + fnName,
          });
        });

        // Thêm functions vào inspect lookup (cả key có schema và không schema)
        functionRows.forEach((row) => {
          const schema = String(row.function_schema).toLowerCase();
          const fnName = String(row.function_name).toLowerCase();
          const key = `${schema}.${fnName}`;
          const entry = {
            schema,
            name: fnName,
            args: row.function_arguments || "",
            returnType: row.return_type || "",
            oid: row.function_oid || null,
          };
          if (!me._inspectLookup.functions.has(key))
            me._inspectLookup.functions.set(key, entry);
          if (!me._inspectLookup.functions.has(fnName))
            me._inspectLookup.functions.set(fnName, entry);
        });

        // ═══════════════════════════════════════════════════════════════════════
        //  ĐĂNG KÝ COMPLETION PROVIDER
        // ═══════════════════════════════════════════════════════════════════════
        // Provider này xử lý 2 tình huống:
        //   1. Có dấu chấm (vd: "sme.", "ao.") -> gợi ý cột/bảng/function theo prefix
        //   2. Không có dấu chấm -> gợi ý keyword, schema, table, function, alias
        const disposable = monaco.languages.registerCompletionItemProvider(
          "pgsql",
          {
            triggerCharacters: ["."],
            provideCompletionItems(model, position) {
              const word = model.getWordUntilPosition(position);

              // Range mặc định: thay thế từ vị trí con trỏ đến cuối từ hiện tại
              let range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };

              // Đọc toàn bộ nội dung SQL hiện tại để phân tích alias và ngữ cảnh
              const text = model.getValue();
              const aliasMap = new Map();

              // regex phát hiện alias từ mệnh đề FROM/JOIN, có flag g để dùng lastIndex
              // /(?:from|join)\s+/ - khớp từ khóa FROM hoặc JOIN + khoảng trắng
              // ([a-zA-Z0-9_]+) - capturing group 1: tên schema hoặc tên bảng (vd: "sme" hoặc "account_object")
              // (?:\.([a-zA-Z0-9_]+))? - optional: dấu chấm + capturing group 2: tên bảng nếu group 1 là schema
              // (?:\s+as)? - optional: từ khóa "as" (vd: "as ao")
              // \s+([a-zA-Z0-9_]+)? - capturing group 3: alias (có thể không có)
              // flag gi: ignore case + global (dùng lastIndex để duyệt tiếp)
              // ví dụ: "FROM sme.account_object ao" -> match[1]="sme", match[2]="account_object", match[3]="ao"
              const regex =
                /(?:from|join)\s+([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_]+))?(?:\s+as)?\s+([a-zA-Z0-9_]+)?/gi;
              let match;
              // danh sách keyword SQL để phân biệt với alias (vd: "from" không phải alias)
              const sqlKeywords = [
                "where",
                "join",
                "on",
                "left",
                "right",
                "inner",
                "outer",
                "cross",
                "group",
                "order",
                "having",
                "limit",
                "select",
                "and",
                "or",
              ];

              // vòng lặp dùng exec() với regex flag g:
              // - mỗi lần regex.exec(text) tìm match từ vị trí regex.lastIndex hiện tại
              // - tìm thấy: lastIndex được cập nhật đến cuối match, trả về mảng kết quả
              // - không tìm thấy: reset lastIndex về 0, trả về null => thoát vòng lặp
              // nhờ lastIndex, while này duyệt lần lượt từng FROM/JOIN trong câu SQL
              while ((match = regex.exec(text)) !== null) {
                let schemaOrTable = match[1];
                let tableIfSchema = match[2];
                let aliasOrTable = match[3];

                let schema = "";
                let table = "";
                let alias = "";

                // nếu match[2] tồn tại => dạng "schema.table alias" (vd: sme.account_object ao)
                if (tableIfSchema) {
                  schema = schemaOrTable.toLowerCase();
                  table = tableIfSchema.toLowerCase();
                } else {
                  // nếu chỉ có match[1] => dạng "table alias" (vd: account_object ao)
                  table = schemaOrTable.toLowerCase();
                }

                // nếu match[3] (alias) trùng với keyword SQL (vd: "where", "join", ...)
                // thì coi như không có alias, lấy tên bảng làm alias luôn
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

              // Lấy dòng hiện tại và text trước con trỏ để xác định context
              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforePointer = lineContent.substring(
                0,
                position.column - 1,
              );

              // Kiểm tra xem có dấu chấm trước con trỏ không (vd: "sme.|" hoặc "ao.|")
              const dotMatch = textBeforePointer.match(
                /([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/,
              );

              let suggestions = [];

              // ── TRƯỜNG HỢP 1: CÓ DẤU CHẤM (context: "prefix.") ──────────────
              if (dotMatch) {
                // prefix: tên schema, tên bảng, hoặc alias
                const prefix = dotMatch[1].toLowerCase();
                // typedWord: phần chữ user đã gõ sau dấu chấm (có thể rỗng)
                const typedWord = dotMatch[2];

                // Điều chỉnh range để thay thế cả "prefix.typedWord"
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
                  cols.forEach((c) => {
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
                  cols.forEach((c) => {
                    suggestions.push({
                      ...c,
                      filterText: `${prefix}.${c.label}`,
                      insertText: `${prefix}.${c.insertText}`,
                    });
                  });
                }
                // 1c. Prefix là tên schema -> gợi ý bảng + functions trong schema đó
                //     kèm tự động tạo alias (vd: "sme.account_object ao")
                else if (
                  tablesBySchema.has(prefix) ||
                  functionsBySchema.has(prefix)
                ) {
                  // Gợi ý bảng thuộc schema, kèm alias tự động
                  (tablesBySchema.get(prefix) ?? new Set()).forEach((tbl) => {
                    const alias = me._generateUniqueAlias(
                      tbl,
                      text,
                      me._pgKeywordSet,
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

                  // Gợi ý functions thuộc schema, kèm alias tự động
                  (functionsBySchema.get(prefix) ?? []).forEach((fnItem) => {
                    const alias = me._generateUniqueAlias(
                      fnItem.label,
                      text,
                      me._pgKeywordSet,
                    );
                    suggestions.push({
                      ...fnItem,
                      filterText: `${prefix}.${fnItem.label}`,
                      insertText: alias
                        ? `${fnItem.fullInsertText} ${alias} `
                        : fnItem.fullInsertText,
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                    });
                  });
                }
              }
              // ── TRƯỜNG HỢP 2: KHÔNG CÓ DẤU CHẤM (gõ chay) ──────────────────
              else {
                // Gợi ý keyword PostgreSQL
                suggestions.push(...keywordSuggestions);

                // Gợi ý schema (vd: "sme", "tm", "public")
                allSchemas.forEach((schema) => {
                  suggestions.push({
                    label: schema,
                    kind: monaco.languages.CompletionItemKind.Folder,
                    insertText: schema,
                    detail: "Schema",
                  });
                });

                // Gợi ý bảng, kèm alias tự động (vd: "account_object ao")
                allTables.forEach((tbl) => {
                  const alias = me._generateUniqueAlias(
                    tbl,
                    text,
                    me._pgKeywordSet,
                  );
                  suggestions.push({
                    label: tbl,
                    kind: monaco.languages.CompletionItemKind.Module,
                    insertText: alias ? `${tbl} ${alias} ` : tbl,
                    detail: "Table",
                  });
                });

                // Gợi ý functions, kèm alias tự động
                suggestions.push(
                  ...functionSuggestions.map((fnItem) => {
                    const alias = me._generateUniqueAlias(
                      fnItem.label,
                      text,
                      me._pgKeywordSet,
                    );
                    return alias
                      ? {
                          ...fnItem,
                          insertText: `${fnItem.insertText} ${alias} `,
                        }
                      : fnItem;
                  }),
                );

                // Nếu có alias trong câu SQL, hiển thị alias name và cột của chúng
                if (aliasMap.size > 0) {
                  aliasMap.forEach((mapped, alias) => {
                    // Ưu tiên hiển thị alias name để user gõ alias.column
                    suggestions.push({
                      label: alias,
                      kind: monaco.languages.CompletionItemKind.Variable,
                      insertText: alias,
                      sortText: "0" + alias,
                      detail: mapped.schema
                        ? `${mapped.schema}.${mapped.table}`
                        : mapped.table,
                    });
                    // Hiển thị luôn columns của bảng mà alias trỏ đến
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
                // Nếu không có alias và user đã gõ ít nhất 2 ký tự, gợi ý tất cả cột
                else if (word.word && word.word.length > 1) {
                  suggestions.push(...allColumns);
                }
              }

              // Loại bỏ các suggestion trùng nhau (dựa trên label + kind + insertText)
              const uniqueMap = new Map();
              suggestions.forEach((s) => {
                uniqueMap.set(s.label + s.kind + s.insertText, s);
              });

              // Gán range và insertTextRules cho từng suggestion
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
        //  ĐĂNG KÝ HOVER PROVIDER (hiển thị thông tin object khi di chuột)
        // ═══════════════════════════════════════════════════════════════════════

        // Tra cứu object trong inspectLookup theo tên (có hoặc không schema prefix)
        function findInspectObject(word) {
          if (!me._inspectLookup) return null;
          const w = word.toLowerCase();
          let entry = me._inspectLookup.tables.get(w);
          if (entry) return { ...entry, type: "table" };
          entry = me._inspectLookup.views.get(w);
          if (entry) return { ...entry, type: "view" };
          entry = me._inspectLookup.functions.get(w);
          if (entry) return { ...entry, type: "function" };
          return null;
        }

        const hoverDisposable = monaco.languages.registerHoverProvider(
          "pgsql",
          {
            provideHover: async (model, position) => {
              if (!me.selectedConnectionId || !me._inspectLookup) return null;

              // Lấy từ tại vị trí hover
              const word = model.getWordAtPosition(position);
              if (!word) return null;
              const objectName = word.word.toLowerCase();

              // Kiểm tra phía trước có schema prefix không (vd: "tm.")
              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforeWord = lineContent.substring(
                0,
                word.startColumn - 1,
              );
              const dotMatch = textBeforeWord.match(/([a-zA-Z0-9_]+)\.$/);

              // Nếu có dạng "schema.object" thì tra theo key "schema.object"
              if (dotMatch) {
                const schemaName = dotMatch[1].toLowerCase();
                const key = `${schemaName}.${objectName}`;
                const obj = findInspectObject(key);
                if (!obj) return null;
                return buildHoverContent(obj, objectName);
              }

              // Không có schema prefix, tra theo tên object
              const obj = findInspectObject(objectName);
              if (!obj) return null;
              return buildHoverContent(obj, objectName);
            },
          },
        );
        me.intellisenseDisposable.push(hoverDisposable);

        // Helper: tạo nội dung hover tooltip (hiển thị type, schema, arguments của function)
        function buildHoverContent(obj, name) {
          const typeLabel =
            obj.type === "table"
              ? "TABLE"
              : obj.type === "view"
                ? "VIEW"
                : "FUNCTION";
          const fullName = `${obj.schema}.${obj.name}`;
          let detail = "";
          if (obj.type === "function") {
            detail = `Arguments: ${obj.args}\nReturns: ${obj.returnType}`;
          }

          const contents = [
            { value: `**${typeLabel}** \`${fullName}\``, isTrusted: true },
          ];
          if (detail) {
            contents.push({ value: `\n${detail}`, isTrusted: true });
          }
          contents.push({
            value: `\n\n_${me.$t("i18nCommon.postgreSQLQuery.dbInspect.inspectHint")}_`,
            isTrusted: true,
          });

          return { contents };
        }
      } catch (error) {
        console.error("applyMonacoIntellisense error:", error);
      }
    },

    /**
     * Lấy DDL (câu lệnh CREATE) của một object database
     * bằng cách gọi template SQL tương ứng với type (table/view/function).
     * Dùng cho chức năng Inspect Object (F12).
     */
    async fetchObjectDDL(schema, name, type) {
      if (!this.selectedConnectionId) return "-- No connection selected";
      try {
        let template = "";
        switch (type) {
          case "table":
            template = pgQueries.pg_inspect_ddl_table
              .replace("{schema}", schema)
              .replace("{name}", name);
            break;
          case "view":
            template = pgQueries.pg_inspect_ddl_view
              .replace("{schema}", schema)
              .replace("{name}", name);
            break;
          case "function":
            template = pgQueries.pg_inspect_ddl_function_by_name
              .replace("{schema}", schema)
              .replace("{name}", name);
            break;
        }
        if (!template) return "-- Unknown object type";

        const resp = await this.agentAPI.executeQuery(
          this.selectedConnectionId,
          template,
        );
        const result =
          resp?.data?.data?.results?.[0] || resp?.data?.data || null;

        if (resp?.data?.success && result?.rows?.length > 0) {
          const firstRow = result.rows[0];
          const firstKey = Object.keys(firstRow)[0];
          return firstRow[firstKey] ?? "-- No DDL returned";
        }
        return `-- Object "${schema}.${name}" not found`;
      } catch (e) {
        return `-- Error: ${e.message || "Unknown"}`;
      }
    },

    /**
     * Tạo alias tự động từ tên object (table/view/function) dạng viết tắt chữ cái đầu.
     * Ví dụ: "account_object" -> "ao", "inventory_item" -> "ii".
     * Nếu alias đã tồn tại trong câu SQL hoặc trùng keyword PostgreSQL, tự động thêm số (ao1, ao2...).
     */
    _generateUniqueAlias(objectName, sqlText, keywordSet) {
      // Bỏ qua nếu không có tên object
      if (!objectName) return null;

      // Lấy phần tên cuối cùng (bỏ schema prefix như "sme." nếu có)
      const parts = objectName.split(".");
      const name = parts[parts.length - 1];

      // Tách theo underscore và lấy chữ cái đầu mỗi từ
      const words = name.split("_").filter((w) => w.length > 0);
      if (words.length === 0) return null;

      let alias = words
        .map((w) => w[0])
        .join("")
        .toLowerCase();
      if (!alias) return null;

      // thu thập tất cả tên bảng/alias đã dùng trong FROM/JOIN để kiểm tra trùng lặp
      // regex tương tự như ở completion provider, flag g để duyệt bằng lastIndex
      // (?:from|join)\s+ - khớp từ khóa FROM/JOIN
      // ([a-zA-Z0-9_]+) - group 1: schema hoặc tên bảng
      // (?:\.([a-zA-Z0-9_]+))? - group 2: tên bảng nếu có schema prefix
      // (?:\s+as)? - optional "as"
      // \s+([a-zA-Z0-9_]+)? - group 3: alias (có thể không có)
      const used = new Set();
      const re =
        /(?:from|join)\s+([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_]+))?(?:\s+as)?\s+([a-zA-Z0-9_]+)?/gi;
      let m;
      // duyệt lần lượt từng FROM/JOIN nhờ lastIndex, thu thập tất cả tên đã dùng
      while ((m = re.exec(sqlText)) !== null) {
        if (m[1]) used.add(m[1].toLowerCase());
        if (m[2]) used.add(m[2].toLowerCase());
        if (m[3]) used.add(m[3].toLowerCase());
      }

      // Nếu alias bị trùng thì thêm số đếm (ao1, ao2, ...)
      let finalAlias = alias;
      let counter = 1;
      while (
        used.has(finalAlias) ||
        (keywordSet && keywordSet.has(finalAlias))
      ) {
        counter++;
        finalAlias = alias + counter;
        if (counter > 1000) return alias; // safety: tránh vòng lặp vô hạn
      }

      return finalAlias;
    },
  },
};
