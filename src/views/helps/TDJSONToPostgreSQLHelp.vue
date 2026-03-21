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
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.jsonToPostgreSQL.howToUse.input") }}</div>
          <div class="section-item">{{ $t("i18nHelp.jsonToPostgreSQL.howToUse.configure") }}</div>
          <div class="section-item">{{ $t("i18nHelp.jsonToPostgreSQL.howToUse.convert") }}</div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.jsonToPostgreSQL.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.jsonToPostgreSQL.features.createTable") }}</div>
          <div class="section-item">{{ $t("i18nHelp.jsonToPostgreSQL.features.deleteScript") }}</div>
          <div class="section-item">{{ $t("i18nHelp.jsonToPostgreSQL.features.fileUpload") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONToPostgreSQLHelp",
};
</script>

<style lang="scss">
@import "@/styles/help.scss";
</style>
