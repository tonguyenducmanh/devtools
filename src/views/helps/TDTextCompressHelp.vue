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
        <p class="section-text">
          {{ $t("i18nHelp.textCompress.howToUse.compress") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textCompress.howToUse.decompress") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.textCompress.algorithms.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.textCompress.algorithms.gzip") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textCompress.algorithms.deflate") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.textCompress.algorithms.deflateRaw") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTextCompressHelp",
};
</script>
