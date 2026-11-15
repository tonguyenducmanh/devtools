<template>
  <!-- container chính: chia làm 2 phần (main + sidebar) -->
  <div class="flex tm-pg-query-container" v-click-outside="closeFlyout">
    <div class="flex flex-col tm-pg-query-main">
      <!-- header toolbar: menu flyout ở trái, nút Run Query ở phải -->
      <div class="flex flex-start tm-tool-header-menu-group">
        <div class="flex flex-one flex-wrap tm-header-menu-group">
          <!-- từng menu item -->
          <div
            v-for="(items, menuKey) in menuConfig"
            :key="menuKey"
            class="tm-menu-item"
            :class="{ 'tm-menu-item--active': activeKeyFlyOut === menuKey }"
            @click="openFlyout(menuKey, $event)"
            @mouseleave="scheduleCloseFlyout()"
          >
            <span>{{ $t(`i18nCommon.duckDBQuery.${menuKey}`) }}</span>
          </div>
        </div>
        <!-- nút chạy query -->
        <TMButton
          :noMargin="true"
          @click="handleRunQuery"
          iconClass="tm-send-icon"
          :isSmallButton="true"
          v-tooltip="$t('i18nCommon.duckDBQuery.runQuery')"
        ></TMButton>
        <!-- flyout panel chứa danh sách action theo menu đang active -->
        <TMFlyoutPanel
          :show="!!activeKeyFlyOut"
          :anchorElFlyout="anchorElFlyout"
          placement="bottom"
          panel-class="tm-query-action-flyout"
          @mouseenter="cancelCloseFlyOut"
          @mouseleave="scheduleCloseFlyout()"
        >
          <div
            v-for="action in currentMenuItems"
            :key="action.key"
            class="tm-flyout-item"
            :class="{ 'tm-toolbar-btn-disabled': action.disabled }"
            v-tooltip="action.tooltip"
            @click="onActionClick(action)"
          >
            <span>{{ action.label }}</span>
          </div>
        </TMFlyoutPanel>
      </div>

      <!-- editor SQL Monaco (chiếm phần trên, có thể kéo resize) -->
      <div
        class="flex flex-one tm-pg-query-editor"
        :style="editorSectionSizeStyle"
      >
        <TMTextEditor
          ref="sqlEditor"
          v-model="sqlText"
          language="sql"
          :enableHighlight="true"
          :placeHolder="$t('i18nCommon.duckDBQuery.sqlEditorPlaceholder')"
          :label="$t('i18nCommon.duckDBQuery.sqlEditorLabel')"
          :isLabelTop="true"
          height="100%"
          width="100%"
          :monacoOptions="monacoOptions"
          @keydown.ctrl.enter.prevent="handleRunQuery"
          @keydown.meta.enter.prevent="handleRunQuery"
          :showCursorTextFooter="true"
        >
        </TMTextEditor>
      </div>

      <!-- thanh kéo resize phân cách editor và result -->
      <TMResizer :direction="'vertical'" @resize="handleResize" />

      <!-- khu vực hiển thị kết quả query (chiếm phần dưới) -->
      <div class="tm-pg-query-result" :style="resultSectionSizeStyle">
        <!-- loading spinner khi đang chạy query -->
        <div class="flex tm-pg-result-loading" v-if="isRunning">
          <TMLoading />
        </div>

        <template v-else>
          <!-- hiển thị lỗi nếu có -->
          <div class="tm-pg-result-error" v-if="queryError">
            {{ queryError }}
          </div>
          <!-- màn hình chờ nếu chưa có kết quả -->
          <div class="tm-pg-result-empty" v-else-if="!hasQueryResults">
            <TMDynamicBackgroundEffect />
          </div>
          <!-- kết quả query (list danh sách bên trái + preview bên phải) -->
          <div v-else class="flex tm-pg-result-body">
            <!-- danh sách toàn bộ kết quả (virtual scroll, hiển thị khi có nhiều câu lệnh) -->
            <div
              class="flex tm-pg-result-tabs-wrap"
              v-if="hasMultipleResultStatement"
              :style="resultListWidthStyle"
            >
              <div class="flex tm-pg-result-tabs">
                <TMVirtualScroll
                  :items="queryResults"
                  :itemHeight="20"
                  :gap="6"
                  :bufferSize="3"
                >
                  <template #default="{ item, index }">
                    <div
                      class="text-nowrap tm-pg-result-tab-item"
                      :class="{
                        'tm-pg-result-tab-item-active':
                          activeResultIndex === index,
                      }"
                      v-tooltip="getResultTabLabel(item, index)"
                      @click="activateResultTab(index)"
                    >
                      {{ getResultTabLabel(item, index) }}
                    </div>
                  </template>
                </TMVirtualScroll>
              </div>
            </div>
            <div class="flex flex-col flex-one tm-pg-result-content">
              <!-- bảng hiển thị dữ liệu SELECT -->
              <div
                v-if="activeQueryResult && activeQueryResult.is_select"
                class="tm-pg-result-table"
              >
                <KeepAlive>
                  <TMTableViewer
                    :key="activeResultCacheKey"
                    :tableData="activeQueryResult.rows"
                    :columns="activeTableColumns"
                    :noMargin="true"
                    :stickyHeader="true"
                    :showIndex="true"
                    :usingFooterHelp="true"
                    :showFooter="true"
                    maxHeight="100%"
                  />
                </KeepAlive>
              </div>
              <!-- hiển thị số dòng bị ảnh hưởng (INSERT/UPDATE/DELETE/CREATE) -->
              <div
                v-if="activeQueryResult && !activeQueryResult.is_select"
                class="flex tm-pg-result-affected"
              >
                <TMDynamicBackgroundEffect />
                <span class="tm-effected-text">
                  {{ $t("i18nCommon.duckDBQuery.rowsAffected") }}:
                  {{ activeQueryResult.rows_affected || 0 }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- sidebar phải: Help / Setting / Files / SQL Save -->
    <TMSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <!-- thanh menu trên sidebar -->
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
            :showIcon="true"
            v-if="sidebarOptions && sidebarOptions.length > 1"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>

      <template v-slot:main>
        <!-- tab Help -->
        <div
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tmEnum.DuckDBQuerySidebarOption.Help
          "
        >
          <TMDuckDBQueryHelp />
        </div>

        <!-- tab Setting -->
        <div
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tmEnum.DuckDBQuerySidebarOption.Setting
          "
        >
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.autoSaveQueryAfterExec"
            :label="$t('i18nCommon.duckDBQuery.autoSaveQueryAfterExec')"
            @change="updateConfigLayout"
          />
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.limitResults"
            :label="$t('i18nCommon.duckDBQuery.limitResults')"
            v-tooltip="$t('i18nCommon.duckDBQuery.limitResultsDesc')"
            @change="updateConfigLayout"
          />
          <div
            class="tm-query-config"
            v-show="currentConfigLayout.limitResults"
          >
            <TMInput
              :noMargin="true"
              inputType="number"
              :modelValue="currentConfigLayout.defaultQueryLimit"
              :label="$t('i18nCommon.duckDBQuery.defaultQueryLimit')"
              :isLabelTop="false"
              v-tooltip="$t('i18nCommon.duckDBQuery.defaultQueryLimitDesc')"
              @update:modelValue="
                (v) => {
                  currentConfigLayout.defaultQueryLimit = Number(v);
                  updateConfigLayout();
                }
              "
            />
          </div>
          <!-- Session info -->
          <div class="tm-duckdb-session-info">
            <div class="tm-session-label">
              {{ $t("i18nCommon.duckDBQuery.sessionLabel") }}
            </div>
            <div class="tm-session-id" v-tooltip="currentSessionId">
              {{ currentSessionIdShort }}
            </div>
          </div>
        </div>

        <!-- tab Files: upload + danh sách bảng đã nạp -->
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tmEnum.DuckDBQuerySidebarOption.Files
          "
        >
          <!-- khu vực upload file: hover để xem định dạng hỗ trợ, click hoặc kéo thả để nạp -->
          <div
            class="tm-duckdb-upload-area"
            :class="{ 'tm-duckdb-upload-area--busy': isUploading }"
            v-tooltip="{ text: uploadTooltipText, maxWidth: '320px' }"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInput"
              type="file"
              class="tm-duckdb-file-input"
              accept=".xlsx,.xls,.csv,.tsv,.parquet,.json,.ndjson,.jsonl"
              @change="handleFileSelect"
            />
            <span class="tm-duckdb-upload-icon-wrap">
              <span class="tm-icon tm-upload-icon"></span>
            </span>
          </div>

          <!-- loading khi upload -->
          <div
            class="flex flex-col tm-duckdb-upload-loading"
            v-if="isUploading"
          >
            <TMLoading />
            <span class="tm-duckdb-uploading-text">{{
              $t("i18nCommon.duckDBQuery.uploadingFile")
            }}</span>
          </div>

          <!-- danh sách file đã nạp: tên file / tên bảng / số dòng / nút xoá -->
          <div class="tm-duckdb-file-list" v-if="loadedFiles.length > 0">
            <div class="flex tm-duckdb-file-list-header">
              <span class="tm-duckdb-file-list-title">{{
                $t("i18nCommon.duckDBQuery.uploadedFiles")
              }}</span>
              <span class="tm-duckdb-file-list-count">{{
                loadedFiles.length
              }}</span>
            </div>
            <div
              v-for="file in loadedFiles"
              :key="file.file_id"
              class="tm-duckdb-file-item"
            >
              <div class="tm-duckdb-file-item-info">
                <div
                  class="text-nowrap tm-duckdb-file-name"
                  v-tooltip="file.file_name"
                >
                  {{ file.file_name }}
                </div>
                <div class="tm-duckdb-file-table">
                  <span
                    class="text-nowrap tm-table-badge"
                    v-tooltip="file.table_name"
                    >{{ file.table_name }}</span
                  >
                </div>
                <div class="tm-duckdb-file-rows">
                  {{ formatRowCount(file.row_count) }}
                  {{ $t("i18nCommon.duckDBQuery.rowCount") }}
                </div>
              </div>
              <TMButton
                class="tm-duckdb-file-delete"
                :noMargin="true"
                :isSmallButton="true"
                :type="$tmEnum.buttonType.secondary"
                iconClass="tm-close-icon"
                v-tooltip="$t('i18nCommon.duckDBQuery.dropFile')"
                @click.stop="handleDropFile(file)"
              />
            </div>
          </div>

          <!-- empty state khi chưa có file -->
          <div class="tm-duckdb-no-files" v-else-if="!isUploading">
            <span class="tm-duckdb-no-files-title">{{
              $t("i18nCommon.duckDBQuery.noFilesLoaded")
            }}</span>
            <span class="tm-duckdb-no-files-desc">{{
              $t("i18nCommon.duckDBQuery.noFilesLoadedDesc")
            }}</span>
          </div>
        </div>

        <!-- tab SQL Save: danh sách query đã lưu -->
        <div
          class="tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tmEnum.DuckDBQuerySidebarOption.SQLSave
          "
        >
          <TMHistorySidebar
            ref="savedQueryHistory"
            :applyFunction="applySavedQueryFromHistory"
            titleKey="query_name"
            :noMargin="true"
            :positionRelative="false"
            :cacheKey="$tmEnum.cacheConfig.DuckDBQuerySavedQuery"
            :historyContainerStyleEnum="
              $tmEnum.AbsolutePositionStyle.Top100Left
            "
          />
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import { format as sqlFormat } from "sql-formatter";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMDuckDBQueryHelp from "@/views/helps/TMDuckDBQueryHelp.vue";
import TMServerDuckDBAPI from "@/common/api/request/AgentAPI/TMServerDuckDBAPI.js";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import TMDynamicBackgroundEffect from "@/views/backgroundEffect/TMDynamicBackgroundEffect.vue";
import TMFlyoutPanel from "@/components/TMFlyoutPanel.vue";
import { useFlyout } from "@/common/plugin/TMUseFlyout.js";

export default {
  extends: TMToolBase,
  name: "TMDuckDBQuery",
  components: {
    TMSubSidebar,
    TMDuckDBQueryHelp,
    TMHistorySidebar,
    TMDynamicBackgroundEffect,
    TMFlyoutPanel,
  },

  setup() {
    return { ...useFlyout() };
  },

  data() {
    return {
      /**
       * Key dùng để cache layout config vào IndexedDB
       */
      keyCacheLayout: this.$tmEnum.cacheConfig.DuckDBQueryConfigLayout,

      /**
       * Cấu hình layout mặc định của tool
       */
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.DuckDBQuerySidebarOption.Files,
        autoSaveQueryAfterExec: true,
        defaultQueryLimit: 1000,
        limitResults: true,
        limitResultsBackup: 1000,
      },

      /**
       * Kích thước editor/result (chia theo %)
       */
      editorSectionSize: 50,
      resultSectionSize: 50,

      // ── Editor ───────────────────────────────────────────────────
      sqlText: "",

      // ── Results ──────────────────────────────────────────────────
      queryResults: [],
      activeResultIndex: 0,
      queryError: null,
      isRunning: false,

      // ── Upload ───────────────────────────────────────────────────
      isUploading: false,
      loadedFiles: [], // [{ file_id, file_name, table_name }]

      // ── Session ──────────────────────────────────────────────────
      currentSessionId: "",

      // ── API ──────────────────────────────────────────────────────
      agentAPI: null,

      // auto-save tracking
      lastAutoSavedQueryText: "",
    };
  },

  async mounted() {
    let me = this;
    me.agentAPI = new TMServerDuckDBAPI();
    // Khôi phục hoặc tạo mới session id
    await me.initSession();
    // Reload danh sách file đã nạp từ server
    await me.reloadSessionFiles();
  },

  computed: {
    /**
     * Cấu hình menu flyout ở header tool
     */
    menuConfig() {
      let me = this;
      return {
        // Nhóm Edit: format SQL, gen UUID, lưu query, session mới
        edit: [
          {
            key: "formatCode",
            label: me.$t("i18nCommon.duckDBQuery.formatCode"),
            disabled: false,
            run: me.handleFormatSQL,
          },
          {
            key: "saveQuery",
            label: me.$t("i18nCommon.duckDBQuery.saveQuery"),
            disabled: false,
            run: me.saveCurrentQuery,
          },
          {
            key: "newSession",
            label: me.$t("i18nCommon.duckDBQuery.newSession"),
            disabled: false,
            run: me.handleNewSession,
          },
        ],
        // Nhóm Export: copy/download kết quả
        export: [
          {
            key: "copyResult",
            label: me.$t("i18nCommon.duckDBQuery.copyResult"),
            disabled: !me.canExportActiveResult,
            run: me.handleCopyResult,
          },
          {
            key: "downloadResult",
            label: me.$t("i18nCommon.duckDBQuery.downloadResult"),
            disabled: !me.canExportActiveResult,
            run: me.handleDownloadResult,
          },
        ],
        // Nhóm Run
        runQuery: [
          {
            key: "runQuery",
            label: me.$t("i18nCommon.duckDBQuery.runQuery"),
            disabled: me.isRunning,
            run: me.handleRunQuery,
          },
        ],
      };
    },

    /**
     * Lấy danh sách menu items của flyout đang mở
     */
    currentMenuItems() {
      return this.menuConfig[this.activeKeyFlyOut] ?? [];
    },

    hasMultipleResultStatement() {
      return this.queryResults && this.queryResults.length > 1;
    },

    resultListWidthStyle() {
      let maxLen = (this.queryResults || []).reduce((max, item, index) => {
        return Math.max(
          max,
          (this.getResultTabLabel(item, index) || "").length,
        );
      }, 1);
      return { width: Math.min(Math.max(maxLen * 7.5 + 28, 90), 340) + "px" };
    },

    monacoOptions() {
      let me = this;
      return {
        onInit: (editor, monacoInstance) => {
          editor.addAction({
            id: "execute-duckdb-sql",
            label: me.$t("i18nCommon.duckDBQuery.runQuery"),
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.1,
            keybindings: [
              monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
            ],
            run: () => {
              me.endEditFromEditor(editor, me.handleRunQuery);
            },
          });
        },
      };
    },

    sidebarOptions() {
      return [
        {
          value: this.$tmEnum.DuckDBQuerySidebarOption.Help,
          label: this.$t("i18nCommon.duckDBQuery.sidebarOption.help"),
          icon: "tm-help-icon",
        },
        {
          value: this.$tmEnum.DuckDBQuerySidebarOption.Setting,
          label: this.$t("i18nCommon.duckDBQuery.sidebarOption.setting"),
          icon: "tm-setting-icon",
        },
        {
          value: this.$tmEnum.DuckDBQuerySidebarOption.Files,
          label: this.$t("i18nCommon.duckDBQuery.sidebarOption.files"),
          icon: "tm-database-icon",
        },
        {
          value: this.$tmEnum.DuckDBQuerySidebarOption.SQLSave,
          label: this.$t("i18nCommon.duckDBQuery.sidebarOption.sqlSave"),
          icon: "tm-folder-icon",
        },
      ];
    },

    resultSectionSizeStyle() {
      return { height: `${this.resultSectionSize}%` };
    },

    editorSectionSizeStyle() {
      return { height: `${this.editorSectionSize}%` };
    },

    hasQueryResults() {
      return Array.isArray(this.queryResults) && this.queryResults.length > 0;
    },

    activeQueryResult() {
      if (!this.hasQueryResults) return null;
      return this.queryResults[this.activeResultIndex] ?? null;
    },

    activeTableColumns() {
      let result = this.activeQueryResult;
      if (!result?.columns?.length) return null;
      return result.columns.map((col) => ({
        key: col,
        label: col,
        sortable: true,
        autoWidth: true,
        title: col,
      }));
    },

    canExportActiveResult() {
      return !!(
        this.activeQueryResult &&
        this.activeQueryResult.is_select &&
        this.activeQueryResult.rows &&
        this.activeQueryResult.rows.length > 0
      );
    },

    activeResultCacheKey() {
      if (!this.activeQueryResult) return "duckdb-result-empty";
      return `duckdb-result-${this.activeResultIndex}-${this.activeQueryResult.is_select ? "select" : "command"}`;
    },

    /**
     * Hiển thị rút gọn session id (8 ký tự đầu)
     */
    currentSessionIdShort() {
      if (!this.currentSessionId) return "-";
      return this.currentSessionId.substring(0, 8) + "...";
    },

    /**
     * Nội dung tooltip của vùng upload: nêu rõ mọi định dạng được hỗ trợ.
     * Dùng computed để tự cập nhật khi đổi ngôn ngữ.
     */
    uploadTooltipText() {
      return this.$t("i18nCommon.duckDBQuery.uploadTooltip");
    },
  },

  methods: {
    /**
     * Khi click item trong flyout: bỏ qua nếu disabled, chạy action rồi đóng flyout
     */
    onActionClick(action) {
      if (action.disabled) return;
      action.run();
      this.closeFlyout();
    },

    /**
     * Xử lý kéo thay đổi kích thước editor/result
     */
    handleResize(sizes) {
      this.editorSectionSize = sizes.leftSize;
      this.resultSectionSize = sizes.rightSize;
    },

    /**
     * Chuẩn hoá cấu trúc result từ backend
     */
    normalizeSingleResult(result) {
      if (!result) return null;
      return {
        columns: Array.isArray(result.columns) ? result.columns : [],
        table_names: Array.isArray(result.table_names)
          ? result.table_names
          : [],
        rows: Array.isArray(result.rows) ? result.rows : [],
        rows_affected: Number(result.rows_affected || 0),
        is_select: !!result.is_select,
      };
    },

    normalizeMultiQueryResult(payload) {
      if (payload && Array.isArray(payload.results)) {
        return payload.results
          .map((item) => this.normalizeSingleResult(item))
          .filter(Boolean);
      }
      if (payload && typeof payload === "object") {
        let one = this.normalizeSingleResult(payload);
        return one ? [one] : [];
      }
      return [];
    },

    activateResultTab(index) {
      if (index < 0 || index >= this.queryResults.length) return;
      this.activeResultIndex = index;
    },

    getResultTabLabel(result, index) {
      try {
        if (!result) return `${index + 1} result`;
        if (result.is_select) {
          return `${index + 1} select`;
        }
        return `${index + 1} command`;
      } catch {
        return `${index + 1}`;
      }
    },

    resetQueryResults() {
      this.queryResults = [];
      this.activeResultIndex = 0;
      this.queryError = null;
    },

    /**
     * Khởi tạo hoặc khôi phục session DuckDB
     */
    async initSession() {
      let me = this;
      let cached = await me.$tmCache.get(
        me.$tmEnum.cacheConfig.DuckDBSessionId,
      );
      if (cached) {
        me.currentSessionId = cached;
      } else {
        me.currentSessionId = me.$tmUtility.newGuid();
        await me.$tmCache.set(
          me.$tmEnum.cacheConfig.DuckDBSessionId,
          me.currentSessionId,
        );
      }
    },

    /**
     * Reload danh sách file từ server
     */
    async reloadSessionFiles() {
      let me = this;
      if (!me.currentSessionId) return;
      try {
        let resp = await me.agentAPI.getSessionFiles(me.currentSessionId);
        if (resp?.data?.success) {
          me.loadedFiles = resp.data.data || [];
        }
      } catch {
        // Lần đầu chạy, session chưa có file nào — ignore
      }
    },

    /**
     * Chạy query SQL trên DuckDB session
     */
    async handleRunQuery() {
      let me = this;
      if (!me.sqlText?.trim()) {
        me.$tmToast.warning(me.$t("i18nCommon.duckDBQuery.noQueryToRun"));
        return;
      }

      me.isRunning = true;
      me.resetQueryResults();

      try {
        let response = await me.agentAPI.executeQuery(
          me.currentSessionId,
          me.sqlText,
          me.currentConfigLayout.defaultQueryLimit,
          !me.currentConfigLayout.limitResults,
        );

        let normalizedResults = me.normalizeMultiQueryResult(
          response?.data?.data,
        );
        me.queryResults = normalizedResults;
        me.activeResultIndex = 0;

        if (!response?.data?.success) {
          me.resetQueryResults();
          me.queryError =
            response?.data?.message ?? me.$t("i18nCommon.toastMessage.error");
        }
      } catch (error) {
        me.resetQueryResults();
        me.queryError =
          error?.message ?? me.$t("i18nCommon.toastMessage.error");
      } finally {
        me.isRunning = false;
        // Auto-save query
        if (me.currentConfigLayout.autoSaveQueryAfterExec) {
          if (me.sqlText !== me.lastAutoSavedQueryText) {
            me.lastAutoSavedQueryText = me.sqlText;
            me.saveCurrentQuery();
          }
        }
      }
    },

    /**
     * Trigger click vào input file ẩn
     */
    triggerFileInput() {
      // Đang nạp file thì bỏ qua, tránh mở hộp chọn file chồng lên tiến trình hiện tại
      if (this.isUploading) return;
      this.$refs.fileInput?.click();
    },

    /**
     * Format số dòng cho dễ đọc (1.234.567) — "-" khi backend cũ chưa trả về
     */
    formatRowCount(rowCount) {
      if (rowCount === null || rowCount === undefined || rowCount === "") {
        return "-";
      }
      let value = Number(rowCount);
      if (Number.isNaN(value)) return "-";
      return value.toLocaleString();
    },

    /**
     * Xử lý chọn file từ input
     */
    handleFileSelect(event) {
      let file = event.target.files?.[0];
      if (file) this.uploadFile(file);
      // Reset input để có thể chọn lại cùng file
      event.target.value = "";
    },

    /**
     * Xử lý kéo thả file vào upload area
     */
    handleFileDrop(event) {
      let file = event.dataTransfer.files?.[0];
      if (file) this.uploadFile(file);
    },

    /**
     * Upload file lên backend và nạp vào DuckDB session
     */
    async uploadFile(file) {
      let me = this;
      let supportedExts = [
        ".xlsx",
        ".xls",
        ".csv",
        ".tsv",
        ".parquet",
        ".json",
        ".ndjson",
        ".jsonl",
      ];
      let ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!supportedExts.includes(ext)) {
        me.$tmToast.warning(me.$t("i18nCommon.duckDBQuery.supportedFormats"));
        return;
      }

      me.isUploading = true;
      try {
        let resp = await me.agentAPI.uploadFile(me.currentSessionId, file);
        if (resp?.data?.success) {
          let info = resp.data.data;
          // Thêm vào danh sách hoặc cập nhật nếu trùng file_id
          let existingIdx = me.loadedFiles.findIndex(
            (f) => f.file_id === info.file_id,
          );
          if (existingIdx >= 0) {
            me.loadedFiles[existingIdx] = info;
          } else {
            me.loadedFiles.push(info);
          }
          me.$tmToast.success(
            me.$t("i18nCommon.duckDBQuery.uploadFileSuccess"),
          );
          // Tự động suggest query mẫu
          if (!me.sqlText?.trim()) {
            me.sqlText = `SELECT * FROM ${info.table_name} LIMIT 100;`;
          }
        } else {
          me.$tmToast.error(
            resp?.data?.message ||
              me.$t("i18nCommon.duckDBQuery.uploadFileError"),
          );
        }
      } catch (err) {
        me.$tmToast.error(
          err?.message || me.$t("i18nCommon.duckDBQuery.uploadFileError"),
        );
      } finally {
        me.isUploading = false;
      }
    },

    /**
     * Xoá file/view khỏi session DuckDB
     */
    async handleDropFile(file) {
      let me = this;
      try {
        let resp = await me.agentAPI.dropFile(
          me.currentSessionId,
          file.file_id,
        );
        if (resp?.data?.success) {
          me.loadedFiles = me.loadedFiles.filter(
            (f) => f.file_id !== file.file_id,
          );
          me.$tmToast.success(me.$t("i18nCommon.duckDBQuery.dropFileSuccess"));
        } else {
          me.$tmToast.error(
            resp?.data?.message ||
              me.$t("i18nCommon.duckDBQuery.dropFileError"),
          );
        }
      } catch (err) {
        me.$tmToast.error(
          err?.message || me.$t("i18nCommon.duckDBQuery.dropFileError"),
        );
      }
    },

    /**
     * Tạo session mới (xoá toàn bộ dữ liệu hiện tại)
     */
    async handleNewSession() {
      let me = this;
      let confirmed = await me.$tmDialog?.confirm?.(
        me.$t("i18nCommon.duckDBQuery.newSessionConfirm"),
      );
      // Nếu không có dialog thì dùng confirm native
      if (confirmed === undefined) {
        confirmed = window.confirm(
          me.$t("i18nCommon.duckDBQuery.newSessionConfirm"),
        );
      }
      if (!confirmed) return;

      // Xoá session cũ
      try {
        await me.agentAPI.dropSession(me.currentSessionId);
      } catch {
        /* ignore */
      }

      // Tạo session mới
      me.currentSessionId = me.$tmUtility.newGuid();
      await me.$tmCache.set(
        me.$tmEnum.cacheConfig.DuckDBSessionId,
        me.currentSessionId,
      );
      me.loadedFiles = [];
      me.resetQueryResults();
      me.sqlText = "";
      me.$tmToast.success(me.$t("i18nCommon.duckDBQuery.newSessionSuccess"));
    },

    /**
     * Format SQL bằng sql-formatter
     */
    handleFormatSQL() {
      let me = this;
      if (!me.sqlText?.trim()) return;
      try {
        me.sqlText = sqlFormat(me.sqlText, {
          language: "sql",
          indent: "  ",
          uppercase: true,
        });
      } catch {
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /**
     * Build JSON text để copy/download
     */
    buildResultForCopy() {
      let result = this.activeQueryResult;
      if (!result?.is_select || !result?.rows?.length) return "";
      return JSON.stringify(result.rows, null, 2);
    },

    /**
     * Copy kết quả dạng JSON vào clipboard
     */
    handleCopyResult() {
      let me = this;
      let text = me.buildResultForCopy();
      if (text) {
        try {
          me.$tmUtility.copyToClipboard(text);
        } catch {
          me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
      }
    },

    /**
     * Download kết quả dạng file .txt
     */
    handleDownloadResult() {
      let me = this;
      let text = me.buildResultForCopy();
      if (text) {
        let encoder = new TextEncoder();
        let buffer = encoder.encode(text);
        let fileName = me.$tmUtility.createFileDownloadName("duckdb_result", {
          ext: ".txt",
        });
        me.$tmUtility.createDownloadFileFromBuffer(
          buffer,
          "text/plain;charset=utf-8",
          fileName,
        );
      }
    },

    /**
     * Lưu query vào history
     */
    async saveCurrentQuery() {
      let me = this;
      if (!me.sqlText?.trim()) return;
      let queryName = me.sqlText.substring(0, 100);
      try {
        let historyItem = {
          id: me.$tmUtility.newGuid(),
          query_name: queryName,
          query_text: me.sqlText,
        };
        await me.$refs.savedQueryHistory?.saveToHistory(historyItem);
      } catch {
        /* ignore */
      }
    },

    /**
     * Apply saved query từ history sidebar vào editor
     */
    applySavedQueryFromHistory(query) {
      if (query) {
        this.sqlText = query.query_text ?? "";
      }
    },

    /**
     * Kết thúc edit trong Monaco: cập nhật sqlText, gọi callback
     */
    endEditFromEditor(editor, callback) {
      let me = this;
      let currentText = editor.getValue();
      me.sqlText = currentText;
      this.$nextTick(() => {
        if (callback && typeof callback === "function") {
          callback();
        }
      });
    },
  },

  watch: {
    /**
     * Khi bật/tắt limitResults: backup và reset limit
     */
    "currentConfigLayout.limitResults"(enabled) {
      if (enabled) {
        this.currentConfigLayout.defaultQueryLimit =
          this.currentConfigLayout.limitResultsBackup || 1000;
      } else {
        if (this.currentConfigLayout.defaultQueryLimit > 0) {
          this.currentConfigLayout.limitResultsBackup =
            this.currentConfigLayout.defaultQueryLimit;
        }
        this.currentConfigLayout.defaultQueryLimit = 0;
      }
      this.updateConfigLayout();
    },
  },
};
</script>

<style scoped lang="scss">
/* ── Layout tổng thể: giống hệt PostgreSQL tool ── */
.tm-pg-query-container {
  width: 100%;
  height: 100%;
}

.tm-pg-query-main {
  flex: 1;
  min-width: 0;
  height: 100%;
  gap: var(--padding);
}

.tm-pg-query-editor {
  min-height: 0;
  width: 100%;
  gap: var(--padding);
  position: relative;
}

.tm-pg-query-result {
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;

  .tm-pg-result-body {
    width: 100%;
    height: 100%;
    gap: var(--padding);

    .tm-pg-result-tabs-wrap {
      height: 100%;

      .tm-pg-result-tabs {
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: var(--padding);
        border-radius: var(--border-radius);
        padding: calc(var(--padding) / 2);
        border: 1px solid var(--border-color);

        .tm-pg-result-tab-item {
          width: 100%;
          flex-shrink: 0;
          font-size: var(--font-size-small);
          color: var(--text-secondary-color);
          border-radius: var(--border-radius-component);
          padding: calc(var(--padding) / 2);
          cursor: pointer;
        }

        .tm-pg-result-tab-item:hover {
          background-color: var(--focus-color);
          color: var(--selected-item-text-color);
        }

        .tm-pg-result-tab-item-active {
          background-color: var(--focus-color);
          color: var(--selected-item-text-color);
        }
      }
    }

    .tm-pg-result-content {
      width: 100%;
      height: 100%;
      min-height: 0;
      min-width: 0;

      .tm-pg-result-table {
        height: 100%;
        width: 100%;
      }
    }
  }
}

.tm-pg-result-loading {
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-layer-color);
  border-radius: var(--border-radius);
}

.tm-pg-result-error {
  display: flex;
  align-items: flex-start;
  gap: var(--padding);
  padding: var(--padding);
  color: var(--text-error-color);
  background-color: var(--bg-thirt-color);
  border-radius: var(--border-radius);
  word-break: break-all;
  flex: 1;
}

.tm-pg-result-affected {
  width: 100%;
  height: 100%;
  position: relative;
  padding: var(--padding);
  color: var(--text-secondary-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);

  .tm-effected-text {
    z-index: 1;
    background-color: var(--bg-main-color);
    padding: var(--padding);
  }
}

.tm-pg-result-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary-color);
  position: relative;
}

.tm-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.tm-sidebar-menu {
  width: 100%;
}

.tm-tool-header-menu-group {
  width: 100%;
  align-items: center;
  justify-content: space-between;

  .tm-header-menu-group {
    justify-content: flex-start;
    overflow-x: auto;

    .tm-menu-item {
      flex-shrink: 0;
    }
  }
}

.tm-query-config {
  padding: var(--padding);
}

/* ── DuckDB specific: upload area ── */
.tm-duckdb-upload-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--padding);
  width: 100%;
  flex-shrink: 0;
  cursor: pointer;
  text-align: center;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: var(--focus-color);
  }

  // đang nạp file: khoá tương tác để không mở hộp chọn file chồng lên tiến trình
  &--busy {
    pointer-events: none;
    opacity: 0.6;
  }

  .tm-duckdb-file-input {
    display: none;
  }

  .tm-duckdb-upload-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background-color: var(--bg-main-color);
    transition:
      border-color 0.2s ease,
      transform 0.2s ease;

    .tm-icon {
      color: var(--focus-color);
    }
  }

  &:hover .tm-duckdb-upload-icon-wrap {
    border-color: var(--focus-color);
    transform: translateY(-2px);
  }

  .tm-duckdb-upload-title {
    font-size: var(--font-size-medium-rare);
    font-weight: 600;
    color: var(--text-primary-color);
  }

  .tm-duckdb-upload-text {
    font-size: var(--font-size-small);
    color: var(--text-secondary-color);
  }

  // dải định dạng dạng "pill" cho dễ nhận biết, chi tiết đầy đủ nằm ở tooltip
  .tm-duckdb-upload-formats {
    max-width: 100%;
    margin-top: var(--padding-medium);
    padding: 2px var(--padding);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--bg-main-color);
    font-size: 11px;
    letter-spacing: 0.02em;
    color: var(--text-tertiary-color);
  }
}

.tm-duckdb-upload-loading {
  flex-shrink: 0;
  margin-top: var(--padding);
  padding: calc(var(--padding) / 2) var(--padding) var(--padding);
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  background-color: var(--bg-thirt-color);

  .tm-duckdb-uploading-text {
    font-size: var(--font-size-small);
    color: var(--text-secondary-color);
  }
}

.tm-duckdb-file-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--padding-medium);
  flex: 1;
  min-height: 0;
  margin-top: var(--padding);
  padding: 0 var(--padding-medium) var(--padding-medium) 0;
  overflow-y: auto;

  .tm-duckdb-file-list-header {
    flex-shrink: 0;
    justify-content: flex-start;
    gap: var(--padding-medium);

    .tm-duckdb-file-list-title {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .tm-duckdb-file-list-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 6px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: 11px;
      line-height: 1;
      color: var(--text-tertiary-color);
    }
  }
}

.tm-duckdb-file-item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  flex-shrink: 0;
  padding: calc(var(--padding) * 0.75) var(--padding);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: var(--focus-color);
  }

  .tm-duckdb-file-item-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .tm-duckdb-file-name {
    font-size: var(--font-size-medium-rare);
    font-weight: 600;
    line-height: 1.35;
  }

  .tm-duckdb-file-table {
    display: flex;
    min-width: 0;

    .tm-table-badge {
      max-width: 100%;
      padding: 1px calc(var(--padding) / 2);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-component);
      background-color: var(--bg-main-color);
      font-size: var(--font-size-small);
      line-height: 1.4;
    }
  }

  .tm-duckdb-file-rows {
    font-size: var(--font-size-small);
    line-height: 1.4;
  }
}

// nút xoá: mờ nhẹ cho đỡ nặng mắt, hover sáng lên và icon chuyển đỏ
.tm-duckdb-file-delete {
  flex-shrink: 0;
  opacity: 0.2;
  transition: opacity 0.2s ease;

  &:hover,
  &:focus {
    opacity: 1;
  }
}

.tm-duckdb-no-files {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--padding-medium);
  flex: 1;
  min-height: 0;
  padding: var(--padding) calc(var(--padding) * 2);
  text-align: center;
  color: var(--text-secondary-color);

  .tm-icon {
    color: var(--text-secondary-color);
    opacity: 0.35;
    cursor: default;
  }

  .tm-duckdb-no-files-title {
    font-size: var(--font-size-medium-rare);
    color: var(--text-tertiary-color);
  }

  .tm-duckdb-no-files-desc {
    max-width: 260px;
    font-size: var(--font-size-small);
    line-height: 1.5;
    color: var(--text-secondary-color);
  }
}

/* ── Session info ── */
.tm-duckdb-session-info {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding) / 4);
  padding: var(--padding);
  border-top: 1px solid var(--border-color);
  margin-top: var(--padding);

  .tm-session-label {
    font-size: var(--font-size-small);
    color: var(--text-secondary-color);
  }

  .tm-session-id {
    font-size: var(--font-size-small);
    color: var(--text-color);
    font-family: monospace;
    cursor: help;
  }
}
</style>
