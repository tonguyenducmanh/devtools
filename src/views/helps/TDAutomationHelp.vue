<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.automation.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.automation.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.automation.howToUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.automation.howToUse.writeScript") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.automation.howToUse.runScript") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.automation.howToUse.returnValue") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.automation.howToUse.apiDocs") }}
        </p>
        <p class="section-note">
          {{ $t("i18nHelp.automation.howToUse.intelliSenseNote") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.automation.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.automation.features.collection") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.automation.features.history") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.automation.features.import") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.automation.requirement.title") }}
        </h3>
        <p class="section-note">
          {{ $t("i18nHelp.automation.requirement.note") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDAutomationHelp",
};
</script>
