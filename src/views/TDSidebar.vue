<template>
  <div class="td-sidebar-container">
    <div
      class="td-icon td-menu"
      :class="{ 'td-menu-sibar-hide': !isShowSidebar }"
      @click="toggleSidebar"
    ></div>
    <div v-if="isShowSidebar" class="td-sidebar">
      <!-- <div class="td-filter-tool">
        <TDInput
          v-model="queryTool"
          :placeHolder="$t('i18nCommon.sidebar.filter')"
          @keyup.enter="filterToolNow"
          @input="filterToolNow"
        />
      </div> -->
      <div class="td-tool-group">
        <template v-for="(item, index) in routerLink">
          <RouterLink
            class="td-sidebar-item"
            activeClass="td-item-active"
            :id="index"
            :to="item.pathVisible ?? item.path"
            ><span>{{ $t(item.meta.titleKey) }}</span></RouterLink
          >
        </template>
      </div>
      <div class="td-sidebar-bottom">
        <div v-if="versionApp">{{ versionApp }}</div>
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
import { routerConfig } from "@/router/router.js";
import { loadLocale } from "@/i18n/i18nData.js";

export default {
  name: "TDSidebar",
  components: {},
  computed: {
    versionApp() {
      let version = "v1.0.0";
      if (window && window.__env && window.__env.version) {
        version = window.__env.version;
      }
      return version;
    },
  },
  created() {
    let me = this;
    me.processWhenCreated();
  },
  mounted() {},
  props: {},
  data() {
    let me = this;
    return {
      routerLink: routerConfig,
      isShowSidebar: true,
      isDarkTheme: false,
      queryTool: null,
      currentLanguage: null,
      languageList: Object.keys(me.$tdEnum.language),
    };
  },
  methods: {
    filterToolNow() {
      let me = this;
      let allTool = routerConfig;
      if (me.queryTool && allTool && allTool.length > 0) {
        allTool.forEach((element) => {
          if (element.meta && element.meta.titleKey) {
            element.meta.title = me.$t(element.meta.titleKey);
          }
        });
        allTool = allTool.filter((x) =>
          x.meta.title.containsNotSentive(me.queryTool)
        );
      }
      me.routerLink = allTool;
    },
    async processWhenCreated() {
      let me = this;
      let currentTheme = await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme);
      if (!currentTheme) {
        currentTheme = window.__env.defaultValue.theme;
        await me.$tdCache.set(me.$tdEnum.cacheConfig.Theme, currentTheme);
      }
      me.isDarkTheme = currentTheme == me.$tdEnum.theme.dark;
      let toggleSidebarState = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.IsShowSidebar
      );
      if (toggleSidebarState) {
        me.isShowSidebar = toggleSidebarState.value;
      }
      me.currentLanguage = await me.getCurrentLanguage();
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
    async toggleSidebar() {
      let me = this;
      me.isShowSidebar = !me.isShowSidebar;
      await me.$tdCache.set(me.$tdEnum.cacheConfig.IsShowSidebar, {
        value: me.isShowSidebar,
      });
    },
    goToSource() {
      let me = this;
      if (window.__env.githubSource && window.__env.githubSource.url) {
        window.open(window.__env.githubSource.url, "_blank").focus();
      }
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
.td-sidebar-container {
  position: relative;
}

.td-sidebar {
  position: relative;
  width: 250px;
  min-width: 250px;
  max-width: 250px;
  height: 100%;
  background-color: var(--bg-main-color);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  transition: transform 0.3s ease-in-out;
  border-right: 1px solid var(--border-color);

  .td-filter-tool {
    display: flex;
    margin: var(--padding);
    width: calc(100% - 2 * var(--padding));
  }

  .td-sidebar-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 36px;
    padding: var(--padding);
    padding-left: var(--padding-large);
    color: var(--text-color);
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      background-color: var(--bg-sub-color);
      span {
        transform: translateX(2px);
      }
    }

    &.td-item-active {
      background-color: var(--btn-color);
      color: white;
      font-weight: 600;
    }
  }

  .td-tool-group {
    flex: 1;
    overflow: auto;
    width: 100%;
    padding-top: var(--padding);
    scrollbar-width: thin;
    scrollbar-color: var(--scroll-thumb-color) transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--scroll-thumb-color);
      border-radius: 3px;
    }
  }

  .td-sidebar-bottom {
    position: relative;
    display: flex;
    column-gap: var(--padding);
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: var(--padding);
    border-top: 1px solid var(--border-color);

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

.td-menu {
  position: absolute;
  cursor: pointer;
  background-position: 0px 0px;
  z-index: 2;
  top: 0;
  left: 100%;
}
.td-sidebar {
  animation: slideIn 0.3s ease-out forwards;
}
</style>
