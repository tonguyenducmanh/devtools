<template>
  <div class="flex flex-col wrap-container">
    <div class="container">
      <h1 class="tagline">
        {{ $t("i18nCommon.welcomeTextOne") }}
        <span class="accent">{{ $t("i18nCommon.welcomeTextTwo") }}</span
        ><br />{{ $t("i18nCommon.welcomeTextThree") }}
      </h1>
      <p class="description">{{ $t("i18nCommon.createbyAuthor") }}</p>
    </div>
    <div class="language-buttons">
      <div
        v-for="lang in languageList"
        :key="lang"
        :class="['language-btn', { active: currentLanguage === lang }]"
        @click="changeLanguage(lang)"
      >
        {{ lang.toUpperCase() }}
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
  },
  methods: {
    async getCurrentLanguage() {
      let currentLanguage = await this.$tdCache.get(
        this.$tdEnum.cacheConfig.Language
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
          this.currentLanguage
        );
        await loadLocale(this.currentLanguage);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.wrap-container {
  width: 100%;
  height: 100%;
}
.tagline {
  font-size: 76px;
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: -1.5px;
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
  font-family: var(--vt-font-family-base);
}
body[data-theme="light"] .accent,
body[data-theme="dark"] .tagline {
  background: -webkit-linear-gradient(315deg, #42d392 25%, #647eff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.description {
  max-width: 960px;
  line-height: 1.5;
  color: var(--text-color-light);
  transition: color 0.5s;
  font-size: 22px;
  margin: 24px auto 40px;
}
body[data-theme="dark"] .description {
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
  border: 2px solid transparent;
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
</style>
