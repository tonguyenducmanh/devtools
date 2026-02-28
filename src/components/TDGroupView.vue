<template>
  <div class="td-group-view">
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
import { getGroupConfig } from "@/router/router.js";

export default {
  name: "TDGroupView",

  data() {
    return {
      groupChildren: [],
      activeComponent: null,
    };
  },

  computed: {
    activeToolPath() {
      return this.$route.meta?.toolPath ?? null;
    },
    groupKey() {
      return this.$route.meta?.groupKey ?? null;
    },
  },

  watch: {
    // Khi user chuyển tab (route thay đổi trong cùng 1 group)
    "$route.path": {
      immediate: true,
      handler() {
        this.syncFromRoute();
      },
    },
  },

  created() {
    this.loadGroupConfig();
  },

  methods: {
    loadGroupConfig() {
      const config = getGroupConfig(this.groupKey);
      if (config) {
        this.groupChildren = config.children;
      }
    },

    async syncFromRoute() {
      // Nếu group thay đổi (hiếm, nhưng phòng trường hợp) thì reload config
      if (
        this.groupChildren.length === 0 ||
        this.groupKey !== this._lastGroupKey
      ) {
        this._lastGroupKey = this.groupKey;
        this.loadGroupConfig();
      }

      // Load đúng component của toolPath hiện tại
      const child = this.groupChildren.find(
        (c) => c.path === this.activeToolPath,
      );
      if (child) {
        const mod = await child.component();
        this.activeComponent = mod.default ?? mod;
      }
    },

    navigateTo(child) {
      const fullPath = `/${this.$route.meta.groupPath}/${child.path}`;
      if (this.$route.path !== fullPath) {
        this.$router.push(fullPath);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-group-view {
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
  gap: 2px;
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
  font-size: var(--font-size-medium);
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
