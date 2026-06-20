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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.howToUse.step1") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.howToUse.step2") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.howToUse.step3") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.howToUse.step4") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.howToUse.step5") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.postgreSQLQuery.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.features.intellisense") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.features.savedScripts") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.features.formatCode") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.postgreSQLQuery.features.multipleConnections") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDPostgreSQLQueryHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
.section-code {
  display: block;
  padding: var(--padding);
  background-color: var(--bg-thirt-color);
  border-radius: var(--border-radius);
  font-family: monospace;
  font-size: var(--font-size-small);
  margin-bottom: var(--padding);
  color: var(--primary-color);
  word-break: break-all;
}
</style>
