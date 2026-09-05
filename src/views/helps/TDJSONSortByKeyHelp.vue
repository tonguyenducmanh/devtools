<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonSortByKey.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonSortByKey.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonSortByKey.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonSortByKey.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonSortByKey.howToUse.sort") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonSortByKey.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonSortByKey.features.recursive") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonSortByKey.features.example") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonSortByKey.features.history") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONSortByKeyHelp",
};
</script>

<style lang="scss" scoped>
@use "@/styles/help.scss";
</style>
