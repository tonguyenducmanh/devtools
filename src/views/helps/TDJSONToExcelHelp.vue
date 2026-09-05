<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToExcel.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToExcel.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToExcel.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToExcel.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToExcel.howToUse.convert") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToExcel.howToUse.download") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToExcel.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToExcel.features.boldHeader") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToExcel.features.autoWidth") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToExcel.features.freezeRow") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToExcelHelp",
};
</script>
