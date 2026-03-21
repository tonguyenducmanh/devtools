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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.jsonToExcel.howToUse.input") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToExcel.howToUse.convert") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToExcel.howToUse.download") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToExcel.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.jsonToExcel.features.boldHeader") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToExcel.features.autoWidth") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToExcel.features.freezeRow") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToExcelHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
