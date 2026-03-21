<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.colorPicker.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.colorPicker.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.colorPicker.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.colorPicker.howToUse.upload") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.colorPicker.howToUse.click") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.colorPicker.howToUse.copy") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.colorPicker.features.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.colorPicker.features.magnifier") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.colorPicker.features.palette") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDColorPickerHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
