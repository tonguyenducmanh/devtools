<template>
  <div class="flex td-header-container">
    <div class="flex td-app-name">
      <div class="td-logo"></div>
      <div class="td-app-title">{{ $t("i18nGlobal.appinfo.appName") }}</div>
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

export default {
  name: "TDHeader",
  components: {},
  computed: {},
  created() {
    let me = this;
    me.processWhenCreated();
  },
  mounted() {},
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
  },
  mounted() {
    this.$tdEventBus.on(
      this.$tdEnum.eventGlobal.changeLanguage,
      this.changeLangFromEvent
    );
  },
  beforeUnmount() {
    this.$tdEventBus.off(
      this.$tdEnum.eventGlobal.changeLanguage,
      this.changeLangFromEvent
    );
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
    }
    .td-app-title {
      font-size: 18px;
      font-weight: 700;
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
</style>
