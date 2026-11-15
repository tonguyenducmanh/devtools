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
        <!-- nút API reference: mở popup hướng dẫn dùng AI gen SQL -->
        <TMButton
          :noMargin="true"
          @click="showAIDocsPopup"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-book-icon"
          :isSmallButton="true"
          style="margin-right: var(--padding);"
          v-tooltip="$t('i18nCommon.duckDBQuery.apiReference')"
        ></TMButton>
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
          language="duckdb"
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
          <!-- Session info (ẩn) -->
          <!-- <div class="tm-duckdb-session-info">
            <div class="tm-session-label">
              {{ $t("i18nCommon.duckDBQuery.sessionLabel") }}
            </div>
            <div class="tm-session-id" v-tooltip="currentSessionId">
              {{ currentSessionIdShort }}
            </div>
          </div> -->
        </div>

        <!-- tab Files: upload + danh sách bảng đã nạp -->
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tmEnum.DuckDBQuerySidebarOption.Files
          "
        >
          <!-- hàng điều khiển: header danh sách file (trái) + nút upload + xoá tất cả (phải) -->
          <div
            class="flex tm-duckdb-toolbar-row"
            style="
              justify-content: space-between;
              align-items: center;
              margin: var(--padding);
            "
          >
            <div class="flex tm-duckdb-file-list-header">
              <span class="tm-duckdb-file-list-title">{{
                $t("i18nCommon.duckDBQuery.uploadedFiles")
              }}</span>
              <span class="tm-duckdb-file-list-count">{{
                loadedFiles.length
              }}</span>
            </div>
            <div class="flex" style="flex-shrink: 0">
              <TMUpload
                icon-class="tm-upload-icon"
                :hide-border="true"
                :read-only="isUploading"
                :multiple="true"
                v-tooltip="{ text: uploadTooltipText, maxWidth: '320px' }"
                @selected="handleFileSelect"
              />
            </div>
          </div>

          <!-- danh sách file đã nạp: nhóm theo file, hiển thị sheet/view con -->
          <div class="tm-duckdb-file-list">
            <div
              class="tm-duckdb-file-group"
              v-for="group in groupedFiles"
              :key="group.file_id"
            >
              <!-- Header file: tên file + nút xoá (xoá toàn bộ file) -->
              <div
                class="tm-duckdb-file-group-header"
                v-tooltip="group.file_name"
              >
                <div>
                  <div class="tm-duckdb-file-group-name">
                    {{ group.file_name }}
                  </div>
                  <div class="tm-duckdb-file-group-count">
                    {{ group.sheets.length }}
                    {{
                      group.sheets.length === 1
                        ? $t("i18nCommon.duckDBQuery.sheet")
                        : $t("i18nCommon.duckDBQuery.sheets")
                    }}
                  </div>
                </div>
                <TMButton
                  class="tm-duckdb-file-delete"
                  :noMargin="true"
                  :isSmallButton="true"
                  :type="$tmEnum.buttonType.secondary"
                  iconClass="tm-close-icon"
                  v-tooltip="$t('i18nCommon.duckDBQuery.dropFile')"
                  @click.stop="handleDropFile(group)"
                />
              </div>

              <!-- Các sheet/view trong file -->
              <div
                v-for="sheet in group.sheets"
                :key="sheet.table_name"
                class="tm-duckdb-file-item"
                v-tooltip="getSheetTooltip(sheet)"
              >
                <div class="tm-duckdb-file-item-info">
                  <div class="text-nowrap tm-duckdb-sheet-name">
                    {{ sheet.table_name }}
                  </div>
                  <div class="tm-duckdb-file-rows">
                    {{ formatRowCount(sheet.row_count) }}
                    {{ $t("i18nCommon.duckDBQuery.rowCount") }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Nút xoá tất cả: cố định dưới cùng sidebar, không scroll theo danh sách -->
          <div
            class="tm-duckdb-clear-all-wrap"
            v-if="loadedFiles.length > 0"
          >
            <TMButton
              class="tm-duckdb-clear-all-btn"
              :noMargin="true"
              :isSmallButton="true"
              :type="$tmEnum.buttonType.secondary"
              :label="$t('i18nCommon.duckDBQuery.clearAllFiles')"
              v-tooltip="$t('i18nCommon.duckDBQuery.clearAllFiles')"
              @click.stop="handleClearAllFiles"
            />
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
import TMDuckDBIntellisenseMixin from "./TMDuckDBIntellisenseMixin.js";
import { registerDuckdbFormatProvider } from "@/monarch/duckdb/duckdbFormatProvider.js";
import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";

export default {
  extends: TMToolBase,
  name: "TMDuckDBQuery",
  /**
   * Mixin xử lý intellisense cho DuckDB
   */
  mixins: [TMDuckDBIntellisenseMixin],
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

      // ── Intellisense ─────────────────────────────────────────────
      isLoadingIntellisense: false,

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
    // Load intellisense từ cache nếu có
    await me.loadCachedIntellisense();
  },

  computed: {
    /**
     * Cấu hình menu flyout ở header tool
     */
    menuConfig() {
      let me = this;
      return {
        // Nhóm Code Complete: load/cache intellisense data
        codeComplete: [
          {
            key: "loadIntellisense",
            label: me.isLoadingIntellisense
              ? me.$t("i18nCommon.duckDBQuery.intellisenseLoading")
              : me.$t("i18nCommon.duckDBQuery.loadIntellisense"),
            disabled: !me.currentSessionId || me.isLoadingIntellisense,
            run: me.handleLoadIntellisense,
          },
          {
            key: "loadCachedIntellisense",
            label: me.$t("i18nCommon.duckDBQuery.loadCachedIntellisense"),
            disabled: !me.currentSessionId,
            run: me.loadCachedIntellisense,
          },
        ],
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

    /**
     * Nhóm loadedFiles theo file_id để hiển thị: 1 file = 1 group, các sheet/view là children
     */
    groupedFiles() {
      const groups = {};
      for (const file of this.loadedFiles) {
        if (!groups[file.file_id]) {
          groups[file.file_id] = {
            file_id: file.file_id,
            file_name: file.file_name,
            sheets: [],
          };
        }
        groups[file.file_id].sheets.push(file);
      }
      // Chuyển object thành array, sort theo thứ tự upload
      return Object.values(groups);
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
          registerDuckdbFormatProvider(monacoInstance);

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
     * Xử lý chọn file từ TMUpload (components chung)
     */
    async handleFileSelect(files) {
      if (!files || files.length === 0) return;
      for (const file of files) {
        await this.uploadFile(file);
      }
      // Reload intellisense 1 lần sau khi xong tất cả file
      await this.handleLoadIntellisense();
    },

    /**
     * Upload file lên backend và nạp vào DuckDB session
     */
    async uploadFile(file) {
      let me = this;
      let supportedExts = [
        ".xlsx",
        ".xls",
        ".ods",
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
          let infos = resp.data.data;
          if (!Array.isArray(infos)) infos = [infos];
          for (const info of infos) {
            // Thêm vào danh sách hoặc cập nhật nếu trùng file_id + table_name
            let existingIdx = me.loadedFiles.findIndex(
              (f) =>
                f.file_id === info.file_id && f.table_name === info.table_name,
            );
            if (existingIdx >= 0) {
              me.loadedFiles[existingIdx] = info;
            } else {
              me.loadedFiles.push(info);
            }
          }
          me.$tmToast.success(
            me.$t("i18nCommon.duckDBQuery.uploadFileSuccess"),
          );
          // Tự động suggest query mẫu từ tất cả bảng đã tải, ngăn cách bởi ;
          if (!me.sqlText?.trim() && infos.length > 0) {
            const queries = infos.map(
              (info) => `SELECT * FROM "${info.table_name}" LIMIT 100`,
            );
            me.sqlText = queries.join("; ") + ";";
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
     * Tooltip chi tiết toàn bộ thông tin file khi hover vào dòng đã nạp
     */
    getFileTooltip(file) {
      if (!file) return "";
      return [
        `${this.$t("i18nCommon.duckDBQuery.fileName")}: ${file.file_name || "-"}`,
        `${this.$t("i18nCommon.duckDBQuery.fileTableName")}: ${file.table_name || "-"}`,
        `${this.$t("i18nCommon.duckDBQuery.totalRows")}: ${this.formatRowCount(file.row_count)} ${this.$t("i18nCommon.duckDBQuery.rowCount")}`,
      ].join("\n");
    },

    /**
     * Tooltip cho từng sheet/view (hiển thị trong group)
     */
    getSheetTooltip(sheet) {
      if (!sheet) return "";
      return [
        `${this.$t("i18nCommon.duckDBQuery.fileName")}: ${sheet.file_name || "-"}`,
        `${this.$t("i18nCommon.duckDBQuery.fileTableName")}: ${sheet.table_name || "-"}`,
        `${this.$t("i18nCommon.duckDBQuery.totalRows")}: ${this.formatRowCount(sheet.row_count)} ${this.$t("i18nCommon.duckDBQuery.rowCount")}`,
      ].join("\n");
    },

    /**
     * Xoá file/view khỏi session DuckDB
     * Xoá toàn bộ file (tất cả sheet/view của file đó)
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
     * Mở popup tài liệu API để user có thể copy prompt cho AI gen SQL
     */
    showAIDocsPopup() {
      let me = this;
      let markdown = me.buildAIDocsPrompt();
      TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMQuickPreview,
        ownerForm: me,
        props: {},
        param: {
          value: markdown,
          label: me.$t("i18nCommon.duckDBQuery.apiReference"),
          language: "markdown",
        },
      });
    },

    /**
     * Build markdown prompt cho AI gen SQL
     * Mô tả: đây là DuckDB, các bảng đã load, tên bảng, cột, số dòng
     */
    buildAIDocsPrompt() {
      let me = this;
      let lines = [];
      lines.push("# DuckDB Query - AI SQL Generation Reference");
      lines.push("");
      lines.push("## Database Info");
      lines.push("");
      lines.push("- **Engine**: DuckDB (in-memory, analytical SQL)");
      lines.push("- **Session**: " + (me.currentSessionId || "new"));
      lines.push("");

      if (me.loadedFiles && me.loadedFiles.length > 0) {
        lines.push("## Loaded Tables");
        lines.push("");
        lines.push("The following tables are already loaded in the current session:");
        lines.push("");

        // Group by file_id để hiển thị theo file
        const groups = {};
        for (const file of me.loadedFiles) {
          if (!groups[file.file_id]) {
            groups[file.file_id] = {
              file_name: file.file_name,
              tables: [],
            };
          }
          groups[file.file_id].tables.push(file);
        }

        for (const [fileId, group] of Object.entries(groups)) {
          lines.push(`### File: ${group.file_name}`);
          lines.push("");
          if (group.tables.length === 1) {
            const t = group.tables[0];
            lines.push(`- **Table**: \`${t.table_name}\``);
            const cols = t.columns ? t.columns.map(c => `\`${c}\``).join(", ") : "N/A";
            lines.push(`  - **Columns**: ${cols}`);
            lines.push(`  - **Row Count**: ${me.formatRowCount(t.row_count)}`);
          } else {
            for (const t of group.tables) {
              lines.push(`- **Table**: \`${t.table_name}\``);
              const cols = t.columns ? t.columns.map(c => `\`${c}\``).join(", ") : "N/A";
              lines.push(`  - **Columns**: ${cols}`);
              lines.push(`  - **Row Count**: ${me.formatRowCount(t.row_count)}`);
            }
          }
          lines.push("");
        }
      } else {
        lines.push("*No tables loaded yet. Upload files first.*");
        lines.push("");
      }

      lines.push("## Usage Instructions for AI");
      lines.push("");
      lines.push("When asking AI to generate SQL:");
      lines.push("1. Copy this entire reference and paste it into your AI chat");
      lines.push("2. Describe what you want to query (e.g., 'Find top 10 customers by revenue')");
      lines.push("3. AI will generate DuckDB-compatible SQL using the exact table/column names above");
      lines.push("");
      lines.push("## DuckDB SQL Notes");
      lines.push("");
      lines.push("- Use double quotes for identifiers: `SELECT * FROM \"my_table\"`");
      lines.push("- DuckDB supports PostgreSQL-compatible syntax");
      lines.push("- Use `LIMIT` for pagination: `SELECT * FROM \"table\" LIMIT 100`");
      lines.push("- Window functions, CTEs, and JSON functions are supported");
      lines.push("");
      lines.push("---");
      lines.push("*Generated by DevTools DuckDB Query Tool*");

      return lines.join("\n");
    },

    /**
     * Build JSON text để copy/download
     */
    async handleClearAllFiles() {
      let me = this;
      let confirmed = await TMDialogUtil.confirm({
        ownerForm: me,
        title: me.$t("i18nCommon.duckDBQuery.clearAllFiles"),
        message: me.$t("i18nCommon.duckDBQuery.clearAllFilesConfirm"),
      });
      if (!confirmed) return;

      try {
        let resp = await me.agentAPI.dropAllFiles(me.currentSessionId);
        if (resp?.data?.success) {
          me.loadedFiles = [];
          me.$tmToast.success(me.$t("i18nCommon.duckDBQuery.clearAllFilesSuccess"));
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
      let confirmed = await TMDialogUtil.confirm({
        ownerForm: me,
        title: me.$t("i18nCommon.duckDBQuery.newSession"),
        message: me.$t("i18nCommon.duckDBQuery.newSessionConfirm"),
      });
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

    /**
     * Khi đổi session: load intellisense từ cache, cập nhật tab title
     */
    async currentSessionId(newId) {
      if (newId) {
        await this.loadCachedIntellisense();
      }
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

.tm-duckdb-file-list {
  flex: 1;
  width: 100%;
  gap: var(--padding);
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  margin-top: var(--padding);
  padding: 0 var(--padding-medium) var(--padding-medium) 0;

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
    }
  }
}
.tm-duckdb-file-group {
}
/* File group header (file level) */
.tm-duckdb-file-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--padding);
  margin-bottom: var(--padding);
  padding: var(--padding);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  background-color: var(--bg-main-color);
  cursor: default;
  width: 100%;
  box-sizing: border-box;

  .tm-duckdb-file-group-name {
    display: block;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-medium-rare);
    font-weight: 600;
    line-height: 1.35;
  }

  .tm-duckdb-file-group-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: var(--font-size-small);
    line-height: 1;
    flex-shrink: 0;
  }
}

/* Sheet items (child of file group) */
.tm-duckdb-file-item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  flex-shrink: 0;
  padding: var(--padding);
  border-left: 1px solid var(--border-color);
  background-color: transparent;
  transition:
    border-left-color 0.2s ease,
    background-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    border-left-color: var(--focus-color);
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }

  .tm-duckdb-file-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
    width: 100%;
  }

  .tm-duckdb-sheet-name {
    display: block;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-medium-rare);
    font-weight: 500;
    line-height: 1.35;
  }

  .tm-duckdb-file-rows {
    font-size: var(--font-size-small);
    line-height: 1.4;
    flex-shrink: 0;
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

/* Nút xoá tất cả: cố định dưới cùng sidebar, không scroll theo danh sách */
.tm-duckdb-clear-all-wrap {
  flex-shrink: 0;
  margin-top: var(--padding);
  padding: calc(var(--padding) / 2) var(--padding);
  border-top: 1px solid var(--border-color);

  .tm-duckdb-clear-all-btn {
    width: 100%;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.2s ease, background-color 0.2s ease;

    &:hover {
      opacity: 1;
      background-color: var(--bg-hover-color);
    }
  }
}

.tm-duckdb-file-list-header {
  gap: var(--padding);
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

/* ── toolbar upload: header (trái) + nút upload (phải) ── */
.tm-duckdb-toolbar-row {
  width: 100%;
  margin: var(--padding);
}
.tm-duckdb-toolbar-row :deep(.tm-upload-hide-border) {
  width: auto;
  height: auto;
  min-width: unset;
}
</style>
