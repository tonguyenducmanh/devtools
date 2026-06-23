<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    :title="$t('i18nCommon.postgreSQLQuery.dbList.title')"
  >
    <div class="flex flex-col td-pg-dblist-popup">
      <div class="flex td-dblist-search-bar">
        <div class="flex-one">
          <TDInput
            v-model="searchValue"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.dbList.searchPlaceholder')
            "
            @keyup.enter="handleSearch"
          />
        </div>
        <TDButton
          :noMargin="true"
          iconClass="td-send-icon"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.dbInspect.execButton')"
          @click="handleSearch"
          :readOnly="isSearching"
        />
        <span class="td-dblist-current">{{ currentConnLabel }}</span>
      </div>
      <div v-if="isSearching" class="flex td-dblist-loading">
        <div class="loader"></div>
      </div>
      <div v-else-if="error" class="td-dblist-error">
        {{ error }}
      </div>
      <div v-else-if="databases.length === 0" class="td-dblist-empty">
        {{ $t("i18nCommon.noDataAvailable") }}
      </div>
      <div v-else class="flex flex-col td-dblist-body">
        <div
          v-for="(db, idx) in databases"
          :key="idx"
          class="td-dblist-item"
          :class="{ 'td-dblist-item-active': activeIndex === idx }"
          @click="selectDatabase(idx)"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.dbList.clickToAdd')"
        >
          <span class="text-nowrap">{{ db.database_name }}</span>
        </div>
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDServerPostgreSQLAPI from "@/common/api/request/AgentAPI/TDServerPostgreSQLAPI.js";
import pgQueries from "@/views/tools/PostgreSQLQuery/templates.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

export default {
  name: "TDPostgreSQLDatabaseList",
  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      connectionId: "",
      searchValue: "",
      isSearching: false,
      error: "",
      databases: [],
      activeIndex: -1,
      agentAPI: null,
    };
  },
  computed: {
    currentConnLabel() {
      const conn = this.ownerForm?.allConnections?.find(
        (c) => c.id === this.connectionId,
      );
      return conn?.connection_name ?? conn?.connection_string ?? "";
    },
  },
  mounted() {
    this.agentAPI = new TDServerPostgreSQLAPI();
  },
  methods: {
    async show(param) {
      this.connectionId = param?.connectionId ?? "";
      this.databases = [];
      this.error = "";
      this.activeIndex = -1;
      await this.handleSearch();
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },

    async handleSearch() {
      if (!this.connectionId) {
        this.$tdToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.noConnectionSelected"),
        );
        return;
      }
      this.isSearching = true;
      this.databases = [];
      this.error = "";
      this.activeIndex = -1;

      try {
        const resp = await this.agentAPI.executeQuery(
          this.connectionId,
          pgQueries.pg_inspect_list_databases,
        );
        const result =
          resp?.data?.data?.results?.[0] || resp?.data?.data || null;

        if (resp?.data?.success && result?.rows?.length > 0) {
          let rows = result.rows;
          // Filter theo searchValue nếu có
          const q = this.searchValue?.trim()?.toLowerCase();
          if (q) {
            rows = rows.filter(
              (r) =>
                r.database_name && r.database_name.toLowerCase().includes(q),
            );
          }
          this.databases = rows;
        } else {
          this.error =
            resp?.data?.message ||
            this.$t("i18nCommon.postgreSQLQuery.dbList.loadError");
        }
      } catch (e) {
        this.error =
          e?.message ||
          this.$t("i18nCommon.postgreSQLQuery.dbList.loadErrorFallback");
      } finally {
        this.isSearching = false;
      }
    },

    async selectDatabase(idx) {
      this.activeIndex = idx;
      const db = this.databases[idx];
      if (!db?.database_name) return;

      // Lấy thông tin kết nối hiện tại từ ownerForm
      const currentConn = this.ownerForm?.allConnections?.find(
        (c) => c.id === this.connectionId,
      );
      if (!currentConn?.connection_string) {
        this.$tdToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.noConnectionString"),
        );
        return;
      }

      const fields = this.ownerForm.parseConnectionStringToFields(
        currentConn.connection_string,
      );

      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDPostgreSQLConnectionPopup,
        ownerForm: this.ownerForm,
        param: {
          connection_name: `${db.database_name} - ${fields.host}`,
          group_id: currentConn.group_id ?? "",
          connFields: {
            host: fields.host,
            port: fields.port,
            database: db.database_name,
            username: fields.username,
            password: fields.password,
            sslmode: fields.sslmode,
          },
        },
        callback: async (payload) => {
          if (payload?.saved) {
            await this.ownerForm?.loadConnections?.();
          }
        },
      });
    },
  },
};
</script>

<style scoped lang="scss">
.td-pg-dblist-popup {
  gap: var(--padding);
  margin: var(--padding);
  flex: 1;
  min-height: 0;
}

.td-dblist-search-bar {
  width: 100%;
  gap: var(--padding);
  align-items: center;
  flex-shrink: 0;

  .td-dblist-current {
    font-size: var(--font-size-small);
    color: var(--text-secondary-color);
    white-space: nowrap;
    padding: 0 var(--padding);
    border-left: 1px solid var(--border-color);
  }
}

.td-dblist-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--padding) * 4) 0;
}

.td-dblist-empty {
  color: var(--text-secondary-color);
  font-size: var(--font-size-small);
  padding: var(--padding);
}

.td-dblist-error {
  color: var(--text-error-color);
  font-size: var(--font-size-small);
  padding: var(--padding);
}

.td-dblist-body {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 4px;
  max-height: 400px;
}

.td-dblist-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 44px;
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
</style>
