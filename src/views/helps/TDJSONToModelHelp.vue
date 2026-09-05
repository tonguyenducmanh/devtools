<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToModel.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToModel.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToModel.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToModel.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToModel.howToUse.selectLanguage") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToModel.howToUse.convert") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToModel.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToModel.features.languages") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToModel.features.namespace") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToModel.features.options") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToModelHelp",
};
</script>
