<template>
  <!-- popup toàn màn hình: inspect object database (table/view/function) -->
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    isFullPopup
    :title="$t('i18nCommon.postgreSQLQuery.dbInspect.title')"
  >
    <div class="flex flex-col td-pg-inspect-popup">
      <!-- thanh tìm kiếm: back/next history + type + schema + name + limit + exec -->
      <div class="flex td-inspect-search-bar">
        <!-- nút Back (undo) kèm flyout danh sách lịch sử -->
        <div
          class="td-history-btn-wrap"
          @mouseenter="
            cancelBackClose();
            showBackFlyout = true;
          "
          @mouseleave="scheduleBackClose()"
        >
          <TDButton
            :noMargin="true"
            iconClass="td-undo-icon"
            :class="historyPointer <= 0 ? 'td-toolbar-btn-disabled' : ''"
            @click="handleBack"
            v-tooltip="backTooltip"
          />
          <div
            v-if="showBackFlyout && backHistory.length > 0"
            class="td-flyout-panel td-history-flyout"
            @mouseenter="cancelBackClose()"
            @mouseleave="scheduleBackClose()"
          >
            <div
              v-for="item in backHistory"
              :key="item.index"
              class="td-flyout-item"
              @click="goToHistoryEntry(item.index)"
            >
              <span>{{ entryLabel(item.entry) }}</span>
            </div>
          </div>
        </div>
        <!-- nút Next (redo) kèm flyout -->
        <div
          class="td-history-btn-wrap"
          @mouseenter="
            cancelNextClose();
            showNextFlyout = true;
          "
          @mouseleave="scheduleNextClose()"
        >
          <TDButton
            :noMargin="true"
            iconClass="td-redo-icon"
            :class="
              historyPointer >= sessionHistory.length - 1
                ? 'td-toolbar-btn-disabled'
                : ''
            "
            @click="handleNext"
            v-tooltip="nextTooltip"
          />
          <div
            v-if="showNextFlyout && nextHistory.length > 0"
            class="td-flyout-panel td-history-flyout"
            @mouseenter="cancelNextClose()"
            @mouseleave="scheduleNextClose()"
          >
            <div
              v-for="item in nextHistory"
              :key="item.index"
              class="td-flyout-item"
              @click="goToHistoryEntry(item.index)"
            >
              <span>{{ entryLabel(item.entry) }}</span>
            </div>
          </div>
        </div>
        <!-- combo chọn loại object: table / view / function -->
        <TDComboBox
          :width="150"
          v-model="searchType"
          :noMargin="true"
          :options="searchTypeOptions"
          :isEditable="false"
          @selected="handleSearch"
        />
        <!-- combo chọn schema (load động từ database) -->
        <TDComboBox
          v-model="searchSchema"
          :noMargin="true"
          :width="200"
          :options="schemaOptions"
          :isEditable="false"
          :isCapitalizeText="false"
          :placeHolder="
            $t('i18nCommon.postgreSQLQuery.dbInspect.schemaPlaceholder')
          "
          @selected="handleSearch"
        />
        <!-- input tìm kiếm theo tên object -->
        <div class="flex-one">
          <TDInput
            v-model="searchValue"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.dbInspect.namePlaceholder')
            "
            @keyup.enter="handleSearch"
          />
        </div>
        <!-- input giới hạn số kết quả trả về -->
        <div>
          <TDInput
            v-model="limitCount"
            :noMargin="true"
            inputType="number"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.dbInspect.limitPlaceholder')
            "
          />
        </div>
        <!-- nút thực hiện tìm kiếm -->
        <TDButton
          :noMargin="true"
          iconClass="td-send-icon"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.dbInspect.execButton')"
          @click="handleSearch"
          :readOnly="isSearching"
        />
      </div>

      <!-- thân popup: danh sách kết quả bên trái + preview DDL bên phải -->
      <div class="flex flex-one td-inspect-body">
        <!-- loading khi đang tìm kiếm -->
        <div v-if="isSearching" class="flex td-inspect-loading">
          <div class="loader"></div>
        </div>
        <template v-else-if="results && results.length > 0">
          <!-- danh sách object tìm được (bên trái) -->
          <div
            class="flex flex-col td-inspect-list"
            :style="requestSectionSizeStyle"
          >
            <div v-if="!results.length" class="flex td-inspect-empty">
              {{
                searchError ||
                $t("i18nCommon.postgreSQLQuery.dbInspect.emptyResult")
              }}
            </div>
            <div
              v-else
              v-for="(item, idx) in results"
              :key="idx"
              class="td-inspect-item"
              :class="{ 'td-inspect-item-active': activeIndex === idx }"
              @click="selectItem(idx)"
              v-tooltip="buildNameResult(item)"
            >
              <span class="text-nowrap">
                {{ buildNameResult(item) }}
              </span>
            </div>
          </div>
          <!-- thanh kéo resize giữa danh sách và preview -->
          <TDResizer :direction="'horizontal'" @resize="handleResize" />
          <!-- panel preview DDL (bên phải) -->
          <div
            class="flex flex-col flex-one td-inspect-preview"
            :style="responseSectionSizeStyle"
          >
            <div v-if="isLoadingDDL" class="flex td-inspect-loading">
              <div class="loader"></div>
            </div>
            <TDTextEditor
              v-else
              ref="ddlEditor"
              v-model="ddlContent"
              language="pgsql"
              :enableHighlight="true"
              :wrapText="true"
              :isLabelTop="false"
              :readOnly="true"
              :monacoOptions="ddlMonacoOptions"
            />
          </div>
        </template>
        <!-- trạng thái rỗng / lỗi -->
        <div v-else class="td-empty-result">
          <div>
            {{
              searchError ||
              $t("i18nCommon.postgreSQLQuery.dbInspect.emptyResult")
            }}
          </div>
        </div>
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDServerPostgreSQLAPI from "@/common/api/request/AgentAPI/TDServerPostgreSQLAPI.js";
import { pgQueries } from "@/templates/postgresql/templates.js";
import { registerPgsqlLanguage } from "@/components/monarch/pgsqlLanguage.js";
export default {
  name: "TDPostgreSQLInspect",
  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      // tỉ lệ % chiều rộng giữa danh sách (trái) và preview DDL (phải)
      requestSectionSize: 20,
      responseSectionSize: 80,
      // connection hiện tại
      connectionId: "",
      // tham số tìm kiếm
      searchType: "table", // loại object: table | view | function
      searchSchema: "", // schema filter (rỗng = tất cả)
      searchValue: "", // tên object cần tìm
      limitCount: 20, // giới hạn số kết quả
      isLoadingSchemas: false, // đang load danh sách schema
      schemaOptions: [], // danh sách schema để đổ vào combo
      // trạng thái
      isSearching: false,
      isLoadingDDL: false,
      searchError: "",
      results: [], // kết quả tìm kiếm
      activeIndex: -1, // index item đang được chọn
      ddlContent: "", // nội dung DDL của object đang xem

      // options cho combo loại object
      searchTypeOptions: [
        {
          value: "table",
          label: this.$t("i18nCommon.postgreSQLQuery.dbInspect.table"),
        },
        {
          value: "view",
          label: this.$t("i18nCommon.postgreSQLQuery.dbInspect.view"),
        },
        {
          value: "function",
          label: this.$t("i18nCommon.postgreSQLQuery.dbInspect.function"),
        },
      ],

      agentAPI: null,

      // lịch sử duyệt (back/forward) - mỗi entry là 1 state tìm kiếm
      sessionHistory: [],
      historyPointer: -1,
      _isHistoryNav: false, // cờ đang điều hướng lịch sử (tránh đẩy duplicate history)
      showBackFlyout: false,
      showNextFlyout: false,
      backCloseTimer: null, // timer đóng flyout back
      nextCloseTimer: null, // timer đóng flyout next
    };
  },

  mounted() {
    this.agentAPI = new TDServerPostgreSQLAPI();
    registerPgsqlLanguage();
  },
  computed: {
    /**
     * Tính toán style động cho request area
     */
    requestSectionSizeStyle() {
      let me = this;
      let style = { width: `${me.requestSectionSize}%` };
      return style;
    },
    /**
     * Tính toán style động cho response area
     */
    responseSectionSizeStyle() {
      let me = this;
      let style = { width: `${me.responseSectionSize}%` };
      return style;
    },
    backHistory() {
      let items = [];
      for (let i = this.historyPointer - 1; i >= 0; i--) {
        items.push({ index: i, entry: this.sessionHistory[i] });
      }
      return items;
    },
    nextHistory() {
      let items = [];
      for (
        let i = this.historyPointer + 1;
        i < this.sessionHistory.length;
        i++
      ) {
        items.push({ index: i, entry: this.sessionHistory[i] });
      }
      return items;
    },
    backTooltip() {
      if (this.historyPointer <= 0) return "";
      let entry = this.sessionHistory[this.historyPointer - 1];
      return this.entryLabel(entry);
    },
    nextTooltip() {
      if (this.historyPointer >= this.sessionHistory.length - 1) return "";
      let entry = this.sessionHistory[this.historyPointer + 1];
      return this.entryLabel(entry);
    },
    ddlMonacoOptions() {
      let me = this;
      return {
        onInit: (editor, monacoInstance) => {
          editor.addAction({
            id: "inspect-pg-object-ddl",
            label: me.$t("i18nCommon.postgreSQLQuery.dbInspect.inspectObject"),
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.3,
            keybindings: [monacoInstance.KeyCode.F12],
            run: async (ed) => {
              const position = ed.getPosition();
              const model = ed.getModel();
              if (!position || !model) return;

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

              const lineContent = model.getLineContent(position.lineNumber);
              const textBeforeWord = lineContent.substring(
                0,
                word.startColumn - 1,
              );
              const dotMatch = textBeforeWord.match(/([a-zA-Z0-9_]+)\.$/);
              if (dotMatch) {
                schemaName = dotMatch[1];
              }

              await me.navigateToObject(objectName, schemaName);
            },
          });
        },
      };
    },
  },
  methods: {
    handleResize(sizes) {
      this.requestSectionSize = sizes.leftSize;
      this.responseSectionSize = sizes.rightSize;
    },
    /** Gọi từ TDDialogUtil sau khi mount */
    async show(param) {
      this.connectionId = param?.connectionId ?? "";
      this.results = [];
      this.ddlContent = "";
      this.activeIndex = -1;
      this.searchError = "";
      this.sessionHistory = [];
      this.historyPointer = -1;

      // Hỗ trợ pre-fill từ context menu inspect
      if (param?.preSearchType) {
        this.searchType = param.preSearchType;
      }
      if (param?.preSearchSchema) {
        this.searchSchema = param.preSearchSchema;
      }
      if (param?.preSearchValue) {
        this.searchValue = param.preSearchValue;
      }

      await this.loadSchemas();
      await this.handleSearch();
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },

    /**
     * load danh sách schema từ PostgreSQL (chỉ lấy 1 lần khi mở popup)
     * kết quả được gán vào schemaOptions để đổ vào combo box chọn schema
     */
    async loadSchemas() {
      if (!this.connectionId) return;
      this.isLoadingSchemas = true;
      try {
        // gọi template pg_inspect_list_schemas để lấy danh sách schema
        let resp = await this.agentAPI.executeQuery(
          this.connectionId,
          pgQueries.pg_inspect_list_schemas,
        );
        let result = resp?.data?.data?.results?.[0] || resp?.data?.data || null;
        let rows = result?.rows ?? [];
        // cột schema_names là array chứa tên các schema
        let schemaNames = rows?.[0]?.schema_names;
        this.schemaOptions = [
          {
            value: "",
            label: this.$t("i18nCommon.postgreSQLQuery.dbInspect.allSchemas"),
          },
          ...schemaNames.map((name) => ({
            value: name,
            label: name,
          })),
        ];
      } catch {
        this.schemaOptions = [];
      } finally {
        this.isLoadingSchemas = false;
      }
    },

    /**
     * build câu SQL tìm kiếm object theo loại (table/view/function)
     * thay thế các placeholder: {schemaFilter}, {value}, {limit}
     * - schemaFilter: lọc theo schema hoặc loại trừ system schema
     * - value: LIKE pattern (escape dấu nháy đơn để tránh SQL injection)
     * - limit: giới hạn số dòng (1-100)
     */
    buildSearchSQL() {
      let schema = this.searchSchema?.trim();
      let rawValue = this.searchValue?.trim();
      // escape dấu nháy đơn trong giá trị tìm kiếm (SQL injection prevention)
      let value = rawValue ? `%${rawValue.replace(/'/g, "''")}%` : "%";
      // giới hạn limit trong khoảng 1-100
      let limit = Math.min(
        Math.max(parseInt(this.limitCount, 10) || 20, 1),
        100,
      );
      // nếu có schema filter thì thêm điều kiện AND, nếu không thì loại trừ system schemas
      let schemaFilter = schema
        ? `AND n.nspname = '${schema.replace(/'/g, "''")}'`
        : `AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')`;

      let queryTemplate = "";
      // chọn template SQL tương ứng với loại object
      switch (this.searchType) {
        case "table":
          queryTemplate = pgQueries.pg_inspect_search_table;
          break;
        case "view":
          queryTemplate = pgQueries.pg_inspect_search_view;
          break;
        case "function":
          queryTemplate = pgQueries.pg_inspect_search_function;
          break;

        default:
          return "";
      }

      return queryTemplate
        .replace(/{schemaFilter}/g, schemaFilter)
        .replace(/{value}/g, value)
        .replace(/{limit}/g, limit);
    },

    /**
     * build câu SQL lấy DDL (CREATE script) của một object
     * thay thế {schema}, {name}, {oid} vào template tương ứng
     * @param {*} item object từ kết quả tìm kiếm (chứa schema_name, object_name, object_oid)
     */
    buildDDLSQL(item) {
      // escape SQL injection
      let schema = item.schema_name?.replace(/'/g, "''");
      let name = item.object_name?.replace(/'/g, "''");
      let oid = item.object_oid || 0;

      let queryTemplate = "";
      switch (this.searchType) {
        case "table":
          queryTemplate = pgQueries.pg_inspect_ddl_table;
          break;
        case "view":
          queryTemplate = pgQueries.pg_inspect_ddl_view;
          break;
        case "function":
          // function cần cả oid để phân biệt overload
          queryTemplate = pgQueries.pg_inspect_ddl_function;
          break;

        default:
          return "";
      }

      return queryTemplate
        .replace(/{schema}/g, schema)
        .replace(/{name}/g, name)
        .replace(/{oid}/g, oid);
    },

    /**
     * thực hiện tìm kiếm object, tự động chọn item đầu tiên (hoặc targetIndex)
     * và push history (trừ khi đang điều hướng lịch sử)
     * @param {number} targetIndex index item cần chọn sau khi search (mặc định 0)
     */
    async handleSearch(targetIndex = 0) {
      if (typeof targetIndex !== "number") targetIndex = 0;
      if (!this.connectionId) {
        this.$tdToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.noConnectionSelected"),
        );
        return;
      }
      let sql = this.buildSearchSQL();
      if (!sql) return;

      this.isSearching = true;
      this.results = [];
      this.ddlContent = "";
      this.activeIndex = -1;
      this.searchError = "";

      try {
        let resp = await this.agentAPI.executeQuery(this.connectionId, sql);
        let result = resp?.data?.data?.results?.[0] || resp?.data?.data || null;

        if (resp?.data?.success && result?.rows?.length > 0) {
          this.results = result.rows;
          let idx = Math.min(targetIndex, result.rows.length - 1);
          this.$nextTick(() => {
            this.selectItem(idx, true);
            if (!this._isHistoryNav) {
              this.pushHistory();
            }
          });
        } else {
          this.searchError =
            resp?.data?.message ||
            this.$t("i18nCommon.postgreSQLQuery.dbInspect.searchError");
        }
      } catch (e) {
        this.searchError =
          e?.message ||
          this.$t("i18nCommon.postgreSQLQuery.dbInspect.searchErrorFallback");
      } finally {
        this.isSearching = false;
      }
    },

    /**
     * chọn 1 item trong danh sách kết quả, tải DDL tương ứng và hiển thị ở panel preview
     * @param {number} idx index item cần chọn
     * @param {boolean} skipHistory nếu true thì không push vào lịch sử (dùng khi khôi phục history)
     */
    async selectItem(idx, skipHistory = false) {
      this.activeIndex = idx;
      let item = this.results[idx];
      if (!item) return;

      // build SQL lấy DDL dựa trên loại object và thông tin item
      let sql = this.buildDDLSQL(item);
      if (!sql) return;

      this.isLoadingDDL = true;
      this.ddlContent = "";

      try {
        // gọi API để lấy DDL
        let resp = await this.agentAPI.executeQuery(this.connectionId, sql);
        let result = resp?.data?.data?.results?.[0] || resp?.data?.data || null;

        if (resp?.data?.success && result?.rows?.length > 0) {
          // lấy giá trị cột đầu tiên của dòng đầu tiên (cột này chứa DDL text)
          let firstRow = result.rows[0];
          let firstKey = Object.keys(firstRow)[0];
          this.ddlContent = firstRow[firstKey] ?? "";
        } else {
          this.ddlContent =
            resp?.data?.message ||
            this.$t("i18nCommon.postgreSQLQuery.dbInspect.ddlError");
        }
      } catch (e) {
        this.ddlContent =
          e?.message ||
          this.$t("i18nCommon.postgreSQLQuery.dbInspect.ddlErrorFallback");
      } finally {
        this.isLoadingDDL = false;
        // push history nếu không phải đang skip (khôi phục history) và không phải history nav
        if (!skipHistory && !this._isHistoryNav) {
          this.pushHistory();
        }
      }
    },
    buildNameResult(item) {
      return `${item.schema_name}.${item.object_name}`;
    },

    /**
     * đẩy trạng thái hiện tại vào lịch sử duyệt (sessionHistory)
     * nếu đang ở giữa lịch sử (đã back), xóa các entry phía trước (như browser history)
     * bỏ qua nếu entry mới trùng với entry cuối (tránh duplicate)
     */
    pushHistory() {
      // nếu đang ở giữa lịch sử, cắt bỏ những entry phía sau (forward history)
      if (this.historyPointer < this.sessionHistory.length - 1) {
        this.sessionHistory = this.sessionHistory.slice(
          0,
          this.historyPointer + 1,
        );
      }
      let item = this.results?.[this.activeIndex];
      let entryValue = this.searchValue;
      if (item) {
        // ưu tiên lấy tên object từ item (chính xác hơn searchValue nhập tay)
        entryValue = item.object_name || "";
        // với function, bỏ phần tham số trong ngoặc (vd: "func(a int)" -> "func")
        if (this.searchType === "function" && entryValue.includes("(")) {
          entryValue = entryValue.split("(")[0];
        }
      }
      let newEntry = {
        searchType: this.searchType,
        searchSchema: item ? item.schema_name || "" : this.searchSchema,
        searchValue: entryValue,
        activeIndex: this.activeIndex,
      };
      // kiểm tra entry cuối có giống entry mới không để tránh push duplicate
      let lastEntry = this.sessionHistory[this.sessionHistory.length - 1];
      if (
        lastEntry &&
        lastEntry.searchType === newEntry.searchType &&
        lastEntry.searchSchema === newEntry.searchSchema &&
        lastEntry.searchValue === newEntry.searchValue &&
        lastEntry.activeIndex === newEntry.activeIndex
      ) {
        return;
      }
      this.sessionHistory.push(newEntry);
      this.historyPointer = this.sessionHistory.length - 1;
    },

    /** back: quay lại entry trước trong lịch sử */
    handleBack() {
      if (this.historyPointer <= 0) return;
      this.historyPointer--;
      this._isHistoryNav = true;
      this.restoreHistoryEntry(this.sessionHistory[this.historyPointer]);
    },

    /** next: tiến tới entry tiếp theo trong lịch sử */
    handleNext() {
      if (this.historyPointer >= this.sessionHistory.length - 1) return;
      this.historyPointer++;
      this._isHistoryNav = true;
      this.restoreHistoryEntry(this.sessionHistory[this.historyPointer]);
    },

    restoreHistoryEntry(entry) {
      this.searchType = entry.searchType;
      this.searchSchema = entry.searchSchema;
      this.searchValue = entry.searchValue;
      let targetIdx = entry.activeIndex;
      this.handleSearch(targetIdx).finally(() => {
        this._isHistoryNav = false;
      });
    },

    /**
     * điều hướng đến 1 object cụ thể (dùng từ F12 trong Monaco Editor).
     * thử tìm object ở cả 3 loại (table/view/function) và chọn kết quả đầu tiên khớp
     * @param {string} objectName tên object cần tìm
     * @param {string} schemaName schema (có thể rỗng)
     */
    async navigateToObject(objectName, schemaName) {
      // push trạng thái hiện tại vào history trước khi navigate
      this.pushHistory();

      let foundType = null;
      let foundIdx = -1;
      let foundResults = null;
      // lưu lại trạng thái search hiện tại để khôi phục nếu không tìm thấy
      let savedType = this.searchType;
      let savedValue = this.searchValue;
      let savedSchema = this.searchSchema;

      // thiết lập tham số tìm kiếm theo object cần navigate
      this.searchValue = objectName;
      this.searchSchema = schemaName || "";

      // thử tìm ở cả 3 loại: table -> view -> function
      for (const type of ["table", "view", "function"]) {
        this.searchType = type;
        let sql = this.buildSearchSQL();
        if (!sql) {
          this.searchType = savedType;
          continue;
        }
        try {
          let resp = await this.agentAPI.executeQuery(this.connectionId, sql);
          let result =
            resp?.data?.data?.results?.[0] || resp?.data?.data || null;
          if (resp?.data?.success && result?.rows?.length > 0) {
            // tìm item khớp chính xác tên object (và cả schema nếu có)
            let idx = result.rows.findIndex((r) => {
              // function có thể có dạng "func_name(args...)" -> bỏ phần args
              let objName =
                type === "function"
                  ? r.object_name.split("(")[0]
                  : r.object_name;
              return (
                objName.toLowerCase() === objectName.toLowerCase() &&
                (!schemaName ||
                  r.schema_name.toLowerCase() === schemaName.toLowerCase())
              );
            });
            if (idx >= 0) {
              foundType = type;
              foundIdx = idx;
              foundResults = result.rows;
              break; // tìm thấy, thoát vòng lặp
            }
          }
        } catch (e) {
          // thử loại tiếp theo
        } finally {
          // tạm thời gán lại savedType (sẽ set lại sau nếu tìm thấy)
          this.searchType = savedType;
        }
      }

      if (foundType && foundResults) {
        // tìm thấy object: cập nhật state và chọn item tương ứng
        this.searchType = foundType;
        if (schemaName) this.searchSchema = schemaName;
        this.searchValue = objectName;
        this.results = foundResults;
        this.$nextTick(() => {
          this.selectItem(foundIdx, true);
          this.pushHistory(); // push vào history sau khi chọn
        });
      } else {
        // không tìm thấy: pop history vừa push, khôi phục trạng thái cũ
        this.sessionHistory.pop();
        this.historyPointer = this.sessionHistory.length - 1;
        this.searchType = savedType;
        this.searchValue = savedValue;
        this.searchSchema = savedSchema;
        this.$tdToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.dbInspect.objectNotFound"),
        );
      }
    },

    entryLabel(entry) {
      let typeLabel =
        this.$t(`i18nCommon.postgreSQLQuery.dbInspect.${entry.searchType}`) ||
        entry.searchType;
      let name = entry.searchValue || "";
      if (!name)
        return (
          this.$t("i18nCommon.postgreSQLQuery.dbInspect.viewAll") +
          " " +
          typeLabel
        );
      if (entry.searchSchema) name = entry.searchSchema + "." + name;
      return typeLabel + ": " + name;
    },

    goToHistoryEntry(index) {
      if (index < 0 || index >= this.sessionHistory.length) return;
      this.showBackFlyout = false;
      this.showNextFlyout = false;
      this.historyPointer = index;
      this._isHistoryNav = true;
      this.restoreHistoryEntry(this.sessionHistory[index]);
    },

    cancelBackClose() {
      clearTimeout(this.backCloseTimer);
    },
    scheduleBackClose() {
      this.backCloseTimer = setTimeout(() => {
        this.showBackFlyout = false;
      }, 200);
    },
    cancelNextClose() {
      clearTimeout(this.nextCloseTimer);
    },
    scheduleNextClose() {
      this.nextCloseTimer = setTimeout(() => {
        this.showNextFlyout = false;
      }, 200);
    },
  },
};
</script>

<style scoped lang="scss">
.td-pg-inspect-popup {
  gap: var(--padding);
  width: 100%;
  height: 100%;
  padding: var(--padding);
}

.td-inspect-search-bar {
  width: 100%;
  gap: var(--padding);
  align-items: center;
  flex-shrink: 0;
}

.td-inspect-body {
  height: 100%;
  width: 100%;
  position: relative;
  border-radius: var(--border-radius);
  gap: calc(var(--padding) / 2);
  overflow: hidden; /* Cắt phần nội dung bị tràn */
  min-height: 0; /* Bắt buộc để flex child không bị phình to theo nội dung bên trong */

  .td-inspect-list {
    height: 100%;
    width: 250px;
    gap: 4px; /* Giảm gap để giống với danh sách query */
    justify-content: flex-start;
    align-items: stretch; /* Để các item con bên trong tự giãn rộng ra 100% chiều ngang */
    overflow-y: auto; /* Bật thanh cuộn dọc cho danh sách */

    .td-inspect-item {
      cursor: pointer;
      display: flex;
      align-items: center;
      min-height: 40px;
      width: 100%;
      padding: var(--padding);
      border-radius: var(--border-radius);
      flex-shrink: 0;

      &:hover {
        background-color: var(--bg-layer-color);
      }

      &-active {
        background-color: var(--bg-layer-color);
        font-weight: 600;
      }
    }
  }
  .td-inspect-preview {
    min-width: 0; /* Để textarea không bị tràn */
    min-height: 0;
    height: 100%;
  }
}
.td-empty-result {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.td-history-btn-wrap {
  position: relative;
}

.td-history-flyout {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}
</style>
