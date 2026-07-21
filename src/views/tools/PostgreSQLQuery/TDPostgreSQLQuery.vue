<template>
  <!-- container chính: chia làm 2 phần (main + sidebar) -->
  <div class="flex td-pg-query-container">
    <div class="flex flex-col td-pg-query-main">
      <!-- header toolbar: menu flyout ở trái, nút Run Query ở phải -->
      <div class="flex flex-start td-tool-header-menu-group">
        <div class="flex flex-one flex-wrap td-header-menu-group">
          <!-- từng menu item (Code Complete, Edit, Export, Explore, Help) -->
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
        <!-- nút chạy query -->
        <TDButton
          :noMargin="true"
          @click="handleRunQuery"
          iconClass="td-send-icon"
          :isSmallButton="true"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.runQuery')"
        ></TDButton>
        <!-- flyout panel chứa danh sách action theo menu đang active -->
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
      <!-- editor SQL Monaco (chiếm phần trên, có thể kéo resize) -->
      <div
        class="flex flex-one td-pg-query-editor"
        :style="editorSectionSizeStyle"
      >
        <TDTextEditor
          ref="sqlEditor"
          v-model="sqlText"
          language="pgsql"
          :enableHighlight="true"
          :wrapText="currentConfigLayout.wrapText"
          :placeHolder="$t('i18nCommon.postgreSQLQuery.sqlEditorPlaceholder')"
          :label="$t('i18nCommon.postgreSQLQuery.sqlEditorLabel')"
          :isLabelTop="true"
          height="100%"
          width="100%"
          :monacoOptions="monacoOptions"
          @keydown.ctrl.enter.prevent="handleRunQuery"
          @keydown.meta.enter.prevent="handleRunQuery"
          :showCursorTextFooter="true"
        >
        </TDTextEditor>
      </div>

      <!-- thanh kéo resize phân cách editor và result -->
      <TDResizer :direction="'vertical'" @resize="handleResize" />

      <!-- khu vực hiển thị kết quả query (chiếm phần dưới) -->
      <div class="td-pg-query-result" :style="resultSectionSizeStyle">
        <!-- loading spinner khi đang chạy query -->
        <div class="flex td-pg-result-loading" v-if="isRunning">
          <div class="loader"></div>
        </div>

        <template v-else>
          <!-- hiển thị lỗi nếu có -->
          <div class="td-pg-result-error" v-if="queryError">
            {{ queryError }}
          </div>
          <!-- màn hình chờ nếu chưa có kết quả -->
          <div class="td-pg-result-empty" v-else-if="!hasQueryResults">
            <TDDynamicBackgroundEffect />
          </div>
          <!-- kết quả query (hỗ trợ multi-statement với tabs) -->
          <div v-else class="flex flex-col td-pg-result-body">
            <!-- tabs chuyển đổi giữa các result (khi query có nhiều câu lệnh) -->
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
              <!-- bảng hiển thị dữ liệu SELECT (dùng KeepAlive để giữ cache) -->
              <div
                v-if="activeQueryResult && activeQueryResult.is_select"
                class="td-pg-result-table"
              >
                <KeepAlive>
                  <TDTableViewer
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
              <!-- hiển thị số dòng bị ảnh hưởng (INSERT/UPDATE/DELETE) -->
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

    <!-- sidebar phải: chứa các tab Help / Setting / Connection / SQL Save -->
    <TDSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <!-- thanh menu trên sidebar (slide option để chuyển tab) -->
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
        <!-- tab Help: hướng dẫn sử dụng -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Help
          "
        >
          <TDPostgreSQLQueryHelp />
        </div>

        <!-- tab Setting: cấu hình editor, intellisense, giới hạn kết quả -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Setting
          "
        >
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
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.limitResults"
            :label="$t('i18nCommon.postgreSQLQuery.resultLimit')"
            v-tooltip="$t('i18nCommon.postgreSQLQuery.resultLimitDesc')"
            @change="updateConfigLayout"
          />
          <div
            class="td-query-config"
            v-show="currentConfigLayout.limitResults"
          >
            <TDInput
              :noMargin="true"
              inputType="number"
              :modelValue="currentConfigLayout.defaultQueryLimit"
              :label="$t('i18nCommon.postgreSQLQuery.defaultQueryLimit')"
              :isLabelTop="false"
              v-tooltip="$t('i18nCommon.postgreSQLQuery.defaultQueryLimitDesc')"
              @update:modelValue="
                (v) => {
                  currentConfigLayout.defaultQueryLimit = Number(v);
                  updateConfigLayout();
                }
              "
            />
          </div>
        </div>

        <!-- tab Connection: danh sách kết nối database được nhóm theo group -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.Connection
          "
        >
          <!-- header: input tạo group mới + nút add group + nút reload -->
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
          <!-- danh sách group và connection -->
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
                <!-- chế độ rename group -->
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
                <!-- header group (click để expand/collapse) -->
                <div
                  v-else
                  class="flex td-collection-header"
                  @click="toggleGroup(group.id || '__ungrouped__')"
                >
                  <div class="flex text-nowrap td-collection-header-left">
                    <!-- mũi tên chỉ trạng thái expand/collapse -->
                    <TDArrow
                      :openProp="openGroups[group.id || '__ungrouped__']"
                      :arrowOpenDirection="$tdEnum.Direction.bottom"
                      :arrowDirection="$tdEnum.Direction.right"
                    />
                    <div
                      v-tooltip="
                        group.name || $t('i18nCommon.postgreSQLQuery.ungrouped')
                      "
                    >
                      {{
                        group.name || $t("i18nCommon.postgreSQLQuery.ungrouped")
                      }}
                    </div>
                  </div>
                  <!-- nút edit/add/delete group (chỉ hiện khi hover) -->
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
                <!-- danh sách connection trong group -->
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
                    <!-- nút edit/delete connection (chỉ hiện khi hover) -->
                    <span class="td-collection-item-edit-btn">
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

        <!-- tab SQL Save: danh sách query đã lưu -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ===
            $tdEnum.PostgreSQLQuerySidebarOption.SQLSave
          "
        >
          <!-- header: input tên query + nút save + nút reload -->
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
            <div class="td-collection-body">
              <div
                v-for="(q, qi) in allSavedQueries"
                :key="qi"
                class="flex td-collection-request-item"
                :class="{
                  'td-collection-request-item-selected':
                    currentSavedQueryId === q.id,
                }"
                @click="loadSavedQuery(q)"
              >
                <span class="text-nowrap flex-one td-sql-text">
                  <div v-tooltip="q.query_name">{{ q.query_name }}</div>
                </span>
                <span class="td-collection-item-edit-btn">
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
import { pgQueries } from "@/templates/postgresqlToolQuery/templates.js";
import TDPostgreSQLIntellisenseMixin from "./TDPostgreSQLIntellisenseMixin.js";
import { registerPgsqlFormatProvider } from "@/components/monarch/pgsql/pgsqlFormatProvider.js";
import { TDShortcutActionEnum } from "@/common/TDShortcutAction.js";
import TDDatabaseConnectionMixin from "@/mixins/TDDatabaseConnectionMixin.js";
import TDDynamicBackgroundEffect from "@/components/TDDynamicBackgroundEffect.vue";
import TDDotNetWasmMixin from "@/mixins/TDDotNetWasmMixin.js";
import TDFlyoutPanel from "@/components/TDFlyoutPanel.vue";
import { useFlyout } from "@/common/plugin/TDUseFlyout.js";
import { useTabManager } from "@/stores/TDTabManager.js";

export default {
  extends: TDToolBase,
  name: "TDPostgreSQLQuery",
  /**
   * Mixin xử lý kết nối database, dotnet wasm, và intellisense
   */
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
      /**
       * Key dùng để cache layout config vào IndexedDB
       */
      keyCacheLayout: this.$tdEnum.cacheConfig.PostgreSQLQueryConfigLayout,
      /**
       * Cấu hình layout mặc định của tool
       */
      currentConfigLayout: {
        isShowSidebar: true, // Hiển thị sidebar
        wrapText: false, // Không wrap text
        showReponse: true,
        splitHorizontal: true,
        currentSidebarOption:
          this.$tdEnum.PostgreSQLQuerySidebarOption.Connection,
        autoSaveQueryAfterExec: true, // Tự động lưu query sau khi chạy
        loadFunctionIntellisense: true, // Tải intellisense cho function
        defaultQueryLimit: 1000, // Giới hạn số dòng mặc định
        limitResults: true, // Bật giới hạn kết quả
        limitResultsBackup: 1000,
      },
      /**
       * Lưu text query lần auto-save gần nhất để tránh save trùng
       */
      lastAutoSavedQueryText: "",
      lastAutoSavedConnectionId: "",

      /**
       * Kích thước editor/result (chia theo %)
       */
      editorSectionSize: 50,
      resultSectionSize: 50,

      // ── Connection ───────────────────────────────────────────────────
      selectedConnectionId: "",
      allGroups: [], // Danh sách nhóm connection
      allConnections: [], // Danh sách tất cả connection
      openGroups: {}, // Trạng thái đóng/mở của từng nhóm
      newGroupName: "", // Tên nhóm mới khi tạo

      // ── Saved Queries ────────────────────────────────────────────────
      allSavedQueries: [],
      newQueryName: "",
      currentSavedQueryId: null,

      // ── Editor ───────────────────────────────────────────────────────
      sqlText: "",

      // ── Results ──────────────────────────────────────────────────────
      queryResult: null, // Tương thích code cũ
      queryResults: [], // Danh sách result theo từng statement
      activeResultIndex: 0, // Index của result tab đang active
      queryError: null, // Lỗi query (nếu có)
      isRunning: false, // Đang chạy query
      isLoading: false, // Đang tải connections
      isLoadingIntellisense: false, // Đang tải intellisense data

      // ── Intellisense ─────────────────────────────────────────────────
      intellisenseDisposable: null,

      // ── API ──────────────────────────────────────────────────────────
      agentAPI: null,
    };
  },

  /**
   * Khởi tạo tool: tạo API instance, load connections/saved queries, khôi phục connection cuối
   */
  async mounted() {
    let me = this;
    me.agentAPI = new TDServerPostgreSQLAPI();
    await me.loadAllData();
    me.loadLastDatabaseConnect();
  },

  /**
   * Dọn dẹp khi component bị huỷ (đã xử lý qua onTabLeave → disposeIntellisense)
   */
  beforeUnmount() {},

  computed: {
    /**
     * Cấu hình menu flyout ở header tool, phân loại theo nhóm chức năng
     */
    menuConfig() {
      let me = this;
      return {
        // Nhóm Code Complete: load/cache/clone intellisense data
        codeComplete: [
          {
            key: "loadIntellisense",
            label: me.isLoadingIntellisense
              ? me.$t("i18nCommon.postgreSQLQuery.intellisenseLoading")
              : me.$t("i18nCommon.postgreSQLQuery.loadIntellisense"),
            disabled: !me.selectedConnectionId || me.isLoadingIntellisense,
            run: me.handleLoadIntellisense,
          },
          {
            key: "loadCachedIntellisense",
            label: me.$t("i18nCommon.postgreSQLQuery.loadCachedIntellisense"),
            disabled: !me.selectedConnectionId,
            run: me.loadCachedIntellisense,
          },
          {
            key: "cloneIntellisense",
            label: me.$t("i18nCommon.postgreSQLQuery.cloneIntellisense"),
            disabled: !me.selectedConnectionId,
            run: me.handleCloneIntellisense,
          },
        ],
        // Nhóm Edit: format SQL, gen UUID, lưu query, thêm connection
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
        // Nhóm Export: copy/download kết quả, copy connection string
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
          {
            key: "copyDSNConnectionString",
            label: me.$t("i18nCommon.postgreSQLQuery.copyDSNConnectionString"),
            disabled: !me.selectedConnectionId,
            run: me.handleCopyDSNConnectionString,
          },
        ],
        // Nhóm Explore: chạy query, inspect object, xem danh sách database, backup/restore/clone
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
          {
            key: "openDatabaseList",
            label: me.$t("i18nCommon.postgreSQLQuery.dbList.title"),
            disabled: !me.selectedConnectionId,
            run: me.handleOpenDatabaseList,
          },
          {
            key: "backupDatabase",
            label: me.$t(
              "i18nCommon.postgreSQLQuery.databaseOps.menuBackupDatabase",
            ),
            disabled: false,
            run: me.handleOpenBackupPopup,
          },
          {
            key: "restoreDatabase",
            label: me.$t(
              "i18nCommon.postgreSQLQuery.databaseOps.menuRestoreDatabase",
            ),
            disabled: false,
            run: me.handleOpenRestorePopup,
          },
          {
            key: "cloneDatabase",
            label: me.$t(
              "i18nCommon.postgreSQLQuery.databaseOps.menuCloneDatabase",
            ),
            disabled: false,
            run: me.handleOpenClonePopup,
          },
        ],
        // Nhóm Help: test connection, reload, xem template
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
    /**
     * Lấy danh sách menu items của flyout đang mở
     */
    currentMenuItems() {
      return this.menuConfig[this.activeKeyFlyOut] ?? [];
    },
    /**
     * Kiểm tra xem có nhiều hơn 1 result tab không (khi query nhiều statement)
     */
    hasMultipleResultStatement() {
      let me = this;
      return me.queryResults && me.queryResults.length > 1;
    },
    /**
     * Cấu hình Monaco Editor: actions, keybindings, context menu
     */
    monacoOptions() {
      let me = this;
      return {
        onInit: (editor, monacoInstance) => {
          registerPgsqlFormatProvider(monacoInstance);

          // Action: chạy query (Alt+Enter hoặc Ctrl+Enter)
          editor.addAction({
            id: "execute-pg-sql",
            label: me.$t("i18nCommon.postgreSQLQuery.runQuery"),
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.1,
            keybindings: [
              monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
            ],
            run: () => {
              me.endEditFromEditor(editor, me.handleRunQuery);
            },
          });

          // Action: Inspect object DDL (F12) - xem định nghĩa table/view/function
          editor.addAction({
            id: "inspect-pg-object",
            label: me.$t("i18nCommon.postgreSQLQuery.dbInspect.inspectObject"),
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.3,
            keybindings: [monacoInstance.KeyCode.F12],
            run: async (ed) => {
              const position = ed.getPosition();
              const model = ed.getModel();
              if (!position || !model) return;

              // lấy từ tại vị trí con trỏ (vd: "sample_data" hoặc "account_object")
              const word = model.getWordAtPosition(position);
              if (!word) {
                me.$tdToast.warning(
                  me.$t(
                    "i18nCommon.postgreSQLQuery.dbInspect.noObjectSelected",
                  ),
                );
                return;
              }
              let objectName = word.word;
              let schemaName = "";

              // kiểm tra phía trước từ có schema prefix không (vd: "sme.account_object")
              // regex: khớp 1 từ [a-zA-Z0-9_]+ + dấu chấm ở cuối trước vị trí con trỏ
              // ([a-zA-Z0-9_]+) - capturing group: tên schema
              // \.$ - dấu chấm + end-of-string (end of đoạn textBeforeWord)
              // ví dụ: "select * from sme." -> dotMatch[1] = "sme"
              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforeWord = lineContent.substring(
                0,
                word.startColumn - 1,
              );
              const dotMatch = textBeforeWord.match(/([a-zA-Z0-9_]+)\.$/);
              if (dotMatch) {
                schemaName = dotMatch[1];
              }

              if (!objectName) {
                me.$tdToast.warning(
                  me.$t(
                    "i18nCommon.postgreSQLQuery.dbInspect.noObjectSelected",
                  ),
                );
                return;
              }

              // Tra cứu loại object (table/view/function) từ inspectLookup đã build sẵn
              let searchType = "";
              let resolvedSchema = schemaName;

              if (me._inspectLookup) {
                const w = objectName.toLowerCase();
                const s = schemaName.toLowerCase();
                const key = s ? `${s}.${w}` : w;

                if (me._inspectLookup.tables.has(key)) {
                  searchType = "table";
                  if (!resolvedSchema)
                    resolvedSchema = me._inspectLookup.tables.get(key).schema;
                } else if (me._inspectLookup.views.has(key)) {
                  searchType = "view";
                  if (!resolvedSchema)
                    resolvedSchema = me._inspectLookup.views.get(key).schema;
                } else if (me._inspectLookup.functions.has(key)) {
                  searchType = "function";
                  if (!resolvedSchema)
                    resolvedSchema =
                      me._inspectLookup.functions.get(key).schema;
                }
              }

              // Mở dialog inspect object (fallback "table" nếu không xác định được type)
              me.handleOpenInspectWithSearch(
                searchType || "table",
                objectName,
                resolvedSchema || "",
              );
            },
          });
        },
      };
    },
    /**
     * Các tab trong sidebar: Help, Setting, Connection, SQL Save
     */
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

    /**
     * Danh sách connection dạng dropdown option
     */
    connectionOptions() {
      return this.allConnections.map((c) => ({
        value: c.id,
        label: c.connection_name,
      }));
    },

    /**
     * Style cho vùng kết quả (chiều cao theo %)
     */
    resultSectionSizeStyle() {
      return { height: `${this.resultSectionSize}%` };
    },
    /**
     * Style cho vùng editor (chiều cao theo %)
     */
    editorSectionSizeStyle() {
      return { height: `${this.editorSectionSize}%` };
    },

    /**
     * Nhóm connections theo group, thêm nhóm "ungrouped" cho connection không có group
     */
    groupedConnections() {
      let groups = this.allGroups.map((g) => ({ ...g, items: [] }));
      groups.push({ id: "", name: "", items: [] });

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
     * Kiểm tra có kết quả query hay không
     */
    hasQueryResults() {
      return Array.isArray(this.queryResults) && this.queryResults.length > 0;
    },

    /**
     * Lấy result đang active (theo tab index)
     */
    activeQueryResult() {
      if (!this.hasQueryResults) return null;
      return this.queryResults[this.activeResultIndex] ?? null;
    },

    /**
     * Tương thích ngược: một số code cũ đọc queryResult
     */
    currentQueryResultCompat() {
      return this.activeQueryResult || this.queryResult || null;
    },

    /**
     * Tạo cấu hình columns cho TDTableViewer từ result active
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
     * Fallback tương thích code cũ
     */
    tableColumns() {
      return this.activeTableColumns;
    },

    /**
     * Chỉ cho phép export/copy khi result là SELECT và có dữ liệu
     */
    canExportActiveResult() {
      return !!(
        this.activeQueryResult &&
        this.activeQueryResult.is_select &&
        this.activeQueryResult.rows &&
        this.activeQueryResult.rows.length > 0
      );
    },

    /**
     * Key cho KeepAlive cache của TDTableViewer, change khi đổi tab kết quả
     */
    activeResultCacheKey() {
      if (!this.activeQueryResult) return "pg-result-empty";
      return `pg-result-${this.activeResultIndex}-${this.activeQueryResult.is_select ? "select" : "command"}`;
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
     * Chuẩn hoá cấu trúc result từ backend về format đồng nhất
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

    /**
     * Kích hoạt chế độ rename collection (tìm object gốc trong allGroups để reactive)
     */
    enableRenameCollection(collectionFromView) {
      let me = this;
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

    /**
     * Lưu tên mới của collection sau khi rename
     */
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

    /**
     * Chuẩn hoá kết quả query (hỗ trợ cả single và multi-statement)
     */
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

    /**
     * Chuyển đổi tab kết quả
     */
    activateResultTab(index) {
      if (index < 0 || index >= this.queryResults.length) return;
      this.activeResultIndex = index;
      this.queryResult = this.queryResults[index] || null;
    },

    /**
     * Key cho tab kết quả (dùng trong v-for)
     */
    getResultTabKey(result, index) {
      return `${index}-${result?.is_select ? "select" : "command"}-${result?.rows_affected ?? 0}`;
    },

    /**
     * Label hiển thị trên tab kết quả (ưu tiên tên bảng nếu có)
     */
    getResultTabLabel(result, index) {
      let labelTab = null;
      try {
        if (!result) {
          return `${index + 1} result`;
        }
        if (result.is_select) {
          let tableName = result.table_names?.find((x) => !!x);
          if (tableName) labelTab = `${index + 1} ${tableName}`;
          else {
            labelTab = `${index + 1} select`;
          }
        } else {
          labelTab = `${index + 1} command`;
        }
      } catch (error) {}
      return labelTab;
    },

    /**
     * Reset toàn bộ kết quả query
     */
    resetQueryResults() {
      this.queryResult = null;
      this.queryResults = [];
      this.activeResultIndex = 0;
      this.queryError = null;
    },

    /**
     * Tải đồng thời groups, connections, và saved queries từ API
     */
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

    /**
     * Tải danh sách groups connection, tự động mở rộng tất cả
     */
    async loadGroups() {
      let me = this;
      let response = await me.agentAPI.connectionGroup.getAll();
      let data = response?.data?.data ?? [];
      if (Array.isArray(data)) {
        me.allGroups.splice(0, me.allGroups.length, ...data);
        data.forEach((g) => {
          g.is_renaming = false;
          if (!(g.id in me.openGroups)) me.openGroups[g.id] = true;
        });
        if (!("__ungrouped__" in me.openGroups)) {
          me.openGroups["__ungrouped__"] = true;
        }
      }
    },

    /**
     * Tải danh sách tất cả connections
     */
    async loadConnections() {
      let me = this;
      let response = await me.agentAPI.connection.getAll();
      let data = response?.data?.data ?? [];
      if (Array.isArray(data)) {
        me.allConnections.splice(0, me.allConnections.length, ...data);
      }
    },

    /**
     * Tải danh sách saved queries
     */
    async loadSavedQueries() {
      let me = this;
      let response = await me.agentAPI.savedQuery.getAll();
      let data = response?.data?.data ?? [];
      if (Array.isArray(data)) {
        me.allSavedQueries.splice(0, me.allSavedQueries.length, ...data);
      }
    },

    /**
     * Bật/tắt trạng thái mở rộng của group
     */
    toggleGroup(groupKey) {
      this.openGroups[groupKey] = !this.openGroups[groupKey];
    },

    /**
     * Chọn connection và lưu vào cache
     */
    selectConnection(conn) {
      let me = this;
      me.selectedConnectionId = conn.id;
      me.$tdCache.set(
        me.$tdEnum.cacheConfig.PostgreSQLLastConnectionId,
        conn.id,
      );
    },

    /**
     * Mở popup thêm connection mới (có thể gán vào group)
     */
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

    /**
     * Mở popup sửa connection
     */
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

    /**
     * Xoá connection, nếu là connection đang chọn thì reset
     */
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

    /**
     * Tạo nhóm connection mới
     */
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

    /**
     * Xoá nhóm connection (kèm các connection trong nhóm)
     */
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

    /**
     * Chạy câu query SQL: gọi API, xử lý kết quả, tự động save nếu bật option
     */
    /**
     * chạy câu query SQL: gọi API, xử lý kết quả (hỗ trợ multi-statement),
     * tự động lưu query vào danh sách saved queries nếu bật option
     */
    async handleRunQuery() {
      let me = this;
      // kiểm tra connection và nội dung query trước khi gửi
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
        // gửi query đến server backend qua agentAPI
        const response = await me.agentAPI.executeQuery(
          me.selectedConnectionId,
          me.sqlText,
          me.currentConfigLayout.defaultQueryLimit,
          !me.currentConfigLayout.limitResults,
        );

        // chuẩn hóa kết quả (hỗ trợ cả single và multi-statement)
        const normalizedResults = me.normalizeMultiQueryResult(
          response?.data?.data,
        );

        me.queryResults = normalizedResults;
        me.activeResultIndex = normalizedResults.length > 0 ? 0 : 0;
        me.queryResult = normalizedResults[0] || null;

        // nếu server trả về lỗi thì reset kết quả và hiển thị error message
        if (!response?.data?.success) {
          me.resetQueryResults();
          me.queryError =
            response?.data?.message ?? me.$t("i18nCommon.toastMessage.error");
        }
      } catch (error) {
        // lỗi mạng hoặc exception
        me.resetQueryResults();
        me.queryError =
          error?.message ?? me.$t("i18nCommon.toastMessage.error");
      } finally {
        me.isRunning = false;
        // tự động lưu query sau khi chạy thành công (nếu bật setting)
        // kiểm tra nội dung thay đổi so với lần auto-save trước để tránh lưu trùng
        if (me.currentConfigLayout.autoSaveQueryAfterExec) {
          if (
            me.sqlText !== me.lastAutoSavedQueryText ||
            me.selectedConnectionId !== me.lastAutoSavedConnectionId
          ) {
            me.lastAutoSavedQueryText = me.sqlText;
            me.lastAutoSavedConnectionId = me.selectedConnectionId;
            me.saveCurrentQuery();
          }
        }
      }
    },
    /**
     * Parse connection string gốc -> gọi C# WASM build Npgsql connection string -> copy clipboard
     */
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
        // Parse DSN/URI thành các trường riêng lẻ
        let parsed = me.parseConnectionStringToFields(conn.connection_string);
        let fields = {
          host: parsed.host,
          port: parseInt(parsed.port) || 5432,
          user_name: parsed.username,
          password: parsed.password,
          database_name: parsed.database,
        };

        // Stringify qua C# WASM để đảm bảo format Npgsql chuẩn
        const jsonStr = JSON.stringify(fields);
        const npgSqlConnStr =
          me.dotnetExports.StringifyNpgSQLConnection(jsonStr);

        me.$tdUtility.copyToClipboard(npgSqlConnStr);
      } catch (e) {
        console.error(e);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /**
     * Copy trực tiếp connection string DSN/URI gốc vào clipboard
     */
    handleCopyDSNConnectionString() {
      let me = this;
      let conn = me.allConnections.find(
        (c) => c.id === me.selectedConnectionId,
      );
      if (conn?.connection_string) {
        me.$tdUtility.copyToClipboard(conn.connection_string);
      } else {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.noConnectionString"),
        );
      }
    },

    /**
     * Kiểm tra kết nối database (gọi qua mixin TDDatabaseConnectionMixin)
     */
    async handleTestConnection() {
      if (!this.selectedConnectionId) return;
      await this.testDatabaseConnection(
        this.agentAPI,
        this.selectedConnectionId,
      );
    },

    /**
     * Format SQL: dùng sql-formatter, Postgresql dialect, uppercase keywords
     */
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

    /**
     * Build nội dung JSON để copy/download từ result đang active
     */
    buildResultForCopy() {
      const result = this.activeQueryResult;
      if (!result?.is_select || !result?.rows?.length) return "";
      return JSON.stringify(result.rows, null, 2);
    },

    /**
     * Copy kết quả query dạng JSON vào clipboard
     */
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

    /**
     * Download kết quả query dạng file .txt
     */
    handleDownloadReponse() {
      let me = this;
      let queryResultText = me.buildResultForCopy();

      if (queryResultText) {
        let encoder = new TextEncoder();
        let buffer = encoder.encode(queryResultText);
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

    /**
     * Lưu query hiện tại (tên mặc định là nội dung query nếu user không nhập)
     */
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

    /**
     * Mở dialog inspect object (table/view/function)
     */
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

    /**
     * Mở dialog danh sách database
     */
    async handleOpenDatabaseList() {
      let me = this;
      if (!me.selectedConnectionId) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.noConnectionSelected"),
        );
        return;
      }
      await TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLDatabaseList,
        ownerForm: me,
        param: { connectionId: me.selectedConnectionId },
      });
    },

    /**
     * Mở popup backup database
     */
    async handleOpenBackupPopup() {
      await TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLBackupPopup,
        ownerForm: this,
      });
    },

    /**
     * Mở popup restore database
     */
    async handleOpenRestorePopup() {
      await TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLRestorePopup,
        ownerForm: this,
      });
    },

    /**
     * Mở popup clone database
     */
    async handleOpenClonePopup() {
      await TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLClonePopup,
        ownerForm: this,
      });
    },

    /**
     * Mở dialog clone intellisense từ connection khác
     */
    async handleCloneIntellisense() {
      let me = this;
      if (!me.selectedConnectionId) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.noConnectionSelected"),
        );
        return;
      }
      await TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLCloneCachePopup,
        ownerForm: me,
        param: { connectionId: me.selectedConnectionId },
      });
    },

    /**
     * Mở dialog inspect với search text và schema có sẵn (dùng từ F12)
     */
    async handleOpenInspectWithSearch(searchType, searchValue, searchSchema) {
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
        param: {
          connectionId: me.selectedConnectionId,
          preSearchType: searchType,
          preSearchValue: searchValue,
          preSearchSchema: searchSchema,
        },
      });
    },

    /**
     * Load nội dung saved query vào editor
     */
    loadSavedQuery(query) {
      let me = this;
      me.currentSavedQueryId = query.id;
      me.sqlText = query.query_text ?? "";
      if (query.connection_id) {
        me.selectedConnectionId = query.connection_id;
      }
    },

    /**
     * Xoá saved query
     */
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
     * Cấu hình lifecycle tab: đăng ký shortcuts
     */
    getTabLifecycleConfig() {
      let me = this;
      return {
        shortcuts: [
          {
            enum: TDShortcutActionEnum.ExecutePosgreSQLCode,
            config: me.getConfigExecuteSQLCode(),
          },
          {
            enum: TDShortcutActionEnum.DllInspect,
            config: me.getConfigDLLInspect(),
          },
        ],
        domEvents: [],
      };
    },

    /**
     * Cấu hình shortcut chạy query (Ctrl+Enter)
     */
    getConfigExecuteSQLCode() {
      let me = this;
      let configKeyboard = {
        sortOrder: 100,
        presentKey: [me.$tdUtility.ctrlKey(), me.$tdUtility.enterKey()],
        labelKey: "i18nCommon.postgreSQLQuery.runQuery",
      };
      return configKeyboard;
    },

    /**
     * Cấu hình shortcut inspect object (F12)
     */
    getConfigDLLInspect() {
      let me = this;
      let configKeyboard = {
        sortOrder: 101,
        presentKey: ["F12"],
        labelKey: "i18nCommon.postgreSQLQuery.dbInspect.inspectObject",
      };
      return configKeyboard;
    },

    /**
     * Kết thúc edit trong Monaco: cập nhật sqlText, gọi callback (vd: format/run)
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
     * Mở tab xem template PostgreSQL
     */
    openCodePostgresqlTemplate() {
      this.openTab({
        titleKey: "i18nCommon.feature.PostgreSQLTemplate",
        groupPath: "",
        component: () =>
          import("@/views/tools/codeTemplateTools/TDCodeTemplatePostgreSQL.vue"),
      });
    },

    /**
     * Gen UUID và copy vào clipboard
     */
    genUUIDFunc() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.$tdUtility.newGuid());
    },

    /**
     * Khôi phục connection đã chọn lần trước từ cache
     */
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
    /**
     * Khi đổi connection: load intellisense từ cache, cập nhật tab title
     */
    async selectedConnectionId(newId) {
      if (newId) {
        await this.loadCachedIntellisense();
      }
      let conn = this.allConnections.find((c) => c.id === newId);
      this.reBuildTabTitle(conn ? conn.connection_name : null);
    },

    /**
     * Khi bật/tắt limitResults: backup limit hiện tại, reset về 0 nếu tắt
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
@use "@/styles/collection-sub-sidebar.scss";

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
  font-size: var(--font-size-medium);
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
    overflow-x: auto;

    .td-menu-item {
      flex-shrink: 0;
    }
  }
}
.td-query-config {
  padding: var(--padding);
}
</style>
