<template>
  <div class="tm-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.duckDBQuery.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.duckDBQuery.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.howToUse.step1") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.howToUse.step2") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.howToUse.step3") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.howToUse.step4") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.howToUse.step5") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.duckDBQuery.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.features.noServer") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.features.excelSupport") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.features.multiTable") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.features.formatCode") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.features.savedScripts") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.duckDBQuery.features.sessionPersist") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TMDuckDBQueryHelp",
};
</script>
