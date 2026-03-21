<template>
  <div class="td-welcome-help">
    <div class="help-content">
      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.purpose.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.purpose.content") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.quickStart.title") }}
        </h3>
        <ul class="section-list">
          <li>{{ $t("i18nHelp.welcome.quickStart.selectTool") }}</li>
          <li>{{ $t("i18nHelp.welcome.quickStart.searchTool") }}</li>
        </ul>
        <p class="section-note">{{ $t("i18nHelp.welcome.quickStart.note") }}</p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.multiTab.title") }}
        </h3>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.multiTab.description") }}
        </p>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.multiTab.rightClick") }}
        </p>
        <ul class="section-list">
          <li>{{ $t("i18nHelp.welcome.multiTab.duplicateTab") }}</li>
          <li>{{ $t("i18nHelp.welcome.multiTab.closeTab") }}</li>
          <li>{{ $t("i18nHelp.welcome.multiTab.closeAllTabs") }}</li>
        </ul>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.multiTab.dragReorder") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.agent.title") }}
        </h3>
        <ul class="section-list">
          <li>{{ $t("i18nHelp.welcome.agent.webOnly") }}</li>
          <li>{{ $t("i18nHelp.welcome.agent.needAgent") }}</li>
        </ul>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.agent.downloadAgent") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDWelcomeHelp",
  data() {
    return {};
  },
  created() {},
  methods: {},
  mounted() {},
};
</script>

<style lang="scss" scoped>
.td-welcome-help {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.help-content {
  padding: var(--padding);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--padding);
  padding-bottom: var(--padding);
  border-bottom: 1px solid var(--border-color);
}

.help-section {
  margin-bottom: calc(var(--padding) * 1.5);
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: calc(var(--padding) * 0.75);
  color: var(--text-color);
}

.section-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary-color);
  margin-bottom: calc(var(--padding) * 0.5);
}

.section-list {
  list-style: disc;
  padding-left: calc(var(--padding) * 1.5);
  margin-bottom: calc(var(--padding) * 0.5);

  li {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary-color);
    margin-bottom: calc(var(--padding) * 0.25);
  }
}

.section-note {
  font-size: 12px;
  color: var(--text-color-light);
  font-style: italic;
}
</style>
