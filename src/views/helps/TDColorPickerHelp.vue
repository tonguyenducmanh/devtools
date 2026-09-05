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
        <p class="section-text">
          {{ $t("i18nHelp.colorPicker.howToUse.upload") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.colorPicker.howToUse.click") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.colorPicker.howToUse.copy") }}
        </p>
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
