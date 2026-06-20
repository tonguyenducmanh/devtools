<template>
  <div class="flex td-pg-query-container">
    <!-- ========== PHẦN CHÍNH ========== -->
    <div class="flex flex-col td-pg-query-main">
      <!-- HEADER: connection selector + action buttons -->
      <div class="flex td-pg-query-header">
        <div class="flex flex-one td-pg-connection-row">
          <TDComboBox
            v-model="selectedConnectionId"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.selectConnection')"
            :options="connectionOptions"
            :isEditable="false"
            :noMargin="true"
            :width="220"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopLeft,
              $tdEnum.BorderRadiusPosition.BottomLeft,
            ]"
          />
          <!-- nút load intellisense -->
          <TDButton
            :noMargin="true"
            :type="$tdEnum.buttonType.secondary"
            @click="handleLoadIntellisense"
            :disabled="!selectedConnectionId || isLoadingIntellisense"
            iconClass="td-reload-icon"
            :borderRadiusPosition="[]"
            v-tooltip="
              isLoadingIntellisense
                ? $t('i18nCommon.postgreSQLQuery.intellisenseLoading')
                : $t('i18nCommon.postgreSQLQuery.loadIntellisense')
            "
          />
          <!-- nút format code -->
          <TDButton
            :noMargin="true"
            :type="$tdEnum.buttonType.secondary"
            @click="handleFormatSQL"
            iconClass="td-format-icon"
            :borderRadiusPosition="[]"
            v-tooltip="$t('i18nCommon.postgreSQLQuery.formatCode')"
          />
          <!-- nút run query -->
          <TDButton
            :noMargin="true"
            @click="handleRunQuery"
            :disabled="!selectedConnectionId || isRunning"
            iconClass="td-run-icon"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopRight,
              $tdEnum.BorderRadiusPosition.BottomRight,
            ]"
            v-tooltip="$t('i18nCommon.postgreSQLQuery.runQuery')"
          />
        </div>
        <!-- copy result -->
        <TDButton
          v-if="
            queryResult &&
            queryResult.is_select &&
            queryResult.rows &&
            queryResult.rows.length > 0
          "
          :noMargin="true"
          :type="$tdEnum.buttonType.secondary"
          @click="handleCopyResult"
          iconClass="td-copy-icon"
          v-tooltip="$t('i18nCommon.copy')"
        />
      </div>

      <!-- EDITOR SQL -->
      <div class="td-pg-query-editor" :style="editorSectionSizeStyle">
        <TDTextarea
          ref="sqlEditor"
          v-model="sqlText"
          language="pgsql"
          :enableHighlight="currentConfigLayout.enableHighlight"
          :wrapText="currentConfigLayout.wrapText"
          :placeHolder="'SELECT * FROM table_name LIMIT 100;'"
          :label="'SQL Query'"
          :isLabelTop="true"
          height="100%"
          width="100%"
          :monacoOptions="monacoOptions"
          @keydown.ctrl.enter.prevent="handleRunQuery"
          @keydown.meta.enter.prevent="handleRunQuery"
        />
      </div>

      <!-- Resizer -->
      <TDResizer :direction="'vertical'" @resize="handleResize" />

      <!-- RESULT AREA -->
      <div class="td-pg-query-result" :style="resultSectionSizeStyle">
        <!-- loading -->
        <div class="flex td-pg-result-loading" v-if="isRunning">
          <div class="loader"></div>
        </div>

        <!-- error message -->
        <div class="td-pg-result-error" v-else-if="queryError">
          <div class="td-icon td-warning-icon"></div>
          <span>{{ queryError }}</span>
        </div>

        <!-- non-select result -->
        <div
          class="td-pg-result-affected"
          v-else-if="queryResult && !queryResult.is_select"
        >
          <span
            >{{ $t("i18nCommon.postgreSQLQuery.rowsAffected") }}:
            {{ queryResult.rows_affected }}</span
          >
        </div>

        <!-- select result table -->
        <TDTableViewer
          v-else-if="queryResult && queryResult.is_select"
          :tableData="queryResult.rows || []"
          :columns="tableColumns"
          :noMargin="true"
          :stickyHeader="true"
          :showIndex="true"
          maxHeight="100%"
        />

        <!-- empty state -->
        <div class="td-pg-result-empty" v-else>
          <span>{{ $t("i18nCommon.noDataAvailable") }}</span>
        </div>
      </div>
    </div>
    <!-- ========== HẾT PHẦN CHÍNH ========== -->

    <!-- ========== SUBSIDEBAR ========== -->
    <TDSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <!-- menu tab options -->
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
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
        <!-- TAB: Help -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Help
          "
        >
          <TDPostgreSQLQueryHelp />
        </div>

        <!-- TAB: Setting -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Setting
          "
        >
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableHighlight"
            :label="$t('i18nCommon.enableHighlight')"
            @change="updateConfigLayout"
          />
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.APIMocking.wrapText')"
            @change="updateConfigLayout"
          />
        </div>

        <!-- TAB: Connection -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Connection
          "
        >
          <!-- header: add group + refresh -->
          <div class="flex td-header-collection">
            <div class="td-new-collection">
              <TDInput
                v-model="newGroupName"
                :noMargin="true"
                :placeHolder="$t('i18nCommon.postgreSQLQuery.groupName')"
              />
            </div>
            <TDButton
              :noMargin="true"
              @click="addNewGroup"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-plus-icon"
              v-tooltip="$t('i18nCommon.postgreSQLQuery.addGroup')"
            />
            <TDButton
              :noMargin="true"
              @click="loadAllData"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-reload-icon"
              v-tooltip="$t('i18nCommon.postgreSQLQuery.refreshData')"
            />
          </div>

          <!-- danh sách group + connection -->
          <div class="td-collection">
            <div class="flex flex-col response-loading" v-if="isLoading">
              <div class="loader"></div>
            </div>
            <div class="td-collection-body" v-else>
              <div
                v-for="(group, index) in groupedConnections"
                class="flex flex-col no-select td-collection-item"
                :key="index"
              >
                <!-- group header -->
                <div
                  class="flex td-collection-header"
                  @click="toggleGroup(group.id || '__ungrouped__')"
                >
                  <div
                    class="flex text-nowrap-collection td-collection-header-left"
                  >
                    <TDArrow
                      :openProp="openGroups[group.id || '__ungrouped__']"
                      :arrowOpenDirection="$tdEnum.Direction.bottom"
                      :arrowDirection="$tdEnum.Direction.right"
                    />
                    <div v-tooltip="group.name || 'Ungrouped'">
                      {{ group.name || "Ungrouped" }}
                    </div>
                  </div>
                  <div class="flex td-collection-edit-btn" v-if="group.id">
                    <!-- nút add connection vào group -->
                    <div
                      v-tooltip="$t('i18nCommon.postgreSQLQuery.addConnection')"
                      class="td-icon td-plus-icon"
                      @click.stop="openAddConnectionPopup(group.id)"
                    ></div>
                    <!-- nút xóa group -->
                    <div
                      v-tooltip="$t('i18nCommon.postgreSQLQuery.deleteGroup')"
                      class="td-icon td-close-icon"
                      @click.stop="deleteGroup(group.id)"
                    ></div>
                  </div>
                  <!-- ungrouped: add connection -->
                  <div class="flex td-collection-edit-btn" v-else>
                    <div
                      v-tooltip="$t('i18nCommon.postgreSQLQuery.addConnection')"
                      class="td-icon td-plus-icon"
                      @click.stop="openAddConnectionPopup('')"
                    ></div>
                  </div>
                </div>

                <!-- connections trong group -->
                <div
                  v-if="
                    openGroups[group.id || '__ungrouped__'] &&
                    group.items &&
                    group.items.length > 0
                  "
                  class="flex flex-col td-collection-content"
                >
                  <div
                    v-for="(conn, ci) in group.items"
                    :key="ci"
                    class="flex td-collection-request-item"
                    :class="{
                      'td-collection-request-item-selected':
                        selectedConnectionId === conn.id,
                    }"
                    @click="selectConnection(conn)"
                  >
                    <span class="text-nowrap">
                      <div v-tooltip="conn.connection_name">
                        {{ conn.connection_name }}
                      </div>
                    </span>
                    <span class="flex td-connection-actions">
                      <div
                        class="td-icon td-edit-icon"
                        v-tooltip="$t('i18nCommon.edit')"
                        @click.stop="openEditConnectionPopup(conn)"
                      ></div>
                      <div
                        class="td-icon td-close-icon"
                        v-tooltip="
                          $t('i18nCommon.postgreSQLQuery.deleteConnection')
                        "
                        @click.stop="deleteConnection(conn.id)"
                      ></div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: SQL Save -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.SQLSave
          "
        >
          <!-- header: new query + refresh -->
          <div class="flex td-header-collection">
            <div class="td-new-collection">
              <TDInput
                v-model="newQueryName"
                :noMargin="true"
                :placeHolder="$t('i18nCommon.postgreSQLQuery.queryName')"
              />
            </div>
            <TDButton
              :noMargin="true"
              @click="saveCurrentQuery"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-save-icon"
              v-tooltip="$t('i18nCommon.postgreSQLQuery.saveQuery')"
            />
            <TDButton
              :noMargin="true"
              @click="loadSavedQueries"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-reload-icon"
              v-tooltip="$t('i18nCommon.postgreSQLQuery.refreshData')"
            />
          </div>

          <!-- danh sách saved queries -->
          <div class="td-collection">
            <div class="td-collection-sql-body">
              <div
                v-for="(q, qi) in allSavedQueries"
                :key="qi"
                class="flex td-collection-sql-item"
                :class="{
                  'td-collection-sql-item-selected':
                    currentSavedQueryId === q.id,
                }"
                @click="loadSavedQuery(q)"
              >
                <span class="text-nowrap flex-one td-sql-text">
                  <div v-tooltip="q.query_name">{{ q.query_name }}</div>
                </span>
                <span>
                  <div
                    class="td-icon td-close-icon"
                    v-tooltip="$t('i18nCommon.postgreSQLQuery.deleteQuery')"
                    @click.stop="deleteSavedQuery(q.id)"
                  ></div>
                </span>
              </div>
              <div v-if="!allSavedQueries.length" class="td-empty-hint">
                {{ $t("i18nCommon.noDataAvailable") }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </TDSubSidebar>
    <!-- ========== HẾT SUBSIDEBAR ========== -->
  </div>
</template>

<script>
import { format as sqlFormat } from "sql-formatter";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDArrow from "@/components/TDArrow.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDPostgreSQLQueryHelp from "@/views/helps/TDPostgreSQLQueryHelp.vue";
import TDServerPostgreSQLAPI from "@/common/api/request/AgentAPI/TDServerPostgreSQLAPI.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import TDCache from "@/common/cache/TDCache.js";

export default {
  extends: TDToolBase,
  name: "TDPostgreSQLQuery",
  components: { TDSubSidebar, TDArrow, TDPostgreSQLQueryHelp },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.PostgreSQLQueryConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        enableHighlight: true,
        wrapText: false,
        showReponse: true,
        splitHorizontal: true,
        currentSidebarOption:
          this.$tdEnum.PostgreSQLQuerySidebarOption.Connection,
      },

      editorSectionSize: 50,
      resultSectionSize: 50,

      // connection
      selectedConnectionId: "",
      allGroups: [],
      allConnections: [],
      openGroups: {},
      newGroupName: "",

      // saved queries
      allSavedQueries: [],
      newQueryName: "",
      currentSavedQueryId: null,

      // editor
      sqlText: "",

      // result
      queryResult: null,
      queryError: null,
      isRunning: false,
      isLoading: false,
      isLoadingIntellisense: false,

      // intellisense
      intellisenseDisposable: null,

      // api
      agentAPI: null,

      // monaco options
      monacoOptions: {},
    };
  },

  async mounted() {
    this.agentAPI = new TDServerPostgreSQLAPI();
    await this.loadAllData();
  },

  beforeUnmount() {
    // Cleanup monaco intellisense provider
    if (this.intellisenseDisposable) {
      this.intellisenseDisposable.forEach((d) => d?.dispose?.());
    }
  },

  computed: {
    sidebarOptions() {
      return [
        {
          value: this.$tdEnum.PostgreSQLQuerySidebarOption.Help,
          label: this.$t("i18nCommon.postgreSQLQuery.sidebarOption.help"),
          icon: "td-help-icon",
        },
        {
          value: this.$tdEnum.PostgreSQLQuerySidebarOption.Setting,
          label: this.$t("i18nCommon.postgreSQLQuery.sidebarOption.setting"),
          icon: "td-setting-icon",
        },
        {
          value: this.$tdEnum.PostgreSQLQuerySidebarOption.Connection,
          label: this.$t("i18nCommon.postgreSQLQuery.sidebarOption.connection"),
          icon: "td-folder-icon",
        },
        {
          value: this.$tdEnum.PostgreSQLQuerySidebarOption.SQLSave,
          label: this.$t("i18nCommon.postgreSQLQuery.sidebarOption.sqlSave"),
          icon: "td-database-icon",
        },
      ];
    },

    connectionOptions() {
      return this.allConnections.map((c) => ({
        value: c.id,
        label: c.connection_name,
      }));
    },

    resultSectionSizeStyle() {
      return { height: `${this.resultSectionSize}%` };
    },
    editorSectionSizeStyle() {
      return { height: `${this.editorSectionSize}%` };
    },

    /**
     * Nhóm connections theo group
     */
    groupedConnections() {
      let groups = this.allGroups.map((g) => ({ ...g, items: [] }));
      groups.push({ id: "", name: "", items: [] }); // ungrouped

      this.allConnections.forEach((conn) => {
        let group = groups.find((g) => g.id === conn.group_id);
        if (group) {
          group.items.push(conn);
        } else {
          let ungrouped = groups.find((g) => g.id === "");
          if (ungrouped) ungrouped.items.push(conn);
        }
      });

      return groups.filter((g) => g.id !== "" || g.items.length > 0);
    },

    /**
     * Columns cho TDTableViewer từ kết quả query
     */
    tableColumns() {
      if (!this.queryResult?.columns?.length) return null;
      return this.queryResult.columns.map((col) => ({
        key: col,
        label: col,
        sortable: true,
        autoWidth: true,
      }));
    },
  },

  methods: {
    handleResize(sizes) {
      this.editorSectionSize = sizes.leftSize;
      this.resultSectionSize = sizes.rightSize;
    },

    // ─── Load data ────────────────────────────────────────────────────────────

    async loadAllData() {
      let me = this;
      me.isLoading = true;
      try {
        await Promise.all([
          me.loadGroups(),
          me.loadConnections(),
          me.loadSavedQueries(),
        ]);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        me.$tdUtility.showErrorNotFoundAgentServer();
      } finally {
        me.isLoading = false;
      }
    },

    async loadGroups() {
      let me = this;
      let response = await me.agentAPI.connectionGroup.getAll();
      let data = response?.data?.data ?? [];
      if (Array.isArray(data)) {
        me.allGroups.splice(0, me.allGroups.length, ...data);
        // Tự mở tất cả groups
        data.forEach((g) => {
          if (!(g.id in me.openGroups)) me.openGroups[g.id] = true;
        });
        if (!("__ungrouped__" in me.openGroups)) {
          me.openGroups["__ungrouped__"] = true;
        }
      }
    },

    async loadConnections() {
      let me = this;
      let response = await me.agentAPI.connection.getAll();
      let data = response?.data?.data ?? [];
      if (Array.isArray(data)) {
        me.allConnections.splice(0, me.allConnections.length, ...data);
      }
    },

    async loadSavedQueries() {
      let me = this;
      let response = await me.agentAPI.savedQuery.getAll();
      let data = response?.data?.data ?? [];
      if (Array.isArray(data)) {
        me.allSavedQueries.splice(0, me.allSavedQueries.length, ...data);
      }
    },

    // ─── Connection management ─────────────────────────────────────────────────

    toggleGroup(groupKey) {
      this.openGroups[groupKey] = !this.openGroups[groupKey];
    },

    selectConnection(conn) {
      this.selectedConnectionId = conn.id;
    },

    openAddConnectionPopup(groupId) {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLConnectionPopup,
        ownerForm: me,
        param: { group_id: groupId },
        callback: async (payload) => {
          if (payload?.saved) await me.loadConnections();
        },
      });
    },

    openEditConnectionPopup(conn) {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLConnectionPopup,
        ownerForm: me,
        param: conn,
        callback: async (payload) => {
          if (payload?.saved) await me.loadConnections();
        },
      });
    },

    async deleteConnection(id) {
      let me = this;
      try {
        let response = await me.agentAPI.connection.deleteById(id);
        if (response?.data?.success) {
          me.$tdToast.success(
            me.$t("i18nCommon.postgreSQLQuery.deleteConnectionSuccess"),
          );
          if (me.selectedConnectionId === id) {
            me.selectedConnectionId = "";
            me.queryResult = null;
            me.queryError = null;
          }
          await me.loadConnections();
        }
      } catch {
        me.$tdToast.error(
          me.$t("i18nCommon.postgreSQLQuery.deleteConnectionErr"),
        );
      }
    },

    async addNewGroup() {
      let me = this;
      if (!me.newGroupName) return;
      try {
        let response = await me.agentAPI.connectionGroup.create({
          name: me.newGroupName,
        });
        if (response?.data?.success) {
          me.$tdToast.success(
            me.$t("i18nCommon.postgreSQLQuery.createGroupSuccess"),
          );
          me.newGroupName = "";
          await me.loadGroups();
        }
      } catch {
        me.$tdToast.error(me.$t("i18nCommon.postgreSQLQuery.createGroupErr"));
      }
    },

    async deleteGroup(id) {
      let me = this;
      try {
        let response = await me.agentAPI.connectionGroup.deleteById(id);
        if (response?.data?.success) {
          me.$tdToast.success(
            me.$t("i18nCommon.postgreSQLQuery.deleteGroupSuccess"),
          );
          await me.loadAllData();
        }
      } catch {
        me.$tdToast.error(me.$t("i18nCommon.postgreSQLQuery.deleteGroupErr"));
      }
    },

    // ─── SQL Execution ─────────────────────────────────────────────────────────

    async handleRunQuery() {
      let me = this;
      if (!me.selectedConnectionId) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.noConnectionSelected"),
        );
        return;
      }
      if (!me.sqlText?.trim()) return;

      me.isRunning = true;
      me.queryResult = null;
      me.queryError = null;

      try {
        let response = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          me.sqlText,
        );
        if (response?.data?.success) {
          me.queryResult = response.data.data;
        } else {
          me.queryError =
            response?.data?.message ?? me.$t("i18nCommon.toastMessage.error");
        }
      } catch (error) {
        me.queryError =
          error?.message ?? me.$t("i18nCommon.toastMessage.error");
      } finally {
        me.isRunning = false;
      }
    },

    // ─── Format SQL ────────────────────────────────────────────────────────────

    handleFormatSQL() {
      let me = this;
      if (!me.sqlText?.trim()) return;
      try {
        me.sqlText = sqlFormat(me.sqlText, {
          language: "postgresql",
          indent: "  ",
          uppercase: true,
        });
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    // ─── Copy result ───────────────────────────────────────────────────────────

    handleCopyResult() {
      let me = this;
      if (!me.queryResult?.rows?.length) return;
      try {
        me.$tdUtility.copyToClipboard(
          JSON.stringify(me.queryResult.rows, null, 2),
        );
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    // ─── Intellisense ──────────────────────────────────────────────────────────

    async handleLoadIntellisense() {
      let me = this;
      if (!me.selectedConnectionId) return;
      me.isLoadingIntellisense = true;
      try {
        // Xóa cache cũ
        const cacheKey = me.$tdEnum.cacheConfig.PostgreSQLQueryHistory;
        await TDCache.remove(cacheKey, { id: me.selectedConnectionId });

        // Query 1: Lấy keywords
        let keywordResponse = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          "SELECT word, catcode, catdesc FROM pg_get_keywords() ORDER BY word;",
        );

        // Query 2: Lấy tables và columns
        let tableResponse = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          `SELECT 
            t.table_schema,
            t.table_name,
            c.column_name,
            c.data_type,
            c.ordinal_position
          FROM information_schema.tables t
          JOIN information_schema.columns c 
            ON t.table_name = c.table_name 
            AND t.table_schema = c.table_schema
          WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
          ORDER BY t.table_schema, t.table_name, c.ordinal_position;`,
        );

        let keywordsResult = keywordResponse?.data?.success
          ? keywordResponse.data.data
          : null;
        let tablesResult = tableResponse?.data?.success
          ? tableResponse.data.data
          : null;

        let intellisenseData = {
          keywords: keywordsResult,
          tables: tablesResult,
        };

        // Lưu vào IndexedDB theo connection id
        await TDCache.set(cacheKey, intellisenseData, {
          id: me.selectedConnectionId,
        });
        // Áp dụng intellisense vào monaco
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

        // Đăng ký completion provider
        const disposable = monaco.languages.registerCompletionItemProvider(
          "pgsql",
          {
            triggerCharacters: ["."],
            provideCompletionItems(model, position) {
              const word = model.getWordUntilPosition(position);
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };

              const text = model.getValue();
              const aliasMap = new Map();

              // regex để parse alias từ FROM/JOIN
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

              // Kiểm tra xem user có gõ dấu chấm không
              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforePointer = lineContent.substring(
                0,
                position.column - 1,
              );
              const dotMatch = textBeforePointer.match(/([a-zA-Z0-9_]+)\.$/);

              let suggestions = [];

              if (dotMatch) {
                const prefix = dotMatch[1].toLowerCase();

                // 1. Prefix là alias -> gợi ý cột
                if (aliasMap.has(prefix)) {
                  const mapped = aliasMap.get(prefix);
                  let key = mapped.schema
                    ? `${mapped.schema}.${mapped.table}`
                    : mapped.table;
                  if (columnsByTable.has(key)) {
                    suggestions.push(...columnsByTable.get(key));
                  } else if (columnsByTable.has(mapped.table)) {
                    suggestions.push(...columnsByTable.get(mapped.table));
                  }
                }
                // 2. Prefix là tên bảng -> gợi ý cột
                else if (columnsByTable.has(prefix)) {
                  suggestions.push(...columnsByTable.get(prefix));
                }
                // 3. Prefix là tên schema -> gợi ý bảng
                else if (tablesBySchema.has(prefix)) {
                  tablesBySchema.get(prefix).forEach((tbl) => {
                    suggestions.push({
                      label: tbl,
                      kind: monaco.languages.CompletionItemKind.Module,
                      insertText: tbl,
                      detail: `Table (${prefix})`,
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

                // Ưu tiên cột từ các bảng đã được parse trong FROM
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
                        sortText: "0" + c.label, // sortText 0 giúp đưa lên đầu tiên
                      });
                    });
                  });
                } else if (word.word && word.word.length > 1) {
                  // Chỉ push all columns nếu user đang gõ (tránh làm lag)
                  suggestions.push(...allColumns);
                }
              }

              // Deduplicate
              const uniqueMap = new Map();
              suggestions.forEach((s) => {
                uniqueMap.set(s.label + s.kind, s);
              });

              const finalSuggestions = Array.from(uniqueMap.values()).map(
                (s) => ({ ...s, range }),
              );

              return {
                suggestions: finalSuggestions,
              };
            },
          },
        );

        me.intellisenseDisposable = [disposable];
      } catch (error) {
        console.error("applyMonacoIntellisense error:", error);
      }
    },

    // ─── Saved queries ─────────────────────────────────────────────────────────

    async saveCurrentQuery() {
      let me = this;
      if (!me.newQueryName || !me.sqlText?.trim()) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.queryName") +
            " " +
            me.$t("i18nCommon.toastMessage.required"),
        );
        return;
      }
      try {
        let response = await me.agentAPI.savedQuery.create({
          query_name: me.newQueryName,
          connection_id: me.selectedConnectionId ?? "",
          query_text: me.sqlText,
        });
        if (response?.data?.success) {
          me.$tdToast.success(
            me.$t("i18nCommon.postgreSQLQuery.saveQuerySuccess"),
          );
          me.currentSavedQueryId = response.data.data?.id;
          me.newQueryName = "";
          await me.loadSavedQueries();
        }
      } catch {
        me.$tdToast.error(me.$t("i18nCommon.postgreSQLQuery.saveQueryErr"));
      }
    },

    loadSavedQuery(query) {
      let me = this;
      me.currentSavedQueryId = query.id;
      me.sqlText = query.query_text ?? "";
      if (query.connection_id) {
        me.selectedConnectionId = query.connection_id;
      }
    },

    async deleteSavedQuery(id) {
      let me = this;
      try {
        let response = await me.agentAPI.savedQuery.deleteById(id);
        if (response?.data?.success) {
          me.$tdToast.success(
            me.$t("i18nCommon.postgreSQLQuery.deleteQuerySuccess"),
          );
          if (me.currentSavedQueryId === id) me.currentSavedQueryId = null;
          await me.loadSavedQueries();
        }
      } catch {
        me.$tdToast.error(me.$t("i18nCommon.postgreSQLQuery.deleteQueryErr"));
      }
    },
  },

  watch: {
    // Khi đổi connection thì load intellisense từ cache
    async selectedConnectionId(newId) {
      if (newId) {
        await this.loadCachedIntellisense();
      }
    },
  },
};
</script>

<style scoped lang="scss">
.td-pg-query-container {
  width: 100%;
  height: 100%;
}

.td-pg-query-main {
  flex: 1;
  min-width: 0;
  height: 100%;
  gap: var(--padding);
}

.td-pg-query-header {
  width: 100%;
  gap: var(--padding);
  align-items: center;
  flex-shrink: 0;
}

.td-pg-connection-row {
  gap: 0;
  align-items: center;
}

.td-pg-query-editor {
  min-height: 0;
  width: 100%;
}

.td-pg-query-result {
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.td-pg-result-loading {
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-layer-color);
  border-radius: var(--border-radius);
}

.td-pg-result-error {
  display: flex;
  align-items: flex-start;
  gap: var(--padding);
  padding: var(--padding);
  color: var(--error-color, #ef4444);
  background-color: var(--bg-thirt-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-small);
  word-break: break-all;
  flex: 1;
}

.td-pg-result-affected {
  padding: var(--padding);
  color: var(--text-secondary-color);
  font-size: var(--font-size-small);
}

.td-pg-result-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary-color);
  font-size: var(--font-size-small);
}

.response-loading {
  width: 100%;
  height: 100%;
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
}

.td-collection {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;

  .td-collection-body {
    margin-top: var(--padding);
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    .td-collection-item {
      cursor: pointer;
      justify-content: flex-start;
      gap: var(--padding);
      width: 100%;
      min-height: 40px;
      margin-bottom: var(--padding);

      .td-collection-header {
        gap: var(--padding);
        padding: var(--padding);
        height: 40px;
        justify-content: space-between;
        width: 100%;
        background-color: var(--bg-thirt-color);
        border-radius: var(--border-radius);

        .td-collection-header-left {
          gap: var(--padding);
        }
      }

      .td-collection-header:hover {
        background-color: var(--bg-layer-color);
      }

      .td-collection-content {
        justify-content: flex-start;
        gap: var(--padding);
        width: 100%;

        .td-collection-request-item {
          height: 40px;
          justify-content: space-between;
          width: 100%;
          padding: var(--padding);
          border-radius: var(--border-radius);
          align-items: center;

          .td-connection-actions {
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s;
          }
        }

        .td-collection-request-item:hover {
          background-color: var(--bg-layer-color);

          .td-connection-actions {
            opacity: 1;
          }
        }

        .td-collection-request-item-selected {
          background-color: var(--bg-layer-color);
          font-weight: 600;
        }
      }
    }
  }
  .td-collection-sql-body {
    margin-top: var(--padding);
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    .td-collection-sql-item {
      cursor: pointer;
      height: 40px;
      justify-content: space-between;
      width: 100%;
      padding: var(--padding);
      border-radius: var(--border-radius);
      align-items: center;

      .td-connection-actions {
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    .td-collection-sql-item:hover {
      background-color: var(--bg-layer-color);

      .td-connection-actions {
        opacity: 1;
      }
    }

    .td-collection-sql-item-selected {
      background-color: var(--bg-layer-color);
      font-weight: 600;
    }
  }
}

.td-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.td-header-collection {
  gap: var(--padding);
  width: 100%;
  margin-top: var(--padding);

  .td-new-collection {
    flex: 1;
  }
}

.td-collection-edit-btn {
  display: flex;
  gap: var(--padding);
  opacity: 0;
  transition: opacity 0.2s;
}

.td-collection-header:hover .td-collection-edit-btn {
  opacity: 1;
}

.text-nowrap-collection {
  max-width: 200px !important;

  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.td-sidebar-menu {
  width: 100%;
}

.td-empty-hint {
  text-align: center;
  color: var(--text-secondary-color);
  font-size: var(--font-size-small);
  padding: var(--padding);
}
</style>
