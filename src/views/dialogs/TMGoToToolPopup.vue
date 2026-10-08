<template>
  <TMPopup :visible="true" :showHeader="false" @close="handleClose">
    <div class="flex flex-col tm-search-modal" @click.stop>
      <div class="tm-search-input-container">
        <div class="tm-icon tm-search-icon"></div>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="$t('i18nCommon.search.placeholder')"
          class="tm-search-input"
          @keydown="handleKeydown"
        />
        <button class="tm-search-close" @click="handleClose">
          <div class="tm-icon tm-close-icon"></div>
        </button>
      </div>

      <div class="flex-one tm-search-results" v-if="filteredRoutes.length > 0">
        <div class="tm-search-section">
          <div
            v-for="(route, index) in filteredRoutes"
            :key="route.name"
            class="tm-search-item"
            :class="{ 'tm-search-item-active': index === selectedIndex }"
            @click="selectRoute(route)"
            @mouseenter="selectedIndex = index"
          >
            <div class="tm-search-item-content">
              <div class="tm-search-item-title">
                {{ $t(route.meta.titleKey) }}
              </div>
              <!-- Hiển thị tên group cha nếu tool thuộc group -->
              <div
                class="tm-search-item-description"
                v-if="route.groupTitleKey"
              >
                {{ $t(route.groupTitleKey) }}
              </div>
            </div>
            <div class="tm-search-item-shortcut">
              <span>Enter</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="searchQuery && filteredRoutes.length === 0"
        class="flex-one tm-search-empty"
      >
        <div class="tm-search-empty-text">
          {{ $t("i18nCommon.search.noResults") }}
        </div>
      </div>

      <div v-else class="flex-one tm-search-help">
        <div class="tm-search-help-text">
          {{ $t("i18nCommon.search.help") }}
        </div>
      </div>
    </div>
  </TMPopup>
</template>

<script>
import { getAllSearchableRoutes } from "@/stores/TMToolConfigs.js";
import { useTabManager } from "@/stores/TMTabManager.js";
import TMShortcutAction, {
  TMShortcutActionEnum,
} from "@/common/TMShortcutAction.js";
export default {
  name: "TMGoToToolPopup",

  props: {
    ownerForm: {
      type: Object,
      required: false,
      default: null,
    },
  },

  setup() {
    const { openTab } = useTabManager();
    return { openTab };
  },

  data() {
    return {
      searchQuery: "",
      selectedIndex: 0,
      // Cache danh sách route để không gọi lại mỗi lần computed
      _allRoutes: getAllSearchableRoutes(),
    };
  },

  computed: {
    filteredRoutes() {
      if (!this.searchQuery) return [];
      const query = this.searchQuery.normalizeText();

      return this._allRoutes
        .filter((route) => {
          const title = this.$t(route.meta.titleKey).normalizeText();
          const name = route.name.normalizeText();
          // Tìm theo tên tool hoặc tên group
          const groupTitle = route.groupTitleKey
            ? this.$t(route.groupTitleKey).normalizeText()
            : "";
          return (
            title.includes(query) ||
            name.includes(query) ||
            groupTitle.includes(query)
          );
        })
        .slice(0, 8);
    },
  },

  watch: {
    // Reset selected index khi kết quả thay đổi
    filteredRoutes() {
      this.selectedIndex = 0;
    },
  },

  mounted() {
    this.$refs.searchInput?.focus();
    TMShortcutAction.unregisterByEnum(TMShortcutActionEnum.Search);
  },
  beforeUnmount() {
    TMShortcutAction.registerByEnum(TMShortcutActionEnum.Search);
  },

  methods: {
    handleClose() {
      TMShortcutAction.registerByEnum(TMShortcutActionEnum.Search);
      this.$emit("close");
    },

    show() {},
    handleKeydown(event) {
      if (!this.filteredRoutes.length) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          this.selectedIndex = Math.min(
            this.selectedIndex + 1,
            this.filteredRoutes.length - 1,
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
      }
    },

    selectRoute(route) {
      this.openTab({
        titleKey: route.meta.titleKey,
        helpKey: route.meta.helpKey,
        groupKey: route.groupKey || "",
        toolKey: route.name,
        component: route.component,
      });
      this.handleClose();
    },
  },
};
</script>

<style scoped lang="scss">
.tm-search-modal {
  width: 100%;
  height: 100%;
  background-color: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: calc(var(--border-radius) * 1.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .tm-search-input-container {
    display: flex;
    align-items: center;
    padding: 16px;
    width: 100%;
    border-bottom: 1px solid var(--border-color);

    .tm-search-icon {
      margin-right: var(--padding);
    }

    .tm-search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-color);

      &::placeholder {
        color: var(--text-color-secondary);
        opacity: var(--placeholder-opacity);
      }
    }

    .tm-search-close {
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

  .tm-search-results {
    width: 100%;
    overflow: auto;

    .tm-search-section {
      padding: 8px 0;

      .tm-search-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover,
        &.tm-search-item-active {
          background-color: var(--bg-layer-color);
        }

        .tm-search-item-content {
          flex: 1;

          .tm-search-item-title {
            font-weight: 500;
            color: var(--text-color);
            margin-bottom: 2px;
          }

          .tm-search-item-description {
            font-size: 12px;
            color: var(--text-color-secondary);
          }
        }

        .tm-search-item-shortcut {
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

  .tm-search-empty,
  .tm-search-help {
    padding: 40px 16px;
    text-align: center;

    .tm-search-empty-text,
    .tm-search-help-text {
      color: var(--text-color-secondary);
      font-size: 14px;
    }
  }
}
</style>
