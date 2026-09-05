<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToPostgreSQL.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToPostgreSQL.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToPostgreSQL.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToPostgreSQL.howToUse.input") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToPostgreSQL.howToUse.configure") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToPostgreSQL.howToUse.convert") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToPostgreSQL.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToPostgreSQL.features.createTable") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToPostgreSQL.features.deleteScript") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.jsonToPostgreSQL.features.fileUpload") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToPostgreSQLHelp",
};
</script>
