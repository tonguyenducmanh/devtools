<!-- component hiển thị static group view của các tính năng đã được phân nhóm từ trước thành nhiều tab -->
<template>
  <div class="td-static-tab-view">
    <!-- Tab bar -->
    <div class="td-tab-bar">
      <div
        v-for="child in groupChildren"
        :key="child.path"
        class="td-tab-item"
        :class="{ 'td-tab-active': activeToolPath === child.path }"
        @click="navigateTo(child)"
        v-tooltip="child.meta.helpKey ? $t(child.meta.helpKey) : undefined"
      >
        <span class="td-tab-label">{{ $t(child.meta.titleKey) }}</span>
        <span v-if="activeToolPath === child.path" class="td-tab-indicator" />
      </div>
    </div>

    <!-- Tool content: lazy load component theo route hiện tại -->
    <div class="td-tab-content">
      <component :is="activeComponent" v-if="activeComponent" />
    </div>
  </div>
</template>

<script>
import { shallowRef, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGroupConfig } from "@/router/router.js";

export default {
  name: "TDStaticTabView",

  setup() {
    const route = useRoute();
    const router = useRouter();

    const activeComponent = shallowRef(null);
    const groupChildren = shallowRef([]);

    const activeToolPath = computed(() => route.meta?.toolPath ?? null);

    function loadGroupConfig() {
      const groupKey = route.meta?.groupKey;
      const config = getGroupConfig(groupKey);
      groupChildren.value = config?.children ?? [];
    }

    async function syncFromRoute() {
      loadGroupConfig();

      const child = groupChildren.value.find(
        (c) => c.path === activeToolPath.value,
      );
      if (child) {
        const mod = await child.component();
        activeComponent.value = mod.default ?? mod;
      }
    }

    function navigateTo(child) {
      const fullPath = `/${route.meta.groupPath}/${child.path}`;
      if (route.path !== fullPath) {
        router.push(fullPath);
      }
    }

    watch(() => route.path, syncFromRoute, { immediate: true });

    return {
      activeComponent,
      groupChildren,
      activeToolPath,
      navigateTo,
    };
  },
};
</script>

<style lang="scss" scoped>
.td-static-tab-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ── Tab bar ── */
.td-tab-bar {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: var(--padding);
  border-bottom: 2px solid var(--bg-layer-color);
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--bg-layer-color);
    border-radius: 2px;
  }
}

.td-tab-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--padding);
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-secondary-color, #888);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  user-select: none;

  &:hover {
    background-color: var(--bg-layer-color);
    color: var(--text-color);
  }

  &.td-tab-active {
    color: var(--text-color);
    font-weight: 600;
    background-color: var(--bg-layer-color);
  }
}

.td-tab-label {
  font-size: var(--font-size-medium-rare);
}

/* Gạch chân active */
.td-tab-indicator {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--primary-color, #4f8ef7);
  border-radius: 2px 2px 0 0;
}

/* ── Tool content ── */
.td-tab-content {
  margin-top: var(--padding);
  width: 100%;
  height: 100%;
}
</style>
