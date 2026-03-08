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
        @contextmenu.prevent="openContextMenu($event, child)"
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

    <!-- Context menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="td-ctx-menu"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        @click.stop
      >
        <button class="td-ctx-item" @click="addToDynamicTab">
          {{ $t("i18nCommon.tabManager.openInDynamicTab") }}
        </button>
      </div>
      <!-- Overlay để đóng menu khi click ra ngoài -->
      <div
        v-if="contextMenu.visible"
        class="td-ctx-overlay"
        @click="closeContextMenu"
        @contextmenu.prevent="closeContextMenu"
      />
    </Teleport>
  </div>
</template>

<script>
import { shallowRef, watch, computed, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGroupConfig } from "@/router/router.js";
import { useTabManager } from "@/stores/TDTabManager.js";

export default {
  name: "TDStaticTabView",

  setup() {
    const route = useRoute();
    const router = useRouter();
    const { openTab } = useTabManager();

    const activeComponent = shallowRef(null);
    const groupChildren = shallowRef([]);

    const activeToolPath = computed(() => route.meta?.toolPath ?? null);

    // ── Context menu state ──
    const contextMenu = reactive({
      visible: false,
      x: 0,
      y: 0,
      child: null, // child config đang được right-click
    });

    function openContextMenu(event, child) {
      // Tính vị trí menu, tránh tràn màn hình
      const menuW = 220;
      const menuH = 48;
      const x = Math.min(event.clientX, window.innerWidth - menuW - 8);
      const y = Math.min(event.clientY, window.innerHeight - menuH - 8);

      contextMenu.visible = true;
      contextMenu.x = x;
      contextMenu.y = y;
      contextMenu.child = child;
    }

    function closeContextMenu() {
      contextMenu.visible = false;
      contextMenu.child = null;
    }

    async function addToDynamicTab() {
      const child = contextMenu.child;
      closeContextMenu();
      if (!child) return;

      await openTab({
        titleKey: child.meta.titleKey,
        helpKey: child.meta.helpKey ?? null,
        groupPath: route.meta.groupPath,
        path: child.path,
        component: child.component,
      });
    }

    // ── Existing logic ──
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
      contextMenu,
      openContextMenu,
      closeContextMenu,
      addToDynamicTab,
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

/* ── Context menu ── */
.td-ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
}

.td-ctx-menu {
  position: fixed;
  z-index: 11;
  min-width: 200px;
  background-color: var(--bg-main-color);
  border: 1px solid var(--bg-layer-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: calc(var(--padding) / 2);
  animation: td-ctx-pop 0.1s ease;
}

@keyframes td-ctx-pop {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.td-ctx-item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  width: 100%;
  padding: var(--padding);
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: var(--font-size-medium-rare);
  cursor: pointer;
  border-radius: var(--border-radius);
  text-align: left;
  transition: background-color 0.12s ease;

  &:hover {
    background-color: var(--bg-layer-color);
  }
}

.td-ctx-icon {
  font-size: 14px;
  line-height: 1;
  opacity: 0.75;
}
</style>
