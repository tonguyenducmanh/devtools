<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.excelToJSON.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.excelToJSON.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.excelToJSON.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.excelToJSON.howToUse.upload") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.excelToJSON.howToUse.result") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.excelToJSON.howToUse.download") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.excelToJSON.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.excelToJSON.features.multiSheet") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.excelToJSON.features.outputFormat") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.excelToJSON.features.trimValues") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDExcelToJSONHelp",
};
</script>
