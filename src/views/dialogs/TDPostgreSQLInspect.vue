<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="1000px"
    :title="$t('i18nCommon.postgreSQLQuery.dbInspect.title')"
  >
    <div class="flex flex-col td-pg-inspect-popup">
      <div class="flex td-inspect-search-bar">
        <TDComboBox
          :width="150"
          v-model="searchType"
          :noMargin="true"
          :options="searchTypeOptions"
          :isEditable="false"
          @selected="handleSearch"
        />
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
        <TDButton
          :noMargin="true"
          iconClass="td-send-icon"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.dbInspect.execButton')"
          @click="handleSearch"
          :readOnly="isSearching"
        />
      </div>
      <div class="flex flex-one td-inspect-body">
        <div v-if="isSearching" class="flex td-inspect-loading">
          <div class="loader"></div>
        </div>
        <template v-else-if="results && results.length > 0">
          <div class="flex flex-col td-inspect-list">
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
          <div class="flex flex-col flex-one td-inspect-preview">
            <div v-if="isLoadingDDL" class="flex td-inspect-loading">
              <div class="loader"></div>
            </div>
            <TDTextarea
              v-else
              v-model="ddlContent"
              language="pgsql"
              :enableHighlight="true"
              :wrapText="true"
              :isLabelTop="false"
              :readOnly="true"
            />
          </div>
        </template>
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
import pgQueries from "@/views/tools/PostgreSQLQuery/templates.js";
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
      // connection
      connectionId: "",
      // search
      searchType: "table",
      searchSchema: "",
      searchValue: "",
      limitCount: 20,
      isLoadingSchemas: false,
      schemaOptions: [],
      // state
      isSearching: false,
      isLoadingDDL: false,
      searchError: "",
      results: [],
      activeIndex: -1,
      ddlContent: "",

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
    };
  },

  mounted() {
    this.agentAPI = new TDServerPostgreSQLAPI();
  },

  methods: {
    /** Gọi từ TDDialogUtil sau khi mount */
    async show(param) {
      this.connectionId = param?.connectionId ?? "";
      this.results = [];
      this.ddlContent = "";
      this.activeIndex = -1;
      this.searchError = "";
      await this.loadSchemas();
      await this.handleSearch();
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },

    /** Load danh sách schema từ PostgreSQL để đổ vào combo */
    async loadSchemas() {
      if (!this.connectionId) return;
      this.isLoadingSchemas = true;
      try {
        const resp = await this.agentAPI.executeQuery(
          this.connectionId,
          pgQueries.pg_inspect_list_schemas,
        );
        const result =
          resp?.data?.data?.results?.[0] || resp?.data?.data || null;
        const rows = result?.rows ?? [];
        // array_agg trả về text dạng {elem1,elem2,...}
        const raw = rows?.[0]?.schema_names;
        const schemaNames =
          typeof raw === "string"
            ? raw.slice(1, -1).split(",").filter(Boolean)
            : [];
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

    /** Build SQL tìm kiếm theo loại */
    buildSearchSQL() {
      const schema = this.searchSchema?.trim();
      const rawValue = this.searchValue?.trim();
      const value = rawValue ? `%${rawValue.replace(/'/g, "''")}%` : "%";
      const limit = Math.min(
        Math.max(parseInt(this.limitCount, 10) || 20, 1),
        100,
      );
      const schemaFilter = schema
        ? `AND n.nspname = '${schema.replace(/'/g, "''")}'`
        : `AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')`;

      let queryTemplate = "";
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

    /** Build SQL lấy DDL theo loại và item */
    buildDDLSQL(item) {
      const schema = item.schema_name?.replace(/'/g, "''");
      const name = item.object_name?.replace(/'/g, "''");
      const oid = item.object_oid || 0;

      let queryTemplate = "";
      switch (this.searchType) {
        case "table":
          queryTemplate = pgQueries.pg_inspect_ddl_table;
          break;
        case "view":
          queryTemplate = pgQueries.pg_inspect_ddl_view;
          break;
        case "function":
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

    async handleSearch() {
      if (!this.connectionId) {
        this.$tdToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.noConnectionSelected"),
        );
        return;
      }
      const sql = this.buildSearchSQL();
      if (!sql) return;

      this.isSearching = true;
      this.results = [];
      this.ddlContent = "";
      this.activeIndex = -1;
      this.searchError = "";

      try {
        const resp = await this.agentAPI.executeQuery(this.connectionId, sql);
        const result =
          resp?.data?.data?.results?.[0] || resp?.data?.data || null;

        if (resp?.data?.success && result?.rows?.length > 0) {
          this.results = result.rows;
          // Tự động chọn item đầu tiên khi có kết quả
          this.$nextTick(() => {
            this.selectItem(0);
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

    async selectItem(idx) {
      this.activeIndex = idx;
      const item = this.results[idx];
      if (!item) return;

      const sql = this.buildDDLSQL(item);
      if (!sql) return;

      this.isLoadingDDL = true;
      this.ddlContent = "";

      try {
        const resp = await this.agentAPI.executeQuery(this.connectionId, sql);
        const result =
          resp?.data?.data?.results?.[0] || resp?.data?.data || null;

        if (resp?.data?.success && result?.rows?.length > 0) {
          // lấy giá trị cột đầu tiên của dòng đầu tiên
          const firstRow = result.rows[0];
          const firstKey = Object.keys(firstRow)[0];
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
      }
    },
    buildNameResult(item) {
      return `${item.schema_name}.${item.object_name}`;
    },
  },
};
</script>

<style scoped lang="scss">
.td-pg-inspect-popup {
  gap: var(--padding);
  margin: var(--padding);
  height: 600px;
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
  gap: var(--padding);
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
</style>
