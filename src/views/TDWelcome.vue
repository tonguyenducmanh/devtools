<template>
  <div class="flex flex-col wrap-container">
    <div class="container">
      <div class="main-line-title">Dev Tools</div>
      <p class="description">{{ $t("i18nCommon.createbyAuthor") }}</p>
    </div>
    <p class="agreement">{{ $t("i18nCommon.agreement") }}</p>
    <div class="language-buttons">
      <div
        v-for="lang in languageList"
        :key="lang.key"
        :class="['language-btn', { active: currentLanguage === lang.key }]"
        @click="changeLanguage(lang.key)"
      >
        {{ lang && lang.name ? lang.name.toUpperCase() : null }}
      </div>
    </div>
  </div>
</template>
<script>
import { loadLocale } from "@/i18n/i18nData.js";

export default {
  name: "TDWelcome",
  data() {
    return {
      currentLanguage: null,
      languageList: Object.keys(this.$tdEnum.language).sort(),
    };
  },
  async created() {
    // Get current language when component is created
    this.currentLanguage = await this.getCurrentLanguage();
    let locate = [];
    for (let key in this.$tdEnum.language) {
      let languageName = this.$t(`i18nGlobal.language.${key}`);
      locate.push({ key, name: languageName });
    }
    this.languageList = locate.sort((a, b) => a.key - b.key);
  },
  methods: {
    async getCurrentLanguage() {
      let currentLanguage = await this.$tdCache.get(
        this.$tdEnum.cacheConfig.Language,
      );
      if (currentLanguage) {
        return currentLanguage;
      }
      return this.$tdEnum.language.vi;
    },
    async changeLanguage(lang) {
      // Only change if different language is selected
      if (this.currentLanguage !== lang) {
        this.currentLanguage = lang;
        await this.$tdCache.set(
          this.$tdEnum.cacheConfig.Language,
          this.currentLanguage,
        );
        await loadLocale(this.currentLanguage);
        this.$tdUtility.reloadApp();
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
      this.$tdEnum.eventGlobal.changeLanguageFromSidebar,
      this.changeLangFromEvent,
    );
  },
  beforeUnmount() {
    this.$tdEventBus.off(
      this.$tdEnum.eventGlobal.changeLanguageFromSidebar,
      this.changeLangFromEvent,
    );
  },
};
</script>
<style lang="scss" scoped>
.wrap-container {
  width: 100%;
  height: 100%;
}
.agreement {
  color: var(--text-color-light);
  text-align: center;
  width: 95%;
  margin: var(--padding);
}
body[data-theme="dark"] .agreement {
  color: var(--text-color-dark);
}
.language-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 30px;
}

.language-btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--btn-secondary-color);
  color: var(--btn-secondary-text-color);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: var(--btn-secondary-focus-color);
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--btn-color);
    background-color: var(--btn-color);
    color: white;
  }
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex: 1;
}
.main-line-title {
  font-size: 150px;
  font-family: var(--straight-font);
  font-weight: 700;
  position: relative;
  opacity: 1;
  visibility: visible;
  z-index: 1;
}
.main-line-title::before {
  content: " ";
  display: block;
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 30%;
  margin-top: 7%;
  background-color: var(--btn-color);
  transform-origin: top left;
  mix-blend-mode: color;
  box-sizing: border-box;
  transition: transform 0.6s cubic-bezier(0.075, 0.82, 0.165, 1) 0.5s;
  transform: translateY(-50%) rotate(-4deg) scaleX(1);
}
.description {
  font-family: var(--straight-font);
  font-size: 40px;
}
</style>
