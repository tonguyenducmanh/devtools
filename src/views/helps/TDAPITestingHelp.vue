<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.modes.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.apiTesting.modes.normal") }}</div>
          <div class="section-item">{{ $t("i18nHelp.apiTesting.modes.curl") }}</div>
          <div class="section-item">{{ $t("i18nHelp.apiTesting.modes.proMode") }}</div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.features.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.apiTesting.features.collection") }}</div>
          <div class="section-item">{{ $t("i18nHelp.apiTesting.features.history") }}</div>
          <div class="section-item">{{ $t("i18nHelp.apiTesting.features.import") }}</div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.requirement.title") }}
        </h3>
        <p class="section-note">
          {{ $t("i18nHelp.apiTesting.requirement.note") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDAPITestingHelp",
};
</script>

<style lang="scss">
@import "@/styles/help.scss";
</style>
