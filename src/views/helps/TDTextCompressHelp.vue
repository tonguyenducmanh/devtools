<template>
  <div class="td-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textCompress.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textCompress.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textCompress.howToUse.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.textCompress.howToUse.compress") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.textCompress.howToUse.decompress") }}
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textCompress.algorithms.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">
            {{ $t("i18nHelp.textCompress.algorithms.gzip") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.textCompress.algorithms.deflate") }}
          </div>
          <div class="section-item">
            {{ $t("i18nHelp.textCompress.algorithms.deflateRaw") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextCompressHelp",
};
</script>

<style lang="scss">
@use "@/styles/help.scss";
</style>
