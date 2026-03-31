<template>
  <div class="flex flex-col help-container">
    <div class="help-title">{{ $t("i18nCommon.JSONSortByKey.helpTitle") }}</div>
    <div class="help-section">
      <div class="help-section-title">{{ $t("i18nCommon.JSONSortByKey.helpHowToUse") }}</div>
      <div class="help-content">
        {{ $t("i18nCommon.JSONSortByKey.helpHowToUseContent") }}
      </div>
    </div>
    <div class="help-section">
      <div class="help-section-title">{{ $t("i18nCommon.JSONSortByKey.helpExample") }}</div>
      <div class="help-content">
        <div class="help-code-block">
          <pre>{{ $t("i18nCommon.JSONSortByKey.helpExampleInput") }}</pre>
        </div>
        <div class="help-arrow">↓</div>
        <div class="help-code-block">
          <pre>{{ $t("i18nCommon.JSONSortByKey.helpExampleOutput") }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDJSONSortByKeyHelp",
};
</script>

<style scoped>
.help-container {
  padding: var(--padding);
  gap: var(--padding);
}
.help-title {
  font-size: 18px;
  font-weight: 600;
}
.help-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.help-section-title {
  font-weight: 500;
  color: var(--text-secondary);
}
.help-content {
  font-size: 14px;
  line-height: 1.5;
}
.help-code-block {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--padding);
  overflow-x: auto;
}
.help-code-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.help-arrow {
  text-align: center;
  color: var(--text-secondary);
}
</style>
