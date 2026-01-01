<template>
  <TDPopup :visible="true" :showHeader="false" @close="handleClose">
    <div class="td-search-modal" @click.stop>
      <div class="td-search-input-container">
        <div class="td-icon td-search-icon"></div>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="$t('i18nCommon.search.placeholder')"
          class="td-search-input"
          @keydown="handleKeydown"
        />
        <button class="td-search-close" @click="handleClose">
          <div class="td-icon td-close-icon"></div>
        </button>
      </div>

      <div class="td-search-results" v-if="filteredRoutes.length > 0">
        <div class="td-search-section">
          <div
            v-for="(route, index) in filteredRoutes"
            :key="route.name"
            class="td-search-item"
            :class="{
              'td-search-item-active': index === selectedIndex,
            }"
            @click="selectRoute(route)"
            @mouseenter="selectedIndex = index"
          >
            <div class="td-search-item-content">
              <div class="td-search-item-title">
                {{ $t(route.meta.titleKey) }}
              </div>
              <div class="td-search-item-description" v-if="route.description">
                {{ route.description }}
              </div>
            </div>
            <div class="td-search-item-shortcut">
              <span>Enter</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="searchQuery && filteredRoutes.length === 0"
        class="td-search-empty"
      >
        <div class="td-search-empty-text">
          {{ $t("i18nCommon.search.noResults") }}
        </div>
      </div>

      <div v-else class="td-search-help">
        <div class="td-search-help-text">
          {{ $t("i18nCommon.search.help") }}
        </div>
      </div>
    </div>
  </TDPopup>
</template>

<script>
import { getRouterConfig } from "@/router/router.js";

export default {
  name: "TDGoToToolPopup",

  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      searchQuery: "",
      selectedIndex: 0,
    };
  },
  computed: {
    filteredRoutes() {
      if (!this.searchQuery) return [];
      const query = this.searchQuery.normalizeText();

      return getRouterConfig()
        .filter((route) => {
          const title = this.$t(route.meta.titleKey).normalizeText();
          const routeName = route.name.normalizeText();

          return title.includes(query) || routeName.includes(query);
        })
        .slice(0, 8); // Giới hạn 8 kết quả
    },
  },

  methods: {
    show(param) {
      let me = this;
    },
    handleClose() {
      this.$emit("close"); // popup chỉ emit
    },

    async save(collection) {
      this.handleClose();
    },

    handleKeydown(event) {
      if (!this.filteredRoutes.length) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          this.selectedIndex = Math.min(
            this.selectedIndex + 1,
            this.filteredRoutes.length - 1
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          break;
        case "Enter":
          event.preventDefault();
          if (this.filteredRoutes[this.selectedIndex]) {
            this.selectRoute(this.filteredRoutes[this.selectedIndex]);
          }
          break;
        case "Escape":
          this.closeSearchModal();
          break;
      }
    },

    selectRoute(route) {
      this.$router.push(route.pathVisible || route.path);
      this.handleClose();
    },
  },
};
</script>
<style scoped lang="scss">
.td-search-modal {
  width: 100%;
  max-width: 600px;
  height: 50vh;
  background-color: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: calc(var(--border-radius) * 1.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .td-search-input-container {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    .td-search-icon {
      margin-right: var(--padding);
    }
    .td-search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-color);

      &::placeholder {
        color: var(--text-color-secondary);
      }
    }

    .td-search-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.6;
      transition: all 0.2s ease;

      &:hover {
        opacity: 1;
        background-color: var(--bg-layer-color);
      }
    }
  }

  .td-search-results {
    max-height: 400px;
    overflow: auto;

    .td-search-section {
      padding: 8px 0;

      .td-search-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover,
        &.td-search-item-active {
          background-color: var(--bg-layer-color);
        }

        .td-icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          opacity: 0.8;
        }

        .td-search-item-content {
          flex: 1;

          .td-search-item-title {
            font-weight: 500;
            color: var(--text-color);
            margin-bottom: 2px;
          }

          .td-search-item-description {
            font-size: 12px;
            color: var(--text-color-secondary);
          }
        }

        .td-search-item-shortcut {
          span {
            padding: 2px 6px;
            background-color: var(--bg-layer-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            color: var(--text-color-secondary);
          }
        }
      }
    }
  }

  .td-search-empty,
  .td-search-help {
    padding: 40px 16px;
    text-align: center;
    .td-search-empty-text,
    .td-search-help-text {
      color: var(--text-color-secondary);
      font-size: 14px;
    }
  }
}
</style>
