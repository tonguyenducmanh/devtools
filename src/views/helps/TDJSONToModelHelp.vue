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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.jsonToModel.howToUse.input") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToModel.howToUse.selectLanguage") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToModel.howToUse.convert") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToModel.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.jsonToModel.features.languages") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToModel.features.namespace") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.jsonToModel.features.options") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToModelHelp",
};
</script>
