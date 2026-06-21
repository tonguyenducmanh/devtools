<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiMocking.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiMocking.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiMocking.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.apiMocking.howToUse.createMock") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.apiMocking.howToUse.configure") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.apiMocking.howToUse.saveMock") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiMocking.collection.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.apiMocking.collection.description") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.apiMocking.requirement.title") }}
        </h3>
        <p class="section-note">
          {{ $t("i18nHelp.apiMocking.requirement.note") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDAPIMockingHelp",
};
</script>