<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.oneTimePassword.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.oneTimePassword.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.oneTimePassword.importData.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.oneTimePassword.importData.scanQR") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.oneTimePassword.importData.pasteURL") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.oneTimePassword.importData.manual") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.oneTimePassword.security.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.oneTimePassword.security.description") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.oneTimePassword.quickUse.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.oneTimePassword.quickUse.copyOTP") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.oneTimePassword.quickUse.autoRefresh") }}
        </p>
        <p class="section-note">
          {{ $t("i18nHelp.oneTimePassword.quickUse.note") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDOneTimePasswordHelp",
  data() {
    return {};
  },
  created() {},
  methods: {},
  mounted() {},
};
</script>
