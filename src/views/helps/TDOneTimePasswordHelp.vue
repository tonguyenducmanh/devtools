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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.oneTimePassword.importData.scanQR") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.oneTimePassword.importData.pasteURL") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.oneTimePassword.importData.manual") }}
          </div>
        </div>
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
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.oneTimePassword.quickUse.copyOTP") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.oneTimePassword.quickUse.autoRefresh") }}
          </div>
        </div>
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

<style lang="scss">
@use "@/styles/help.scss";
</style>
