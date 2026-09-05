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
        <p class="section-text">
          {{ $t("i18nHelp.jsonToOneLineString.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToOneLineString.howToUse.selectLanguage") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToOneLineString.howToUse.convert") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToOneLineString.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToOneLineString.features.languages") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToOneLineString.features.escapeUnicode") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToOneLineStringHelp",
};
</script>
