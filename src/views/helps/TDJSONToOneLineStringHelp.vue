<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToOneLineString.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToOneLineString.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToOneLineString.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.jsonToOneLineString.howToUse.input") }}</div>
          <div class="section-item">{{ $t("i18nHelp.jsonToOneLineString.howToUse.selectLanguage") }}</div>
          <div class="section-item">{{ $t("i18nHelp.jsonToOneLineString.howToUse.convert") }}</div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToOneLineString.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.jsonToOneLineString.features.languages") }}</div>
          <div class="section-item">{{ $t("i18nHelp.jsonToOneLineString.features.escapeUnicode") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToOneLineStringHelp",
};
</script>

<style lang="scss">
@import "@/styles/help.scss";
</style>
