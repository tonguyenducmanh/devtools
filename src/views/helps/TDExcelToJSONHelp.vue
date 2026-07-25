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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.excelToJSON.howToUse.upload") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.excelToJSON.howToUse.result") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.excelToJSON.howToUse.download") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.excelToJSON.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.excelToJSON.features.multiSheet") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.excelToJSON.features.outputFormat") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.excelToJSON.features.trimValues") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDExcelToJSONHelp",
};
</script>
