<template>
  <div class="flex td-header-container">
    <div class="flex td-app-name">
      <div class="td-logo"></div>
      <div class="td-app-title">{{ $t("i18nGlobal.appinfo.appName") }}</div>
      <!-- Search Box -->
      <div class="td-search-container">
        <div class="td-search-box" @click="openSearchModal">
          <div class="td-icon td-search-icon"></div>
          <span class="td-search-placeholder">{{
            $t("i18nCommon.search.placeholder")
          }}</span>
          <div class="td-search-shortcut">
            <span>CTRL/⌘</span>
            <span>K</span>
          </div>
        </div>

        <!-- Search Modal -->
        <div
          v-if="isSearchModalOpen"
          class="td-search-modal-overlay"
          @click="closeSearchModal"
        >
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
              <button class="td-search-close" @click="closeSearchModal">
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
                  <div class="td-icon" :class="route.meta.icon"></div>
                  <div class="td-search-item-content">
                    <div class="td-search-item-title">
                      {{ $t(route.meta.titleKey) }}
                    </div>
                    <div
                      class="td-search-item-description"
                      v-if="route.description"
                    >
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
        </div>
      </div>
    </div>

    <div>
      <div class="td-header-btn">
        <div
          class="td-icon td-theme-toggle"
          :class="{ 'td-theme-toggle-dark': isDarkTheme }"
          @click="toggleTheme"
        ></div>
        <div class="td-icon tg-github" @click="goToSource"></div>
        <div class="noselect language-session" @click="changeLanguage">
          {{ currentLanguage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadLocale } from "@/i18n/i18nData.js";
import { routerConfig } from "@/router/router.js";

export default {
  name: "TDHeader",
  components: {},
  computed: {
    filteredRoutes() {
      if (!this.searchQuery) return [];
      const query = this.searchQuery.normalizeText();

      return this.routerConfig
        .filter((route) => {
          const title = this.$t(route.meta.titleKey).normalizeText();
          const routeName = route.name.normalizeText();

          return title.includes(query) || routeName.includes(query);
        })
        .slice(0, 8); // Giới hạn 8 kết quả
    },
  },
  created() {
    let me = this;
    me.processWhenCreated();
  },
  mounted() {
    // Thêm keyboard shortcut Cmd+K / Ctrl+K
    document.addEventListener("keydown", this.handleGlobalKeydown);

    this.$tdEventBus.on(
      this.$tdEnum.eventGlobal.changeLanguage,
      this.changeLangFromEvent
    );
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.handleGlobalKeydown);

    this.$tdEventBus.off(
      this.$tdEnum.eventGlobal.changeLanguage,
      this.changeLangFromEvent
    );
  },
  props: {},
  data() {
    let me = this;
    return {
      isDarkTheme: false,
      currentLanguage: null,
      languageList: Object.keys(me.$tdEnum.language),
      // Search related
      isSearchModalOpen: false,
      searchQuery: "",
      selectedIndex: 0,
      routerConfig: routerConfig.filter((route) => route.name !== "home"), // Loại bỏ trang home
    };
  },
  methods: {
    async processWhenCreated() {
      let me = this;
      let currentTheme = await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme);
      if (!currentTheme) {
        currentTheme = window.__env.defaultValue.theme;
        await me.$tdCache.set(me.$tdEnum.cacheConfig.Theme, currentTheme);
      }
      me.isDarkTheme = currentTheme == me.$tdEnum.theme.dark;
      me.currentLanguage = await me.getCurrentLanguage();
    },

    async toggleTheme() {
      let me = this;
      me.isDarkTheme = !me.isDarkTheme;
      let currentTheme = me.isDarkTheme
        ? me.$tdEnum.theme.dark
        : me.$tdEnum.theme.light;
      await me.$tdCache.set(me.$tdEnum.cacheConfig.Theme, currentTheme);
      me.$tdUtility.setTheme(currentTheme);
      this.$tdEventBus.emit(this.$tdEnum.eventGlobal.changeTheme, currentTheme);
    },

    goToSource() {
      let me = this;
      if (window.__env.githubSource && window.__env.githubSource.url) {
        window.open(window.__env.githubSource.url, "_blank").focus();
      }
    },

    async getCurrentLanguage() {
      let currentLanguage = await this.$tdCache.get(
        this.$tdEnum.cacheConfig.Language
      );
      if (currentLanguage) {
        return currentLanguage;
      }
      return this.$tdEnum.language.vi;
    },

    async changeLanguage() {
      let me = this;
      let currentIndex = me.languageList.indexOf(me.currentLanguage);
      let nextIndex = (currentIndex + 1) % me.languageList.length;
      me.currentLanguage = me.languageList[nextIndex];
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.Language,
        me.currentLanguage
      );
      await loadLocale(me.currentLanguage);
      this.$tdEventBus.emit(
        this.$tdEnum.eventGlobal.changeLanguageFromSidebar,
        me.currentLanguage
      );
    },

    changeLangFromEvent(data, options) {
      if (data) {
        this.currentLanguage = data;
      }
    },

    // Search methods
    openSearchModal() {
      this.isSearchModalOpen = true;
      this.$nextTick(() => {
        this.$refs.searchInput?.focus();
      });
    },

    closeSearchModal() {
      this.isSearchModalOpen = false;
      this.searchQuery = "";
      this.selectedIndex = 0;
    },

    handleGlobalKeydown(event) {
      // Cmd+K hoặc Ctrl+K để mở search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        this.openSearchModal();
      }
      // ESC để đóng search
      if (event.key === "Escape" && this.isSearchModalOpen) {
        this.closeSearchModal();
      }
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
      this.closeSearchModal();
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/styles/icon.scss";

.td-header-container {
  width: 100%;
  height: 100%;
  background-color: var(--bg-main-color);
  justify-content: space-between;
  padding: var(--padding) calc(var(--padding) * 1.5);

  .td-app-name {
    column-gap: var(--padding);
    .td-logo {
      width: 40px;
      height: 40px;
      background: url(@/assets/favicon.ico);
      background-size: cover;
    }
    .td-app-title {
      font-size: 18px;
      font-weight: 700;
    }
  }

  .td-search-container {
    position: relative;
    width: 200px;
    margin: 0 var(--padding);

    .td-search-box {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background-color: var(--bg-thirt-color);
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border: 1px solid var(--focus-color);
      }

      .td-search-placeholder {
        flex: 1;
        font-size: 14px;
      }

      .td-search-shortcut {
        display: flex;
        gap: 2px;
        span {
          padding: 4px 6px;
          background-color: var(--bg-layer-color);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-color-secondary);
        }
      }
    }

    .td-search-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
    }

    .td-search-modal {
      width: 100%;
      max-width: 600px;
      max-height: 70vh;
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
            background-color: var(--bg-sub-color);
          }
        }
      }

      .td-search-results {
        max-height: 400px;
        overflow-y: auto;

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
              background-color: var(--bg-sub-color);
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
  }

  .td-header-btn {
    position: relative;
    display: flex;
    column-gap: var(--padding);
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: var(--padding);

    .td-theme-toggle,
    .tg-github {
      cursor: pointer;
      width: 24px;
      height: 24px;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }
    }

    .td-theme-toggle {
      background-position: -26px 0px;
      &.td-theme-toggle-dark {
        background-position: -48px 0px;
      }
    }

    .tg-github {
      background-position: -76px 0px;
    }

    .language-session {
      cursor: pointer;
      color: var(--btn-color);
      text-transform: uppercase;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background-color: var(--btn-secondary-color);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .td-search-container {
    max-width: 200px;

    .td-search-shortcut {
      display: none;
    }
  }

  .td-search-modal {
    margin: 0 16px;
    max-width: calc(100vw - 32px);
  }
}
</style>
