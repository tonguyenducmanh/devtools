<template>
  <div class="flex td-pg-query-container">
    <div class="flex flex-col td-pg-query-main">
      <div class="flex flex-start td-tool-header-menu-group">
        <div class="flex flex-one td-header-menu-group">
          <div
            v-for="(items, menuKey) in menuConfig"
            :key="menuKey"
            class="td-menu-item"
            :class="{ 'td-menu-item--active': activeKeyFlyOut === menuKey }"
            @mouseenter="openFlyout(menuKey, $event)"
            @mouseleave="scheduleCloseFlyout()"
          >
            <span>{{ $t(`i18nCommon.postgreSQLQuery.${menuKey}`) }}</span>
          </div>
        </div>
        <TDButton
          :noMargin="true"
          @click="handleRunQuery"
          iconClass="td-send-icon"
          :isSmallButton="true"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.runQuery')"
        ></TDButton>
        <TDFlyoutPanel
          :show="!!activeKeyFlyOut"
          :anchorElFlyout="anchorElFlyout"
          placement="bottom"
          panel-class="td-query-action-flyout"
          @mouseenter="cancelCloseFlyOut"
          @mouseleave="scheduleCloseFlyout()"
        >
          <div
            v-for="action in currentMenuItems"
            :key="action.key"
            class="td-flyout-item"
            :class="{ 'td-toolbar-btn-disabled': action.disabled }"
            v-tooltip="action.tooltip"
            @click="onActionClick(action)"
          >
            <span>{{ action.label }}</span>
          </div>
        </TDFlyoutPanel>
      </div>
      <div
        class="flex flex-one td-pg-query-editor"
        :style="editorSectionSizeStyle"
      >
        <TDTextarea
          ref="sqlEditor"
          v-model="sqlText"
          language="pgsql"
          :enableHighlight="currentConfigLayout.enableHighlight"
          :wrapText="currentConfigLayout.wrapText"
          :placeHolder="$t('i18nCommon.postgreSQLQuery.sqlEditorPlaceholder')"
          :label="$t('i18nCommon.postgreSQLQuery.sqlEditorLabel')"
          :isLabelTop="true"
          height="100%"
          width="100%"
          :monacoOptions="monacoOptions"
          @keydown.ctrl.enter.prevent="handleRunQuery"
          @keydown.meta.enter.prevent="handleRunQuery"
        >
        </TDTextarea>
      </div>

      <TDResizer :direction="'vertical'" @resize="handleResize" />
      <div class="td-pg-query-result" :style="resultSectionSizeStyle">
        <div class="flex td-pg-result-loading" v-if="isRunning">
          <div class="loader"></div>
        </div>

        <template v-else>
          <div class="td-pg-result-error" v-if="queryError">
            {{ queryError }}
          </div>
          <div
            class="td-pg-result-empty"
            v-if="!hasQueryResults && !queryError"
          >
            <TDDynamicBackgroundEffect />
            <span>{{ $t("i18nCommon.noDataAvailable") }}</span>
          </div>
          <div
            v-else-if="hasQueryResults"
            class="flex flex-col td-pg-result-body"
          >
            <div
              class="flex td-pg-result-tabs-wrap"
              v-if="hasMultipleResultStatement"
            >
              <div class="flex td-pg-result-tabs">
                <div
                  v-for="(result, index) in queryResults"
                  :key="getResultTabKey(result, index)"
                  class="text-nowrap td-pg-result-tab-item"
                  :class="{
                    'td-pg-result-tab-item-active': activeResultIndex === index,
                  }"
                  @click="activateResultTab(index)"
                >
                  {{ getResultTabLabel(result, index) }}
                </div>
              </div>
            </div>
            <div class="flex flex-col flex-one td-pg-result-content">
              <div class="td-pg-result-table">
                <KeepAlive>
                  <TDTableViewer
                    v-if="activeQueryResult && activeQueryResult.is_select"
                    :key="activeResultCacheKey"
                    :tableData="activeQueryResult.rows"
                    :columns="activeTableColumns"
                    :noMargin="true"
                    :stickyHeader="true"
                    :showIndex="true"
                    :usingFooterHelp="true"
                    :showFooter="!hasMultipleResultStatement"
                    maxHeight="100%"
                  />
                </KeepAlive>
              </div>
              <div
                v-if="activeQueryResult && !activeQueryResult.is_select"
                class="flex td-pg-result-affected"
              >
                <TDDynamicBackgroundEffect />
                <span>
                  {{ $t("i18nCommon.postgreSQLQuery.rowsAffected") }}:
                  {{ activeQueryResult.rows_affected || 0 }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

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
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Help
          "
        >
          <TDPostgreSQLQueryHelp />
        </div>
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
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.autoSaveQueryAfterExec"
            :label="$t('i18nCommon.postgreSQLQuery.autoSaveQueryAfterExec')"
            @change="updateConfigLayout"
          />
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.loadFunctionIntellisense"
            :label="$t('i18nCommon.postgreSQLQuery.loadFunctionIntellisense')"
            @change="updateConfigLayout"
          />
        </div>
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Connection
          "
        >
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
                <!-- phần sửa nhanh tên thư mục request nếu đang ở chế độ edit -->
                <div v-if="group.is_renaming" class="td-collection-rename">
                  <TDInput
                    v-model="group.temp_name"
                    :noMargin="true"
                    :placeHolder="$t('i18nCommon.apiTesting.collectionRename')"
                    :ref="group.temp_name"
                    @keyup.enter="saveNewCollectionName(group)"
                    @clickOutSide="saveNewCollectionName(group)"
                  >
                  </TDInput>
                </div>
                <div
                  v-else
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
                    <div
                      v-tooltip="
                        group.name ||
                        $t('i18nCommon.postgreSQLQuery.ungrouped')
                      "
                    >
                      {{
                        group.name ||
                        $t("i18nCommon.postgreSQLQuery.ungrouped")
                      }}
                    </div>
                  </div>
                  <div class="flex td-collection-edit-btn" v-if="group.id">
                    <div
                      class="td-icon td-edit-icon"
                      v-tooltip="$t('i18nCommon.edit')"
                      @click.stop="enableRenameCollection(group)"
                    ></div>
                    <div
                      v-tooltip="$t('i18nCommon.postgreSQLQuery.addConnection')"
                      class="td-icon td-plus-icon"
                      @click.stop="openAddConnectionPopup(group.id)"
                    ></div>
                    <div
                      v-tooltip="$t('i18nCommon.postgreSQLQuery.deleteGroup')"
                      class="td-icon td-close-icon"
                      @click.stop="deleteGroup(group.id)"
                    ></div>
                  </div>
                  <div class="flex td-collection-edit-btn" v-else>
                    <div
                      v-tooltip="$t('i18nCommon.postgreSQLQuery.addConnection')"
                      class="td-icon td-plus-icon"
                      @click.stop="openAddConnectionPopup('')"
                    ></div>
                  </div>
                </div>
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
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.SQLSave
          "
        >
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
import pgQueries from "./templates.js";
import TDPostgreSQLIntellisenseMixin from "./TDPostgreSQLIntellisenseMixin.js";
import TDShortcutAction, {
  TDShortcutActionEnum,
} from "@/common/TDShortcutAction.js";
import TDDatabaseConnectionMixin from "@/mixins/TDDatabaseConnectionMixin.js";
import TDDynamicBackgroundEffect from "@/components/TDDynamicBackgroundEffect.vue";
import TDDotNetWasmMixin from "@/mixins/TDDotNetWasmMixin.js";
import TDFlyoutPanel from "@/components/TDFlyoutPanel.vue";
import { useFlyout } from "@/common/plugin/TDUseFlyout.js";
import { useTabManager } from "@/stores/TDTabManager.js";

export default {
  extends: TDToolBase,
  name: "TDPostgreSQLQuery",
  mixins: [
    TDDatabaseConnectionMixin,
    TDDotNetWasmMixin,
    TDPostgreSQLIntellisenseMixin,
  ],
  components: {
    TDSubSidebar,
    TDArrow,
    TDPostgreSQLQueryHelp,
    TDDynamicBackgroundEffect,
    TDFlyoutPanel,
  },

  setup() {
    const { openTab } = useTabManager();
    return { openTab, ...useFlyout() };
  },

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
        autoSaveQueryAfterExec: true,
        loadFunctionIntellisense: false,
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
      queryResult: null, // giữ lại tương thích code cũ
      queryResults: [], // mới: danh sách result theo từng statement
      activeResultIndex: 0,
      queryError: null,
      isRunning: false,
      isLoading: false,
      isLoadingIntellisense: false,

      // intellisense
      intellisenseDisposable: null,

      // api
      agentAPI: null,
    };
  },

  async mounted() {
    let me = this;
    me.agentAPI = new TDServerPostgreSQLAPI();
    await me.loadAllData();
    me.loadLastDatabaseConnect();
  },

  beforeUnmount() {
    // Cleanup monaco intellisense provider
    if (this.intellisenseDisposable) {
      this.intellisenseDisposable.forEach((d) => d?.dispose?.());
    }
  },

  computed: {
    menuConfig() {
      let me = this;
      return {
        codeComplete: [
          {
            key: "loadIntellisense",
            label: me.isLoadingIntellisense
              ? me.$t("i18nCommon.postgreSQLQuery.intellisenseLoading")
              : me.$t("i18nCommon.postgreSQLQuery.loadIntellisense"),
            disabled: !me.selectedConnectionId || me.isLoadingIntellisense,
            run: me.handleLoadIntellisense,
          },
        ],
        edit: [
          {
            key: "formatSQL",
            label: me.$t("i18nCommon.postgreSQLQuery.formatCode"),
            disabled: false,
            run: me.handleFormatSQL,
          },
          {
            key: "genUUID",
            label: me.$t("i18nCommon.help.genUUID"),
            disabled: false,
            run: me.genUUIDFunc,
          },
          {
            key: "saveQuery",
            label: me.$t("i18nCommon.postgreSQLQuery.saveQuery"),
            disabled: false,
            run: me.saveCurrentQuery,
          },
          {
            key: "addConnection",
            label: me.$t("i18nCommon.postgreSQLQuery.addConnection"),
            disabled: false,
            run: me.openAddConnectionPopup,
          },
        ],
        export: [
          {
            key: "copyResult",
            label: me.$t("i18nCommon.postgreSQLQuery.copyResult"),
            disabled: !me.canExportActiveResult,
            run: me.handleCopyResult,
          },
          {
            key: "downloadResponse",
            label: me.$t("i18nCommon.postgreSQLQuery.downloadResult"),
            disabled: !me.canExportActiveResult,
            run: me.handleDownloadReponse,
          },
          {
            key: "copyNpgSQLConnectionString",
            label: me.$t(
              "i18nCommon.postgreSQLQuery.copyNpgSQLConnectionString",
            ),
            disabled: !me.selectedConnectionId,
            run: me.handleCopyNpgSQLConnectionString,
          },
        ],
        explore: [
          {
            key: "runQuery",
            label: me.$t("i18nCommon.postgreSQLQuery.runQuery"),
            disabled: !me.selectedConnectionId || me.isRunning,
            run: me.handleRunQuery,
          },
          {
            key: "openInspect",
            label: me.$t("i18nCommon.postgreSQLQuery.dbInspect.title"),
            disabled: !me.selectedConnectionId,
            run: me.handleOpenInspect,
          },
        ],
        help: [
          {
            key: "testConnection",
            label: me.$t("i18nCommon.apiTesting.testConnection"),
            disabled: !me.selectedConnectionId || me.isRunning,
            run: me.handleTestConnection,
          },
          {
            key: "reloadDatabase",
            label: me.$t("i18nCommon.postgreSQLQuery.reloadDatabase"),
            run: me.loadAllData,
          },
          {
            key: "templatePostgresSQL",
            label: me.$t("i18nCommon.feature.PostgreSQLTemplate"),
            run: me.openCodePostgresqlTemplate,
          },
        ],
      };
    },
    currentMenuItems() {
      return this.menuConfig[this.activeKeyFlyOut] ?? [];
    },
    /**
     * kiểm tra xem có phải có nhiều reuslt trả về không
     */
    hasMultipleResultStatement() {
      let me = this;
      return me.queryResults && me.queryResults.length > 1;
    },
    monacoOptions() {
      let me = this;
      return {
        onInit: (editor, monacoInstance) => {
          // Đăng ký tổ hợp phím Ctrl + U (hoặc Cmd + U trên Mac) trực tiếp vào Monaco
          editor.addCommand(
            monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyU,
            () => {
              me.endEditFromEditor(editor, this.handleFormatSQL);
            },
          );
          editor.addCommand(
            monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.Enter,
            () => {
              me.endEditFromEditor(editor, this.handleRunQuery);
            },
          );
        },
      };
    },
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
     * Có result hay không
     */
    hasQueryResults() {
      return Array.isArray(this.queryResults) && this.queryResults.length > 0;
    },

    /**
     * Result đang active
     */
    activeQueryResult() {
      if (!this.hasQueryResults) return null;
      return this.queryResults[this.activeResultIndex] ?? null;
    },

    /**
     * Giữ tương thích với code cũ nào còn đọc queryResult
     */
    currentQueryResultCompat() {
      return this.activeQueryResult || this.queryResult || null;
    },

    /**
     * Columns cho TDTableViewer từ result active
     * Có title theo table_names nếu backend có trả về
     */
    activeTableColumns() {
      let result = this.activeQueryResult;
      if (!result?.columns?.length) return null;

      return result.columns.map((col, index) => {
        const tableName = result.table_names?.[index] || "";
        return {
          key: col,
          label: col,
          sortable: true,
          autoWidth: true,
          title: tableName ? `${tableName}.${col}` : col,
        };
      });
    },

    /**
     * fallback tương thích code cũ
     */
    tableColumns() {
      return this.activeTableColumns;
    },

    /**
     * export/copy chỉ cho phép với SELECT đang active
     */
    canExportActiveResult() {
      return !!(
        this.activeQueryResult &&
        this.activeQueryResult.is_select &&
        this.activeQueryResult.rows &&
        this.activeQueryResult.rows.length > 0
      );
    },

    activeResultCacheKey() {
      if (!this.activeQueryResult) return "pg-result-empty";
      return `pg-result-${this.activeResultIndex}-${this.activeQueryResult.is_select ? "select" : "command"}`;
    },
  },

  methods: {
    /**
     * Xử lý khi click 1 item trong flyout action: bỏ qua nếu đang disabled,
     * chạy action tương ứng rồi đóng flyout lại.
     */
    onActionClick(action) {
      if (action.disabled) return;
      action.run();
      this.closeFlyout();
    },

    handleResize(sizes) {
      this.editorSectionSize = sizes.leftSize;
      this.resultSectionSize = sizes.rightSize;
    },

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
    enableRenameCollection(collectionFromView) {
      let me = this;
      // collectionFromView là bản sao tạm do computed groupedConnections tạo ra,
      // phải tìm đúng object gốc trong allGroups thì set mới reactive/persist được
      let collection = me.allGroups.find((g) => g.id === collectionFromView.id);
      if (collection) {
        collection.is_renaming = true;
        collection.temp_name = collection.name;
        this.$nextTick(() => {
          if (me.$refs && me.$refs[collection.temp_name]) {
            let refs = me.$refs[collection.temp_name];
            if (refs) {
              if (Array.isArray(refs)) {
                refs[0].focus();
              } else {
                refs.focus();
              }
            }
          }
        });
      }
    },
    async saveNewCollectionName(collectionFromView) {
      let me = this;
      let collection = me.allGroups.find((g) => g.id === collectionFromView.id);
      if (collection) {
        delete collection.is_renaming;
        if (
          collection.temp_name &&
          collectionFromView.temp_name !== collection.name
        ) {
          try {
            let response = await me.agentAPI.connectionGroup.update({
              id: collection.id,
              name: collectionFromView.temp_name,
            });
            if (response && response.success && response.data?.success) {
              await me.loadAllData();
            }
          } catch (e) {
            me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
          }
        }
      }
    },
    normalizeMultiQueryResult(payload) {
      if (payload && Array.isArray(payload.results)) {
        return payload.results
          .map((item) => this.normalizeSingleResult(item))
          .filter(Boolean);
      }
      if (payload && typeof payload === "object") {
        const one = this.normalizeSingleResult(payload);
        return one ? [one] : [];
      }

      return [];
    },

    activateResultTab(index) {
      if (index < 0 || index >= this.queryResults.length) return;
      this.activeResultIndex = index;
      this.queryResult = this.queryResults[index] || null; // tương thích code cũ
    },

    getResultTabKey(result, index) {
      return `${index}-${result?.is_select ? "select" : "command"}-${result?.rows_affected ?? 0}`;
    },

    getResultTabLabel(result, index) {
      let labelTab = null;
      try {
        if (!result) {
          `${index + 1} result`;
        }
        let rowEffect = result.rows_affected ?? result.rows?.length ?? 0;
        let tableName = null;
        if (result.is_select) {
          tableName = result.table_names?.find((x) => !!x);
          if (tableName) labelTab = `${index + 1} ${tableName}`;
          else {
            labelTab = `${index + 1} select`;
          }
        } else {
          labelTab = `${index + 1} command`;
        }
        if (rowEffect) {
          labelTab = `${labelTab} ${rowEffect} ${this.$t("i18nCommon.record")}`;
        }
      } catch (error) {}
      return labelTab;
    },

    resetQueryResults() {
      this.queryResult = null;
      this.queryResults = [];
      this.activeResultIndex = 0;
      this.queryError = null;
    },

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
          g.is_renaming = false;
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

    toggleGroup(groupKey) {
      this.openGroups[groupKey] = !this.openGroups[groupKey];
    },

    selectConnection(conn) {
      let me = this;
      me.selectedConnectionId = conn.id;
      // gán lại cache
      me.$tdCache.set(
        me.$tdEnum.cacheConfig.PostgreSQLLastConnectionId,
        conn.id,
      );
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
            me.resetQueryResults();
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
      me.resetQueryResults();

      try {
        const response = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          me.sqlText,
        );

        const normalizedResults = me.normalizeMultiQueryResult(
          response?.data?.data,
        );

        me.queryResults = normalizedResults;
        me.activeResultIndex = normalizedResults.length > 0 ? 0 : 0;
        me.queryResult = normalizedResults[0] || null;

        if (!response?.data?.success) {
          me.queryError =
            response?.data?.message ?? me.$t("i18nCommon.toastMessage.error");
        }
      } catch (error) {
        me.resetQueryResults();
        me.queryError =
          error?.message ?? me.$t("i18nCommon.toastMessage.error");
      } finally {
        me.isRunning = false;
        // lưu lại luôn câu lệnh vừa chạy của user
        if (me.currentConfigLayout.autoSaveQueryAfterExec) {
          me.saveCurrentQuery();
        }
      }
    },
    handleCopyNpgSQLConnectionString() {
      let me = this;
      if (!me.checkInitDotNetWasm()) return;

      let conn = me.allConnections.find(
        (c) => c.id === me.selectedConnectionId,
      );
      if (!conn?.connection_string) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.noConnectionString"),
        );
        return;
      }

      try {
        let connStr = conn.connection_string;
        let fields = {
          host: "",
          port: 5432,
          user_name: "",
          password: "",
          database_name: "",
        };

        if (
          connStr.startsWith("postgresql://") ||
          connStr.startsWith("postgres://")
        ) {
          const url = new URL(connStr);
          fields.host = url.hostname || "";
          fields.port = parseInt(url.port) || 5432;
          fields.database_name =
            url.pathname?.replace(/^\//, "") || "";
          fields.user_name =
            decodeURIComponent(url.username || "");
          fields.password =
            decodeURIComponent(url.password || "");
        } else {
          const parts =
            connStr.match(/(?:[^\s']+|'[^']*')+/g) || [];
          parts.forEach((p) => {
            const eqIdx = p.indexOf("=");
            if (eqIdx > -1) {
              const key = p.substring(0, eqIdx).trim();
              let val = p.substring(eqIdx + 1).trim();
              if (
                val.startsWith("'") &&
                val.endsWith("'")
              ) {
                val = val
                  .substring(1, val.length - 1)
                  .replace(/\\'/g, "'");
              }
              if (key === "host") fields.host = val;
              if (key === "port")
                fields.port = parseInt(val) || 5432;
              if (key === "user")
                fields.user_name = val;
              if (key === "password")
                fields.password = val;
              if (key === "dbname")
                fields.database_name = val;
            }
          });
        }

        const jsonStr = JSON.stringify(fields);
        const npgSqlConnStr =
          me.dotnetExports.StringifyNpgSQLConnection(jsonStr);

        me.$tdUtility.copyToClipboard(npgSqlConnStr);
      } catch (e) {
        console.error(e);
        me.$tdToast.error(
          me.$t("i18nCommon.toastMessage.error"),
        );
      }
    },
    async handleTestConnection() {
      if (!this.selectedConnectionId) return;
      await this.testDatabaseConnection(
        this.agentAPI,
        this.selectedConnectionId,
      );
    },

    handleFormatSQL() {
      let me = this;
      if (!me.sqlText?.trim()) return;
      try {
        me.sqlText = sqlFormat(me.sqlText, {
          language: "postgresql",
          indent: "  ",
          uppercase: true,
        });
      } catch {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    buildResultForCopy() {
      const result = this.activeQueryResult;
      if (!result?.is_select || !result?.rows?.length) return "";
      return JSON.stringify(result.rows, null, 2);
    },

    handleCopyResult() {
      let me = this;
      let queryResultText = me.buildResultForCopy();
      if (queryResultText) {
        try {
          me.$tdUtility.copyToClipboard(queryResultText);
        } catch {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
        }
      }
    },

    handleDownloadReponse() {
      let me = this;
      let queryResultText = me.buildResultForCopy();

      if (queryResultText) {
        let encoder = new TextEncoder();
        let buffer = encoder.encode(queryResultText); // Uint8Array
        let fileName = me.$tdUtility.createFileDownloadName("result_query", {
          ext: ".txt",
        });
        me.$tdUtility.createDownloadFileFromBuffer(
          buffer,
          "text/plain;charset=utf-8",
          fileName,
        );
      }
    },
    async saveCurrentQuery() {
      let me = this;
      if (!me.sqlText?.trim()) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.sqlContent") +
            " " +
            me.$t("i18nCommon.toastMessage.required"),
        );
        return;
      }
      // không ép user phải nhập tên mới cho cất
      let queryName = me.newQueryName || me.sqlText;
      queryName = (queryName || "").substring(0, 100);
      try {
        let response = await me.agentAPI.savedQuery.create({
          query_name: queryName,
          connection_id: me.selectedConnectionId ?? "",
          query_text: me.sqlText,
        });
        if (response?.data?.success) {
          me.currentSavedQueryId = response.data.data?.id;
          me.newQueryName = "";
          await me.loadSavedQueries();
        }
      } catch {
        me.$tdToast.error(me.$t("i18nCommon.postgreSQLQuery.saveQueryErr"));
      }
    },

    async handleOpenInspect() {
      let me = this;
      if (!me.selectedConnectionId) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.noConnectionSelected"),
        );
        return;
      }
      await TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLInspect,
        ownerForm: me,
        param: { connectionId: me.selectedConnectionId },
      });
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
    /**
     * Hàm này được gọi khi tab được active hoặc khi component được mount (nếu đang active)
     * Component con cần add event (ví dụ listener trên window/document) thì override lại
     */
    onTabEnter() {
      let me = this;
      TDShortcutAction.unregisterByEnum(
        TDShortcutActionEnum.FormatCodeTextEditor,
      );
      TDShortcutAction.register(
        "formatCodePostgreSQL",
        me.getConfigFormatCode(),
      );
      TDShortcutAction.register(
        "executePosgreSQLCode",
        me.getConfigExecuteSQLCode(),
      );
    },

    /**
     * Hàm này được gọi khi tab bị inactive hoặc trước khi component bị unmount (nếu đang active)
     * Component con cần remove event thì override lại
     */
    onTabLeave() {
      let me = this;
      TDShortcutAction.registerByEnum(
        TDShortcutActionEnum.FormatCodeTextEditor,
      );
      TDShortcutAction.unregister("formatCodePostgreSQL");
      TDShortcutAction.unregister("executePosgreSQLCode");
    },
    getConfigFormatCode() {
      let me = this;
      let configKeyboard = {
        sortOrder: 4,
        key: me.$tdUtility.newGuid(),
        presentKey: [me.$tdUtility.ctrlKey(), "u"],
        labelKey: "i18nCommon.shortKeyAction.formatCodeTextEditor",
      };
      return configKeyboard;
    },
    getConfigExecuteSQLCode() {
      let me = this;
      let configKeyboard = {
        sortOrder: 5,
        key: me.$tdUtility.newGuid(),
        presentKey: [me.$tdUtility.altKey(), me.$tdUtility.enterKey()],
        labelKey: "i18nCommon.postgreSQLQuery.runQuery",
      };
      return configKeyboard;
    },
    /**
     * kết thúc việc edit từ event bên trong editor
     * @param editor
     */
    endEditFromEditor(editor, callback) {
      let me = this;
      // 1. Lấy trực tiếp nội dung mới nhất đang nằm trong Monaco Editor
      let currentText = editor.getValue();

      // 2. Gán thẳng nội dung này vào biến sqlText của Vue (thay thế cho việc đợi sự kiện blur)
      me.sqlText = currentText;
      // 3. Sử dụng $nextTick để chắc chắn Vue đã nhận giá trị mới trước khi gọi hàm format
      this.$nextTick(() => {
        if (callback && typeof callback == "function") {
          callback();
        }
      });
    },
    /**
     * Mở danh sách code mẫu ra để xem
     */
    openCodePostgresqlTemplate() {
      this.openTab({
        titleKey: "i18nCommon.feature.PostgreSQLTemplate",
        groupPath: "",
        component: () =>
          import("@/views/tools/codeTemplateTools/PostgreSQLTemplate/TDPostgreSQLTemplate.vue"),
      });
    },
    genUUIDFunc() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.$tdUtility.newGuid());
    },
    async loadLastDatabaseConnect() {
      let me = this;
      let oldSelectedConnection = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.PostgreSQLLastConnectionId,
      );
      if (
        oldSelectedConnection &&
        me.allConnections &&
        Array.isArray(me.allConnections) &&
        me.allConnections.length > 0
      ) {
        let oldConnection = me.allConnections.find(
          (x) => x.id == oldSelectedConnection,
        );
        if (oldConnection) {
          me.selectConnection(oldConnection);
        }
      }
    },
  },

  watch: {
    // Khi đổi connection thì load intellisense từ cache
    async selectedConnectionId(newId) {
      if (newId) {
        await this.loadCachedIntellisense();
      }
      let conn = this.allConnections.find((c) => c.id === newId);
      this.reBuildTabTitle(conn ? conn.connection_name : null);
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

.td-pg-query-editor {
  min-height: 0;
  width: 100%;
  gap: var(--padding);
  position: relative;
}

.td-pg-query-result {
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  .td-pg-result-body {
    width: 100%;
    height: 100%;
    gap: var(--padding);
    .td-pg-result-tabs-wrap {
      width: 100%;
      .td-pg-result-tabs {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        align-items: center;
        justify-content: flex-start;
        gap: var(--padding);
        background-color: var(--bg-layer-color);
        border-radius: var(--border-radius);
        padding: calc(var(--padding) / 2);

        .td-pg-result-tab-item {
          flex-shrink: 0;
          font-size: var(--font-size-small);
          color: var(--text-secondary-color);
          border-radius: var(--border-radius-component);
          padding: calc(var(--padding) / 2);
          cursor: pointer;
          background: var(--bg-layer-color);
        }
        .td-pg-result-tab-item:hover {
          background: var(--border-color);
        }
        .td-pg-result-tab-item-active {
          background: var(--bg-main-color);
        }
        .td-pg-result-tab-item-active:hover {
          background: var(--bg-main-color);
        }
      }
    }

    .td-pg-result-content {
      width: 100%;
      min-height: 0;
      .td-pg-result-table {
        height: 100%;
        width: 100%;
      }
    }
  }
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
  color: var(--text-error-color);
  background-color: var(--bg-thirt-color);
  border-radius: var(--border-radius);
  word-break: break-all;
  flex: 1;
}

.td-pg-result-affected {
  width: 100%;
  height: 100%;
  position: relative;
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
  position: relative;
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
.td-collection-rename {
  width: 100%;
}

.td-tool-header-menu-group {
  width: 100%;
  align-items: center;
  justify-content: space-between;
  .td-header-menu-group {
    justify-content: flex-start;
  }
}
</style>
