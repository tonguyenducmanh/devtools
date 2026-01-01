<template>
  <div class="flex td-header-container">
    <div class="flex td-app-name">
      <div class="td-logo" @click="goToWelcome"></div>
      <div class="td-app-title" @click="goToWelcome">{{ appName }}</div>
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
      </div>
    </div>

    <div>
      <div class="td-header-btn">
        <!-- Updated Dark Mode Toggle -->
        <button
          v-tooltip="$t('i18nCommon.tdheader.toggleTheme')"
          class="td-theme-toggle-switch"
          @click="toggleTheme"
          :class="{ 'td-switch-dark': isDarkTheme }"
        >
          <div class="td-switch-track">
            <div class="td-switch-thumb">
              <svg
                class="td-theme-icon td-sun-icon"
                :class="{ 'td-icon-visible': !isDarkTheme }"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <circle cx="12" cy="12" r="5" />
                <path
                  d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                />
              </svg>
              <svg
                class="td-theme-icon td-moon-icon"
                :class="{ 'td-icon-visible': isDarkTheme }"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
          </div>
        </button>
        <div
          class="noselect language-session"
          @click="changeLanguage"
          v-tooltip="$t('i18nCommon.tdheader.changeLanguage')"
        >
          {{ currentLanguage }}
        </div>
        <div
          class="td-icon tg-github"
          @click="goToSource"
          v-tooltip="$t('i18nCommon.tdheader.goToSource')"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadLocale } from "@/i18n/i18nData.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

export default {
  name: "TDHeader",
  components: {},
  computed: {
    appName() {
      return window.__env.appName;
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
    goToWelcome() {
      let me = this;
      me.$router.push("/");
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
      me.$tdUtility.reloadApp();
    },

    goToSource() {
      let me = this;
      me.$tdUtility.goToSource();
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
      // nếu không tồn tại request thì show popup tạo mới
      TDDialogUtil.show({
        dialogType: TDDialogEnum.TDGoToToolPopup,
        ownerForm: this,
      });
    },

    handleGlobalKeydown(event) {
      // Cmd+K hoặc Ctrl+K để mở search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        this.openSearchModal();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
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
      cursor: pointer;
    }
    .td-app-title {
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
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
  }

  .td-header-btn {
    position: relative;
    display: flex;
    column-gap: var(--padding);
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: var(--padding);

    // New Toggle Switch Style
    .td-theme-toggle-switch {
      position: relative;
      width: 48px;
      height: 24px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      outline: none;

      .td-switch-track {
        position: relative;
        width: 100%;
        height: 100%;
        background-color: var(--bg-layer-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }
      .td-switch-track:hover {
        border: 1px solid var(--focus-color);
      }
      .td-switch-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        background-color: var(--bg-main-color);
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
      }

      .td-theme-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;
        transition: all 0.2s ease;
        color: var(--text-color-secondary);

        &.td-icon-visible {
          opacity: 1;
        }
      }

      .td-sun-icon.td-icon-visible {
        color: var(--btn-color);
      }

      .td-moon-icon.td-icon-visible {
        color: var(--btn-color);
      }

      // Dark mode state
      &.td-switch-dark {
        .td-switch-thumb {
          transform: translateX(24px);
          background-color: var(--bg-main-color);
        }
      }

      // Hover effects
      &:hover {
        .td-switch-track {
          transform: scale(1.02);
        }

        .td-switch-thumb {
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
      }

      &:active {
        .td-switch-track {
          transform: scale(0.98);
        }
      }
    }

    .tg-github {
      cursor: pointer;
      width: 20px;
      height: 20px;
      transition: transform 0.2s ease;
      background-position: -76px 0px;

      &:hover {
        transform: scale(1.1);
      }
    }

    .language-session {
      cursor: pointer;
      color: var(--btn-color);
      text-transform: uppercase;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: calc(var(--border-radius) * 1.5);
      border: 1px solid var(--border-color);
      background-color: var(--btn-secondary-color);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--focus-color);
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

  .td-header-btn {
    .td-theme-toggle-switch {
      width: 44px;
      height: 22px;

      .td-switch-thumb {
        width: 16px;
        height: 16px;
        top: 2px;

        &.td-switch-dark {
          transform: translateX(20px);
        }
      }
    }
  }
}

// Dark mode specific animations
@media (prefers-reduced-motion: no-preference) {
  .td-theme-toggle-switch {
    .td-switch-thumb {
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .td-theme-icon {
      transition: all 0.3s ease;
    }

    &.td-switch-dark .td-switch-thumb {
      animation: switchSlide 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  }
}

@keyframes switchSlide {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(26px) scale(1.1);
  }
  100% {
    transform: translateX(24px) scale(1);
  }
}
</style>
