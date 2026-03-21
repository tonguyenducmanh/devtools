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
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.welcome.quickStart.selectTool") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.quickStart.searchTool") }}</div>
        </div>
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
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.welcome.multiTab.duplicateTab") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.multiTab.closeTab") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.multiTab.closeAllTabs") }}</div>
        </div>
        <p class="section-text">
          {{ $t("i18nHelp.welcome.multiTab.dragReorder") }}
        </p>
      </div>

      <div class="help-section">
        <h3 class="section-subtitle">
          {{ $t("i18nHelp.welcome.agent.title") }}
        </h3>
        <div class="flex flex-col section-list">
          <div class="section-item">{{ $t("i18nHelp.welcome.agent.webOnly") }}</div>
          <div class="section-item">{{ $t("i18nHelp.welcome.agent.needAgent") }}</div>
        </div>
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
  font-size: var(--font-size-l-medium);
  font-weight: 600;
  margin-bottom: var(--padding);
  padding-bottom: var(--padding);
  border-bottom: 1px solid var(--border-color);
}

.help-section {
  margin-bottom: var(--padding-large);
}

.section-subtitle {
  font-size: var(--font-size-medium-rare);
  font-weight: 600;
  margin-bottom: var(--padding-medium);
  color: var(--text-color);
}

.section-text {
  font-size: var(--font-size-medium-rare);
  line-height: 1.6;
  color: var(--text-secondary-color);
  margin-bottom: var(--padding-medium);
}

.section-list {
  gap: var(--padding);
  margin-bottom: var(--padding-medium);
}

.section-item {
  font-size: var(--font-size-medium-rare);
  line-height: 1.6;
  color: var(--text-secondary-color);
  padding: var(--padding-medium) var(--padding-x-medium);
  border-left: 2px solid var(--border-color);
  margin-bottom: 2px;
  background: var(--bg-layer-color);
  border-radius: 0 var(--border-radius-component) var(--border-radius-component) 0;
}

.section-note {
  font-size: var(--font-size-small);
  color: var(--text-color-light);
  font-style: italic;
}
</style>
