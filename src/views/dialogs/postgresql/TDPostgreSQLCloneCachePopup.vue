<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    :title="$t('i18nCommon.postgreSQLQuery.cloneIntellisenseTitle')"
  >
    <div class="flex flex-col td-pg-clone-popup">
      <div class="flex td-clone-search-bar">
        <div class="flex-one">
          <TDInput
            v-model="searchValue"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.cloneIntellisenseSearch')
            "
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
      <div v-if="isChecking" class="flex td-clone-loading">
        <TDLoading />
      </div>
      <div v-else-if="filteredConnections.length === 0" class="td-clone-empty">
        {{ $t("i18nCommon.postgreSQLQuery.cloneIntellisenseEmpty") }}
      </div>
      <div v-else class="flex flex-col td-clone-body">
        <div
          v-for="(conn, idx) in filteredConnections"
          :key="idx"
          class="td-clone-item"
          :class="{ 'td-clone-item-active': activeIndex === idx }"
          @click="selectConnection(idx)"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.cloneIntellisenseTooltip')"
        >
          <span class="text-nowrap">{{
            conn.connection_name || conn.connection_string
          }}</span>
        </div>
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDCache from "@/common/cache/TDCache.js";

export default {
  name: "TDPostgreSQLCloneCachePopup",
  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      currentConnectionId: "",
      searchValue: "",
      allCachedConnections: [],
      isChecking: false,
      activeIndex: -1,
      isCloning: false,
    };
  },
  computed: {
    filteredConnections() {
      const q = this.searchValue?.trim()?.toLowerCase();
      if (!q) return this.allCachedConnections;
      return this.allCachedConnections.filter((c) =>
        (c.connection_name || c.connection_string)?.toLowerCase().includes(q),
      );
    },
  },
  methods: {
    async show(param) {
      this.currentConnectionId = param?.connectionId ?? "";
      this.searchValue = "";
      this.allCachedConnections = [];
      this.activeIndex = -1;
      this.isChecking = true;
      await this.loadConnectionsWithCache();
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },

    handleSearch() {
      // searchValue reactively filters via computed
    },

    async loadConnectionsWithCache() {
      const all = this.ownerForm?.allConnections ?? [];
      const others = all.filter((c) => c.id !== this.currentConnectionId);
      if (others.length === 0) {
        this.isChecking = false;
        return;
      }

      const cacheKey = this.$tdEnum.cacheConfig.PostgreSQLQueryHistory;
      const results = await Promise.all(
        others.map(async (conn) => {
          try {
            const cached = await TDCache.get(cacheKey, { id: conn.id });
            return cached ? conn : null;
          } catch {
            return null;
          }
        }),
      );
      this.allCachedConnections = results.filter(Boolean);
      this.isChecking = false;
    },

    async selectConnection(idx) {
      const conn = this.filteredConnections[idx];
      if (!conn?.id) return;

      this.isCloning = true;
      this.activeIndex = idx;
      try {
        const cacheKey = this.$tdEnum.cacheConfig.PostgreSQLQueryHistory;
        const cached = await TDCache.get(cacheKey, { id: conn.id });
        if (!cached) {
          this.$tdToast.warning(
            this.$t("i18nCommon.postgreSQLQuery.cloneIntellisenseNoCache"),
          );
          return;
        }
        await TDCache.set(cacheKey, cached, {
          id: this.currentConnectionId,
        });
        await this.ownerForm?.applyMonacoIntellisense?.(cached);
        this.$tdToast.success(
          this.$t("i18nCommon.postgreSQLQuery.cloneIntellisenseSuccess").format(
            conn.connection_name || conn.connection_string,
          ),
        );
        this.handleClose({ cloned: true });
      } catch (e) {
        this.$tdToast.error(
          e?.message ||
            this.$t("i18nCommon.postgreSQLQuery.cloneIntellisenseError"),
        );
      } finally {
        this.isCloning = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.td-pg-clone-popup {
  gap: var(--padding);
  margin: var(--padding);
  flex: 1;
  min-height: 0;
}

.td-clone-search-bar {
  width: 100%;
  gap: var(--padding);
  align-items: center;
  flex-shrink: 0;
}

.td-clone-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--padding) * 4) 0;
}

.td-clone-empty {
  color: var(--text-secondary-color);
  font-size: var(--font-size-small);
  padding: var(--padding);
}

.td-clone-body {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 4px;
}

.td-clone-item {
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
