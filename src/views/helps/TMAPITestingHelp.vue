<template>
  <div class="tm-help">
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
          {{ $t("i18nHelp.apiTesting.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.howToUse.createRequest") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.howToUse.importCURL") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.howToUse.sendRequest") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.howToUse.copyCURL") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.howToUse.copyMockData") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiTesting.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.features.collection") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.features.history") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.apiTesting.features.import") }}
        </p>
        <p class="section-note">
          {{ $t("i18nHelp.apiTesting.features.automationNote") }}
        </p>
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
  name: "TMAPITestingHelp",
};
</script>
