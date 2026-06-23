// file này tách ra chỉ để dễ đọc code, không nhúng vào file nào khác ngoài tool src/views/tools/PostgreSQLQuery/TDPostgreSQLQuery.vue
import TDCache from "@/common/cache/TDCache.js";
import pgQueries from "./templates.js";

export default {
  methods: {
    async handleLoadIntellisense() {
      let me = this;
      if (!me.selectedConnectionId) return;
      me.isLoadingIntellisense = true;
      try {
        // Xóa cache cũ
        const cacheKey = me.$tdEnum.cacheConfig.PostgreSQLQueryHistory;
        await TDCache.remove(cacheKey, { id: me.selectedConnectionId });

        // Số lượng dòng tải mỗi lần
        let defaultQueryLimit = 5000;
        // có limit kết quả ở backend không, đặt thế này để tương thích với executeQuery trong TDPosgreSQLQuery
        let limitResults = false;

        // Lấy keywords
        let keywordResponse = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          pgQueries.pg_get_keywords,
          defaultQueryLimit,
          !limitResults,
        );

        // Gọi SQL đếm tổng số dòng
        let countResponse = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          pgQueries.pg_get_tables_count,
          defaultQueryLimit,
          !limitResults,
        );

        let totalRows = 0;
        const countResult =
          countResponse?.data?.data?.results?.[0] ||
          countResponse?.data?.data ||
          null;

        if (countResponse?.data?.success && countResult?.rows?.length > 0) {
          totalRows = parseInt(countResult.rows[0].total || 0, 10);
        }

        // Chạy vòng lặp FOR gối đầu để kéo dữ liệu về thông qua SQL Paging
        let allTableRows = [];

        for (let offset = 0; offset < totalRows; offset += defaultQueryLimit) {
          // Nối thêm điều kiện LIMIT OFFSET vào câu SQL Paging mẫu
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

          if (pagingResponse?.data?.success && pagingResult?.rows) {
            allTableRows.push(...pagingResult.rows);
          } else {
            console.error(
              `Gặp lỗi khi tải dữ liệu tại vị trí dòng (offset): ${offset}`,
            );
            break;
          }
        }

        // Đóng gói lại đúng cấu trúc ban đầu để cấp phát cho Monaco Editor
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

        let keywordResult =
          keywordResponse?.data?.data?.results?.[0] ||
          keywordResponse?.data?.data ||
          null;

        let keywordsResult = keywordResponse?.data?.success
          ? keywordResult
          : null;

        // Load functions (count → paging) — chỉ thực hiện khi bật tùy chọn
        let allFunctionRows = [];
        if (me.currentConfigLayout.loadFunctionIntellisense) {
          try {
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

        // Đóng gói lại đúng cấu trúc để cấp phát cho Monaco Editor
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

        let intellisenseData = {
          keywords: keywordsResult,
          tables: tablesResult,
          functions: functionsResult,
        };

        // Lưu vào IndexedDB và áp dụng Intellisense
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
     * Tải intellisense từ cache (nếu có) và áp dụng vào Monaco
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
     * Áp dụng completion providers vào Monaco Editor cho pgsql (DBeaver-like)
     */
    async applyMonacoIntellisense(data) {
      let me = this;
      try {
        // Cleanup providers cũ
        if (me.intellisenseDisposable) {
          me.intellisenseDisposable.forEach((d) => d?.dispose?.());
        }

        // Lazy-load monaco
        const monaco = await import("monaco-editor");

        // Keywords
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

        // Xây dựng bản đồ lookup
        const tableRows = data?.tables?.rows ?? [];
        const columnsByTable = new Map();
        const tablesBySchema = new Map();
        const allSchemas = new Set();
        const allTables = new Set();
        const allColumns = [];

        tableRows.forEach((row) => {
          const tbl = row.table_name;
          const schema = row.table_schema;
          const col = row.column_name;
          const dtype = row.data_type;

          allSchemas.add(schema);
          allTables.add(tbl);

          if (!tablesBySchema.has(schema))
            tablesBySchema.set(schema, new Set());
          tablesBySchema.get(schema).add(tbl);

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

        // ── Build inspect lookup ──────────────────────────────────────────────
        me._inspectLookup = {
          tables: new Map(),
          views: new Map(),
          functions: new Map(),
        };

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

        // ── Functions ─────────────────────────────────────────────────────────
        function parseFunctionArgs(argsStr) {
          if (!argsStr || !argsStr.trim()) return [];
          return argsStr.split(",").map((segment) => {
            const parts = segment.trim().split(/\s+/);
            const name = parts.length >= 2 ? parts[0] : null;
            const type =
              parts.length >= 2 ? parts.slice(1).join(" ") : parts[0];
            return { name: name || null, type: type || "" };
          });
        }

        function buildFunctionCallSnippet(fnName, argsStr) {
          const args = parseFunctionArgs(argsStr);
          if (args.length === 0) {
            return `${fnName}()`;
          }
          let tabStop = 1;
          const paramLines = args.map((arg) => {
            const ts = tabStop++;
            if (arg.name) {
              return `  ${arg.name} => \${${ts}:'value'}::${arg.type}`;
            }
            return `  \${${ts}:'value'}::${arg.type}`;
          });
          return `${fnName}(\n` + paramLines.join(",\n") + `\n)`;
        }

        function buildFunctionCallSnippetWithSchema(schema, fnName, argsStr) {
          const args = parseFunctionArgs(argsStr);
          if (args.length === 0) {
            return `${schema}.${fnName}()`;
          }
          let tabStop = 1;
          const paramLines = args.map((arg) => {
            const ts = tabStop++;
            if (arg.name) {
              return `  ${arg.name} => \${${ts}:'value'}::${arg.type}`;
            }
            return `  \${${ts}:'value'}::${arg.type}`;
          });
          return `${schema}.${fnName}(\n` + paramLines.join(",\n") + `\n)`;
        }

        const functionRows = data?.functions?.rows ?? [];
        const functionSuggestions = [];
        const functionsBySchema = new Map();

        functionRows.forEach((row) => {
          const schema = row.function_schema;
          const fnName = row.function_name;
          const argsStr = row.function_arguments || "";
          const returnType = row.return_type || "";

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

        // Add functions to inspect lookup
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

        // Đăng ký completion provider
        const disposable = monaco.languages.registerCompletionItemProvider(
          "pgsql",
          {
            triggerCharacters: ["."],
            provideCompletionItems(model, position) {
              const word = model.getWordUntilPosition(position);

              // Mặc định ban đầu
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

              // Regex bóc tách chính xác tên_schema và cụm text đang gõ dở phía sau dấu chấm
              const dotMatch = textBeforePointer.match(
                /([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/,
              );

              let suggestions = [];

              if (dotMatch) {
                const prefix = dotMatch[1].toLowerCase(); // Ví dụ: "td"
                const typedWord = dotMatch[2]; // Phần chữ đã gõ sau dấu chấm, ví dụ: "fn_cre" hoặc rỗng ""

                const totalOffset = prefix.length + 1 + typedWord.length;
                range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column - totalOffset,
                  endColumn: position.column,
                };

                // 1. Prefix là alias -> gợi ý cột
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
                      filterText: `${prefix}.${c.label}`, // Đặt filter khớp với text trên editor
                      insertText: `${prefix}.${c.insertText}`,
                    });
                  });
                }
                // 2. Prefix là tên bảng -> gợi ý cột
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
                // 3. Prefix là tên schema -> gợi ý bảng + functions
                else if (
                  tablesBySchema.has(prefix) ||
                  functionsBySchema.has(prefix)
                ) {
                  // Bảng
                  (tablesBySchema.get(prefix) ?? new Set()).forEach((tbl) => {
                    suggestions.push({
                      label: tbl,
                      kind: monaco.languages.CompletionItemKind.Module,
                      filterText: `${prefix}.${tbl}`,
                      insertText: `${prefix}.${tbl}`,
                      detail: `Table (${prefix})`,
                    });
                  });

                  // Functions
                  (functionsBySchema.get(prefix) ?? []).forEach((fnItem) => {
                    suggestions.push({
                      ...fnItem,
                      // QUAN TRỌNG: filterText phải bao gồm cả schema prefix để Monaco so khớp được chuỗi "td.fn_create_user"
                      filterText: `${prefix}.${fnItem.label}`,
                      insertText: fnItem.fullInsertText, // Thay thế trọn gói bằng snippet kèm schema
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                    });
                  });
                }
              } else {
                // Đang gõ chay (không có chấm)
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
                  suggestions.push({
                    label: tbl,
                    kind: monaco.languages.CompletionItemKind.Module,
                    insertText: tbl,
                    detail: "Table",
                  });
                });

                suggestions.push(...functionSuggestions);

                if (aliasMap.size > 0) {
                  aliasMap.forEach((mapped) => {
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
                        sortText: "0" + c.label,
                      });
                    });
                  });
                } else if (word.word && word.word.length > 1) {
                  suggestions.push(...allColumns);
                }
              }

              // Khử trùng lặp danh sách gợi ý
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

        // ── Register hover provider ────────────────────────────────────────────
        function findInspectObject(word) {
          if (!me._inspectLookup) return null;
          const w = word.toLowerCase();
          // Check tables
          let entry = me._inspectLookup.tables.get(w);
          if (entry) return { ...entry, type: "table" };
          // Check views
          entry = me._inspectLookup.views.get(w);
          if (entry) return { ...entry, type: "view" };
          // Check functions
          entry = me._inspectLookup.functions.get(w);
          if (entry) return { ...entry, type: "function" };
          return null;
        }

        const hoverDisposable = monaco.languages.registerHoverProvider(
          "pgsql",
          {
            provideHover: async (model, position) => {
              if (!me.selectedConnectionId || !me._inspectLookup) return null;

              // Lấy full word tại vị trí hover (vd: "sample_data")
              const word = model.getWordAtPosition(position);
              if (!word) return null;
              const objectName = word.word.toLowerCase();

              // Kiểm tra phía trước word có schema prefix không (vd: "tm.")
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

              // Bare word, không có schema prefix
              const obj = findInspectObject(objectName);
              if (!obj) return null;
              return buildHoverContent(obj, objectName);
            },
          },
        );
        me.intellisenseDisposable.push(hoverDisposable);

        // Helper build nội dung hover
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
     * Fetch DDL của object từ database
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
  },
};
