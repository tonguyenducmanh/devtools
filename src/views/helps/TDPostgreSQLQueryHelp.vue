<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.postgreSQLQuery.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.postgreSQLQuery.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.howToUse.step1") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.howToUse.step2") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.howToUse.step3") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.howToUse.step4") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.howToUse.step5") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.postgreSQLQuery.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.features.intellisense") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.features.savedScripts") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.features.formatCode") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.features.multipleConnections") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.features.objectInspect") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.postgreSQLQuery.features.listDatabases") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDPostgreSQLQueryHelp",
};
</script>
