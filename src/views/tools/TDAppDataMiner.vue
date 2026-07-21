<template>
  <div class="flex flex-col td-app-data-miner-container">
    <div class="flex flex td-app-data-miner-group-btn">
      <div class="flex td-app-data-table-select">
        <!-- combo chọn loại dữ liệu -->
        <TDComboBox
          class="td-data-source-combo"
          v-model="dataSourceType"
          :placeHolder="$t('i18nCommon.AppDataMiner.selectDataSource')"
          :options="dataSourceOptions"
          :noMargin="true"
          :usingStylePercent="true"
          @selected="onDataSourceChanged"
        ></TDComboBox>
        <template v-if="isServerAgentMode">
          <div class="flex td-data-btn">
            <TDButton
              @click="handleRunQuery"
              :label="$t('i18nCommon.AppDataMiner.getData')"
              :noMargin="true"
            ></TDButton>
          </div>
        </template>
        <template v-else-if="isClipboardMode">
          <div class="flex td-data-btn">
            <TDButton
              @click="loadClipboardHistory"
              :label="$t('i18nCommon.AppDataMiner.getData')"
              :noMargin="true"
            ></TDButton>
            <TDButton
              @click="deleteClipboardHistory"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.AppDataMiner.deleteClipboard')"
              :noMargin="true"
            ></TDButton>
          </div>
        </template>
      </div>
    </div>
    <div class="flex td-script-query" v-if="isServerAgentMode">
      <TDTextEditor
        ref="sqlEditor"
        v-model="scriptQuery"
        :enableHighlight="true"
        language="sqlite"
        :wrapText="false"
        :placeHolder="$t('i18nCommon.AppDataMiner.queryAgentSQl')"
        :label="$t('i18nCommon.AppDataMiner.queryAgentSQl')"
        :monacoOptions="monacoOptions"
        @keydown.ctrl.enter.prevent="handleRunQuery"
        @keydown.meta.enter.prevent="handleRunQuery"
      ></TDTextEditor>
    </div>
    <div class="td-app-data-viewer">
      <TDTableViewer
        :tableData="currentTableDatas"
        :showIndex="true"
        :showFooter="true"
        :noMargin="true"
        :emptyCellText="'null'"
        :hoverable="false"
        :enableLogCopyData="false"
      >
      </TDTableViewer>
    </div>
  </div>
</template>

<script>
import TDServerAppDataMiner from "@/common/api/request/AgentAPI/TDServerAppDataMiner.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import { SQLITE_KEYWORDS } from "@/components/monarch/sqlite/sqliteKeyword.js";
import {
  registerSqliteLanguage,
  updateSqliteIntellisenseData,
} from "@/components/monarch/sqlite/sqliteLanguage.js";
import { registerSqliteFormatProvider } from "@/components/monarch/sqlite/sqliteFormatProvider.js";

const DATA_SOURCE_TYPE = {
  Clipboard: 1,
  ServerAgent: 2,
};

export default {
  extends: TDToolBase,
  name: "TDAppDataMiner",
  components: {},
  mixins: [],

  data() {
    return {
      agentAPI: null,
      currentTableDatas: [],
      scriptQuery: null,
      dataSourceType: DATA_SOURCE_TYPE.Clipboard,
      dataSourceOptions: [
        {
          value: DATA_SOURCE_TYPE.Clipboard,
          label: this.$t("i18nCommon.AppDataMiner.dataSourceClipboard"),
        },
        {
          value: DATA_SOURCE_TYPE.ServerAgent,
          label: this.$t("i18nCommon.AppDataMiner.dataSourceServerAgent"),
        },
      ],
      allTableColumns: [],
      columnsByTable: new Map(),
      _intellisenseDisposables: null,
      _monacoInstance: null,
    };
  },
  async mounted() {
    this.agentAPI = new TDServerAppDataMiner();
    registerSqliteLanguage();
    this.loadClipboardHistory();
  },
  computed: {
    isServerAgentMode() {
      return this.dataSourceType === DATA_SOURCE_TYPE.ServerAgent;
    },
    isClipboardMode() {
      return this.dataSourceType === DATA_SOURCE_TYPE.Clipboard;
    },
    monacoOptions() {
      let me = this;
      return {
        onInit: (editor, monaco) => {
          me._monacoInstance = monaco;

          editor.addAction({
            id: "execute-sql",
            label: me.$t("i18nCommon.AppDataMiner.getData"),
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.1,
            keybindings: [
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            ],
            run: (ed) => {
              me.scriptQuery = ed.getValue();
              me.$nextTick(() => me.handleRunQuery());
            },
          });

          registerSqliteFormatProvider(monaco);

          if (me.allTableColumns.length > 0) {
            me._registerSqliteProviders(monaco);
          }
        },
      };
    },
  },
  beforeUnmount() {},
  methods: {
    /**
     * Đăng ký intellisense: load schema từ cache, register provider
     */
    registerIntellisense() {
      let me = this;
      me._loadCachedSchema();
    },

    /**
     * Hủy bỏ intellisense providers
     */
    disposeIntellisense() {
      let me = this;
      if (me._intellisenseDisposables) {
        me._intellisenseDisposables.forEach((d) => d?.dispose?.());
        me._intellisenseDisposables = null;
      }
    },

    /**
     * Load schema từ IndexedDB cache
     */
    async _loadCachedSchema() {
      let me = this;
      try {
        let cached = await me.$tdCache.get(
          me.$tdEnum.cacheConfig.AppDataMinerSchema
        );
        if (cached && Array.isArray(cached) && cached.length > 0) {
          me._applySchemaData(cached);
          if (me._monacoInstance) {
            me._registerSqliteProviders(me._monacoInstance);
          }
        }
      } catch (e) {
        // cache chưa có, bỏ qua
      }
    },

    /**
     * Cập nhật allTableColumns và columnsByTable từ raw data
     */
    _applySchemaData(data) {
      let me = this;
      me.allTableColumns = data;
      me.columnsByTable = new Map();
      data.forEach((t) => {
        let tableName = (t.table_name || "").toLowerCase();
        me.columnsByTable.set(tableName, t.columns || []);
      });
      updateSqliteIntellisenseData(data);
    },

    /**
     * Đăng ký completion provider cho sqlite
     */
    _registerSqliteProviders(monaco) {
      let me = this;
      if (me._intellisenseDisposables) {
        me._intellisenseDisposables.forEach((d) => d?.dispose?.());
      }
      me._intellisenseDisposables = [];

      const disposable = monaco.languages.registerCompletionItemProvider(
        "sqlite",
        {
          triggerCharacters: ["."],
          provideCompletionItems: (model, position) => {
            let wordInfo = model.getWordUntilPosition(position);
            let range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordInfo.startColumn,
              endColumn: wordInfo.endColumn,
            };

            const text = model.getValue();
            const aliasMap = new Map();
            const regex =
              /(?:from|join)\s+(\w+)(?:\s+as)?\s+(\w+)?/gi;
            const sqlKeywords = [
              "where", "join", "on", "left", "right", "inner", "outer",
              "cross", "group", "order", "having", "limit", "select",
              "and", "or", "union", "except", "intersect",
            ];
            let match;
            while ((match = regex.exec(text)) !== null) {
              let table = match[1].toLowerCase();
              let alias = match[2] && !sqlKeywords.includes(match[2].toLowerCase())
                ? match[2].toLowerCase()
                : table;
              aliasMap.set(alias, { table });
            }

            let lineContent = model.getLineContent(position.lineNumber);
            let textBeforeCursor = lineContent.substring(0, position.column - 1);
            let dotMatch = textBeforeCursor.match(
              /([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]*)$/,
            );

            let suggestions = [];

            if (dotMatch) {
              let prefix = dotMatch[1].toLowerCase();
              let typedWord = dotMatch[2];
              let totalOffset = prefix.length + 1 + typedWord.length;
              range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - totalOffset,
                endColumn: position.column,
              };

              if (aliasMap.has(prefix)) {
                let mapped = aliasMap.get(prefix);
                let cols = me.columnsByTable.get(mapped.table) || [];
                cols.forEach((col) => {
                  suggestions.push({
                    label: col.name,
                    kind: monaco.languages.CompletionItemKind.Field,
                    detail: col.type || "",
                    filterText: `${prefix}.${col.name}`,
                    insertText: `${prefix}.${col.name}`,
                    range: range,
                  });
                });
              } else if (me.columnsByTable.has(prefix)) {
                let cols = me.columnsByTable.get(prefix) || [];
                cols.forEach((col) => {
                  suggestions.push({
                    label: col.name,
                    kind: monaco.languages.CompletionItemKind.Field,
                    detail: col.type || "",
                    filterText: `${prefix}.${col.name}`,
                    insertText: `${prefix}.${col.name}`,
                    range: range,
                  });
                });
              }
            } else {
              const usedNames = new Set();
              const re =
                /(?:from|join)\s+(\w+)(?:\s+as)?\s+(\w+)?/gi;
              let m;
              while ((m = re.exec(text)) !== null) {
                if (m[1]) usedNames.add(m[1].toLowerCase());
                if (m[2]) usedNames.add(m[2].toLowerCase());
              }

              const genAlias = (name) => {
                if (!name) return null;
                const base = name.split(".").pop();
                const words = base.split("_").filter((w) => w.length > 0);
                if (words.length === 0) return null;
                let alias = words.map((w) => w[0]).join("").toLowerCase();
                if (!alias) return null;
                let finalAlias = alias;
                let counter = 1;
                while (usedNames.has(finalAlias)) {
                  counter++;
                  finalAlias = alias + counter;
                  if (counter > 100) return alias;
                }
                return finalAlias;
              };

              SQLITE_KEYWORDS.forEach((kw) => {
                suggestions.push({
                  label: kw,
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: kw,
                  range: range,
                });
              });

              me.allTableColumns.forEach((t) => {
                const alias = genAlias(t.table_name);
                suggestions.push({
                  label: t.table_name,
                  kind: monaco.languages.CompletionItemKind.Struct,
                  detail: "table",
                  insertText: alias ? `${t.table_name} ${alias} ` : t.table_name,
                  range: range,
                });
              });

              let allColNames = new Set();
              me.allTableColumns.forEach((t) => {
                (t.columns || []).forEach((col) => {
                  if (!allColNames.has(col.name)) {
                    allColNames.add(col.name);
                    suggestions.push({
                      label: col.name,
                      kind: monaco.languages.CompletionItemKind.Field,
                      detail: col.type || "",
                      insertText: col.name,
                      range: range,
                    });
                  }
                });
              });

              aliasMap.forEach((mapped, alias) => {
                let cols = me.columnsByTable.get(mapped.table) || [];
                cols.forEach((col) => {
                  suggestions.push({
                    label: `${alias}.${col.name}`,
                    kind: monaco.languages.CompletionItemKind.Field,
                    detail: col.type || "",
                    filterText: `${alias}.${col.name}`,
                    insertText: `${alias}.${col.name}`,
                    range: range,
                  });
                });
              });
            }

            return { suggestions };
          },
        },
      );
      me._intellisenseDisposables.push(disposable);
    },

    /**
     * Load schema metadata (tables + columns) từ API, lưu cache, áp dụng intellisense
     */
    async loadSchemaMetadata() {
      let me = this;
      try {
        let res = await me.agentAPI.getAllTableAndColumns();
        if (res && res.success && Array.isArray(res.data.data)) {
          me._applySchemaData(res.data.data);
          await me.$tdCache.set(
            me.$tdEnum.cacheConfig.AppDataMinerSchema,
            res.data.data
          );
          if (me._monacoInstance) {
            me._registerSqliteProviders(me._monacoInstance);
          }
        }
      } catch (error) {
        console.error("Lỗi tải schema metadata:", error);
      }
    },

    /**
     * Chạy query SQL (Ctrl+Enter shortcut)
     */
    handleRunQuery() {
      let me = this;
      if (!me.scriptQuery?.trim()) return;
      me.queryDynamicData();
    },

    /**
     * Xử lý khi đổi loại nguồn dữ liệu
     */
    async onDataSourceChanged() {
      let me = this;
      me.currentTableDatas = [];
      me.scriptQuery = null;
      if (me.isClipboardMode) {
        await me.loadClipboardHistory();
      } else {
        await me.loadSchemaMetadata();
      }
    },

    /**
     * Load lịch sử clipboard từ cache
     */
    async loadClipboardHistory() {
      let me = this;
      me.currentTableDatas = [];
      try {
        let history = await me.$tdCache.get(
          me.$tdEnum.cacheConfig.CopyTextHistory
        );
        if (!history) {
          history = [];
        }
        if (typeof history === "string") {
          try {
            history = JSON.parse(history);
          } catch {
            history = [];
          }
        }
        if (Array.isArray(history)) {
          me.currentTableDatas = history.map((text) => ({
            content: text,
          }));
        }
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Lỗi tải lịch sử clipboard:", error);
      }
    },
    async deleteClipboardHistory() {
      let me = this;
      await me.$tdCache.remove(me.$tdEnum.cacheConfig.CopyTextHistory);
      await me.loadClipboardHistory();
    },

    /**
     * Query dữ liệu động
     */
    async queryDynamicData() {
      let me = this;
      if (me.scriptQuery) {
        me.currentTableDatas = [];
        try {
          let param = {
            query_command: me.scriptQuery,
          };
          let res = await me.agentAPI.dataMinerExecuteQuery(param);
          if (
            res &&
            res.success &&
            res.data &&
            Array.isArray(res.data.data) &&
            res.data.data.length > 0
          ) {
            me.currentTableDatas = res.data.data;
          }
        } catch (error) {
          console.error("Lỗi query:", error);
          me.$tdUtility.showErrorNotFoundAgentServer();
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.td-app-data-miner-container {
  width: 100%;
  height: 100%;
  gap: var(--padding);
  .td-script-query {
    width: 100%;
    height: 200px;
  }
  .td-app-data-miner-group-btn {
    justify-content: space-between;
    width: 100%;
    gap: var(--padding);
    .td-app-data-table-select {
      justify-content: flex-start;
      width: 100%;
      gap: var(--padding);
      .td-data-source-combo {
        width: 200px;
      }
      .td-data-btn {
        flex: 1;
        justify-content: flex-start;
        gap: var(--padding);
      }
    }
  }
  .td-app-data-viewer {
    flex: 1;
    width: 100%;
    min-height: 0;
    box-sizing: border-box;
  }
}
</style>
