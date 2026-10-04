<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    :title="$t('i18nCommon.postgreSQLQuery.dbList.title')"
  >
    <div class="flex flex-col tm-pg-dblist-popup">
      <div class="flex tm-dblist-search-bar">
        <div class="flex-one">
          <TMInput
            v-model="searchValue"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.dbList.searchPlaceholder')
            "
            @keyup.enter="handleSearch"
          />
        </div>
        <TMButton
          :noMargin="true"
          iconClass="tm-send-icon"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.dbInspect.execButton')"
          @click="handleSearch"
          :readOnly="isSearching"
        />
        <span class="tm-dblist-current">{{ currentConnLabel }}</span>
      </div>
      <div v-if="isSearching" class="flex tm-dblist-loading">
        <TMLoading />
      </div>
      <div v-else-if="error" class="tm-dblist-error">
        {{ error }}
      </div>
      <div v-else-if="databases.length === 0" class="tm-dblist-empty">
        {{ $t("i18nCommon.noDataAvailable") }}
      </div>
      <div v-else class="flex flex-col tm-dblist-body">
        <div
          v-for="(db, idx) in databases"
          :key="idx"
          class="tm-dblist-item"
          :class="{ 'tm-dblist-item-active': activeIndex === idx }"
          @click="selectDatabase(idx)"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.dbList.clickToAdd')"
        >
          <span class="text-nowrap">{{ db.database_name }}</span>
        </div>
      </div>
    </div>
  </TMPopup>
</template>

<script>
import TMServerPostgreSQLAPI from "@/common/api/request/AgentAPI/TMServerPostgreSQLAPI.js";
import { pgQueries } from "@/templates/postgresqlToolQuery/templates.js";
import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";

export default {
  name: "TMPostgreSQLDatabaseList",
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
      const conn = this.ownerForm?.allCollectionItems?.find(
        (c) => c.id === this.connectionId,
      );
      return conn?.connection_name ?? conn?.connection_string ?? "";
    },
  },
  mounted() {
    this.agentAPI = new TMServerPostgreSQLAPI();
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
        this.$tmToast.warning(
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
      const currentConn = this.ownerForm?.allCollectionItems?.find(
        (c) => c.id === this.connectionId,
      );
      if (!currentConn?.connection_string) {
        this.$tmToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.noConnectionString"),
        );
        return;
      }

      const fields = this.ownerForm.parseConnectionStringToFields(
        currentConn.connection_string,
      );

      TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMPostgreSQLConnectionPopup,
        ownerForm: this.ownerForm,
        param: {
          connection_name: db.database_name,
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
            await this.ownerForm?.loadCollection?.();
          }
        },
      });
    },
  },
};
</script>

<style scoped lang="scss">
.tm-pg-dblist-popup {
  gap: var(--padding);
  margin: var(--padding);
  flex: 1;
  min-height: 0;
}

.tm-dblist-search-bar {
  width: 100%;
  gap: var(--padding);
  align-items: center;
  flex-shrink: 0;

  .tm-dblist-current {
    font-size: var(--font-size-small);
    color: var(--text-secondary-color);
    white-space: nowrap;
    padding: 0 var(--padding);
    border-left: 1px solid var(--border-color);
  }
}

.tm-dblist-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--padding) * 4) 0;
}

.tm-dblist-empty {
  color: var(--text-secondary-color);
  font-size: var(--font-size-small);
  padding: var(--padding);
}

.tm-dblist-error {
  color: var(--text-error-color);
  font-size: var(--font-size-small);
  padding: var(--padding);
}

.tm-dblist-body {
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

.tm-dblist-item {
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
