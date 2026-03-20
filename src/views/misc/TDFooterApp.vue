<template>
  <div class="td-footer-app">
    <div class="td-footer-actions">
      <span class="td-footer-title">{{ currentTitle }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDFooterApp",
  computed: {
    currentTitle() {
      const author = window.__env?.author || "";
      return `From ${author} with luv`;
    },
  },
};
</script>

<style lang="scss" scoped>
.td-footer-app {
  width: 100%;
  height: 32px;
  background-color: var(--bg-main-color);
  border-top: 1px solid var(--bg-layer-color);
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  flex-shrink: 0;
}

.td-footer-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.td-footer-title {
  font-size: var(--font-size-medium-rare);
  color: var(--text-secondary-color);
}
</style>