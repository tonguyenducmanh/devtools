<!-- component hiển thị dynamic group view của các tính năng mà user chủ động chọn thành nhiều tab 
support cùng 1 tính năng được phép hiển thị thành nhiều lần
-->
<template>
  <div class="td-dynamic-tab-view">
    <!-- Tab bar: chỉ hiện khi có tab -->
    <Transition name="td-tabbar">
      <div v-if="isTabMode" class="flex td-tab-wrap">
        <div
          class="td-tab-bar"
          :class="{ 'td-tab-bar-wrap': wrapTab }"
          ref="tabBarRef"
          @dragover.prevent="onDragOver"
          @drop.prevent="onDrop"
          @dragleave="onDragLeave"
        >
          <div
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="td-tab-item"
            :class="{
              'td-tab-active': activeTabId === tab.id,
              'td-tab-dragging': draggingId === tab.id,
              'td-tab-drag-over':
                dragOverIndex === index && draggingId !== tab.id,
              'td-tab-shift-right': shouldShiftRight(index),
              'td-tab-shift-left': shouldShiftLeft(index),
            }"
            :draggable="true"
            @dragstart="onDragStart($event, tab.id, index)"
            @dragend="onDragEnd"
            @click="activateTab(tab.id)"
            v-tooltip="$t(tab.helpKey)"
          >
            <div
              v-if="dragOverIndex === index && draggingId !== tab.id"
              class="td-drop-indicator td-drop-indicator-before"
            ></div>

            <span class="td-tab-label">{{ getTabLabel(tab) }}</span>
            <button
              class="td-tab-close"
              @click.stop="closeTab(tab.id)"
              v-tooltip="$t('i18nCommon.tabManager.closeTab')"
            >
              <span class="td-icon td-close-icon"> </span>
            </button>
          </div>

          <div
            class="td-tab-drop-sentinel"
            :class="{
              'td-tab-drop-sentinel-active': dragOverIndex === tabs.length,
            }"
          >
            <div
              v-if="dragOverIndex === tabs.length && draggingId !== null"
              class="td-drop-indicator td-drop-indicator-end"
            ></div>
          </div>
        </div>

        <!-- Nút đóng tất cả -->
        <button
          class="td-tab-exit-btn"
          @click="exitTabMode"
          v-tooltip="$t('i18nCommon.tabManager.closeAllTabs')"
        >
          <span class="td-icon td-close-icon"> </span>
        </button>
      </div>
    </Transition>

    <!-- Content area -->
    <div class="td-tab-content">
      <!-- Tab mode: render sẵn tất cả bằng v-show -->
      <template v-if="isTabMode">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          v-show="activeTabId === tab.id"
          class="td-tab-pane"
        >
          <component
            :is="tab.resolvedComponent"
            v-if="tab.resolvedComponent"
            @updateTabTitle="(payload) => onTabTitleUpdate(tab.id, payload)"
          />
        </div>
      </template>

      <!-- Normal mode: router-view như cũ -->
      <RouterView v-else />
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue";
import tdUtility from "@/common/TDUtility.js";
import { useTabManager } from "@/stores/TDTabManager.js";
import i18nData from "@/i18n/i18nData.js";

export default {
  name: "TDDynamicTabView",
  created() {
    this.processWhenMouted();
  },
  data() {
    return {
      wrapTab: true,
    };
  },
  methods: {
    async processWhenMouted() {
      let me = this;
      me.wrapTab = await me.$tdUtility.getUserSettings("wrapTab");
    },
  },
  setup() {
    const { state, activateTab, closeTab, exitTabMode, setTabTitle } =
      useTabManager();

    const tabs = computed(() => state.tabs);
    const activeTabId = computed(() => state.activeTabId);
    const isTabMode = computed(() => {
      let isMultiTab = state.tabs.length > 0;
      let defaulAppName = tdUtility.defaultTitleApp();
      if (isMultiTab) {
        document.title = `${window.__env.author} | Multi tabs`;
      } else {
        document.title = defaulAppName;
      }
      return isMultiTab;
    });

    /**
     * Lắng nghe emit "update:tabTitle" từ component con.
     * Payload có thể là:
     *   - string              → thay thế hoàn toàn tên tab
     *   - { title, append }   → append=true: nối sau tên mặc định, append=false/undefined: thay thế
     *   - null / undefined    → reset về tên mặc định
     */
    function onTabTitleUpdate(tabId, payload) {
      if (payload === null || payload === undefined) {
        setTabTitle(tabId, null);
        return;
      }
      if (typeof payload === "string") {
        setTabTitle(tabId, { title: payload, append: false });
        return;
      }
      // payload là object { title, append }
      setTabTitle(tabId, {
        title: payload.title ?? "",
        append: !!payload.append,
      });
    }

    /**
     * Tính label hiển thị trên tab.
     * Nếu có customTitle:
     *   - append=true  → "<tên mặc định> – <customTitle>"
     *   - append=false → chỉ hiện customTitle
     * Nếu không có customTitle: dùng $t(titleKey)
     */
    function getTabLabel(tab) {
      if (!tab.customTitle) return i18nData.global.t(tab.titleKey);
      const { title, append } = tab.customTitle;
      if (append) return `${i18nData.global.t(tab.titleKey)} - ${title}`;
      return title;
    }

    // Drag state
    const draggingId = ref(null);
    const draggingIndex = ref(-1);
    const dragOverIndex = ref(-1);
    const tabBarRef = ref(null);

    // ── Drag & Drop ──────────────────────────────────────────────

    function onDragStart(event, tabId, index) {
      draggingId.value = tabId;
      draggingIndex.value = index;

      // Ghost image: clone the tab element, slightly transparent
      const el = event.currentTarget;
      const ghost = el.cloneNode(true);
      ghost.style.position = "absolute";
      ghost.style.top = "-9999px";
      ghost.style.opacity = "0.85";
      ghost.style.transform = "rotate(2deg) scale(1.05)";
      ghost.style.pointerEvents = "none";
      ghost.style.background = "var(--bg-layer-color)";
      ghost.style.borderRadius = "var(--border-radius)";
      ghost.style.padding = "var(--padding)";
      ghost.style.minWidth = el.offsetWidth + "px";
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(
        ghost,
        el.offsetWidth / 2,
        el.offsetHeight / 2,
      );

      // Clean up ghost after a tick
      setTimeout(() => document.body.removeChild(ghost), 0);

      event.dataTransfer.effectAllowed = "move";
    }

    function onDragOver(event) {
      event.dataTransfer.dropEffect = "move";

      const bar = tabBarRef.value;
      if (!bar) return;

      const tabEls = [...bar.querySelectorAll(".td-tab-item")];
      if (tabEls.length === 0) {
        dragOverIndex.value = 0;
        return;
      }

      const mx = event.clientX;
      const my = event.clientY;

      // Build row groups by clustering tabs that share the same vertical band.
      // A new row starts when the tab's vertical midpoint doesn't fall within
      // any existing row's [top, bottom] range.
      const rects = tabEls.map((el) => el.getBoundingClientRect());
      const rows = []; // [{ top, bottom, tabs: [{rect, index}] }]

      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        const midY = r.top + r.height / 2;
        let placed = false;
        for (const row of rows) {
          if (midY >= row.top && midY <= row.bottom) {
            row.tabs.push({ rect: r, index: i });
            placed = true;
            break;
          }
        }
        if (!placed) {
          rows.push({
            top: r.top,
            bottom: r.bottom,
            tabs: [{ rect: r, index: i }],
          });
        }
      }

      // Find which row the cursor is vertically closest to
      let bestRow = rows[0];
      let bestRowDist = Infinity;
      for (const row of rows) {
        let dy = 0;
        if (my < row.top) dy = row.top - my;
        else if (my > row.bottom) dy = my - row.bottom;
        // else cursor is inside the row → dy = 0
        if (dy < bestRowDist) {
          bestRowDist = dy;
          bestRow = row;
        }
      }

      // Within the best row, determine insert index by midpoint X.
      // Default to after the last tab in this row.
      const rowTabs = bestRow.tabs; // already in DOM order (left→right)
      let insertIndex = rowTabs[rowTabs.length - 1].index + 1;

      for (let i = 0; i < rowTabs.length; i++) {
        const midX = rowTabs[i].rect.left + rowTabs[i].rect.width / 2;
        if (mx < midX) {
          insertIndex = rowTabs[i].index;
          break;
        }
      }

      // Clamp to [0, tabs.length] so both ends are reachable
      dragOverIndex.value = Math.max(
        0,
        Math.min(insertIndex, tabs.value.length),
      );
    }

    function onDragLeave(event) {
      // Only clear if leaving the bar itself (not entering a child)
      if (!tabBarRef.value?.contains(event.relatedTarget)) {
        dragOverIndex.value = -1;
      }
    }

    function onDrop(event) {
      if (draggingIndex.value === -1 || dragOverIndex.value === -1) return;

      const from = draggingIndex.value;
      let to = dragOverIndex.value;

      // When moving right, the removal of the source shifts indices by 1
      if (to > from) to -= 1;

      if (from !== to) {
        const arr = state.tabs;
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
      }

      draggingId.value = null;
      draggingIndex.value = -1;
      dragOverIndex.value = -1;
    }

    function onDragEnd() {
      draggingId.value = null;
      draggingIndex.value = -1;
      dragOverIndex.value = -1;
    }

    // Shift animation helpers
    function shouldShiftRight(index) {
      if (draggingIndex.value === -1 || dragOverIndex.value === -1)
        return false;
      const from = draggingIndex.value;
      const to = dragOverIndex.value;
      if (from < to) return false;
      // Moving left: items from [to, from-1] shift right
      return (
        index >= to &&
        index < from &&
        draggingId.value !== tabs.value[index]?.id
      );
    }

    function shouldShiftLeft(index) {
      if (draggingIndex.value === -1 || dragOverIndex.value === -1)
        return false;
      const from = draggingIndex.value;
      const to = dragOverIndex.value;
      if (from > to) return false;
      // Moving right: items from [from+1, to-1] shift left
      return (
        index > from && index < to && draggingId.value !== tabs.value[index]?.id
      );
    }

    return {
      tabs,
      activeTabId,
      isTabMode,
      activateTab,
      closeTab,
      exitTabMode,
      getTabLabel,
      onTabTitleUpdate,
      // drag
      tabBarRef,
      draggingId,
      dragOverIndex,
      draggingIndex,
      onDragStart,
      onDragOver,
      onDragLeave,
      onDrop,
      onDragEnd,
      shouldShiftRight,
      shouldShiftLeft,
    };
  },
};
</script>

<style lang="scss" scoped>
.td-dynamic-tab-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ── Tabbar transition ── */
.td-tabbar-enter-active {
  transition:
    max-height 0.2s ease,
    opacity 0.2s ease;
}
.td-tabbar-leave-active {
  transition:
    max-height 0.15s ease,
    opacity 0.15s ease;
}
.td-tabbar-enter-from,
.td-tabbar-leave-to {
  max-height: 0;
  opacity: 0;
}
.td-tabbar-enter-to,
.td-tabbar-leave-from {
  max-height: 48px;
  opacity: 1;
}

/* ── Layout ── */
.td-tab-wrap {
  width: 100%;
  margin-bottom: var(--padding);
  gap: var(--padding);
}

.td-tab-bar {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: var(--padding);
  border-bottom: 2px solid var(--bg-layer-color);
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.td-tab-bar-wrap {
  flex-wrap: wrap;
  align-items: flex-start;
}

/* ── Tab item ── */
.td-tab-item {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: var(--padding);
  cursor: grab;
  white-space: nowrap;
  color: var(--text-secondary-color);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.15s ease,
    box-shadow 0.15s ease;
  user-select: none;

  .td-tab-close {
    opacity: 0.6;
  }

  &:hover {
    background-color: var(--bg-layer-color);
    color: var(--text-color);

    .td-drag-handle span {
      opacity: 0.5;
    }
  }

  &.td-tab-active {
    color: var(--text-color);
    font-weight: 600;
    background-color: var(--bg-layer-color);

    .td-tab-close {
      opacity: 0.5;
    }
  }

  /* Being dragged */
  &.td-tab-dragging {
    opacity: 0.35;
    cursor: grabbing;
    transform: scale(0.97);
    background-color: var(--bg-layer-color);
  }

  /* Shift animations for neighbours */
  &.td-tab-shift-right {
    transform: translateX(8px);
  }

  &.td-tab-shift-left {
    transform: translateX(-8px);
  }
}

/* ── Drop indicator line ── */
.td-drop-indicator {
  position: absolute;
  top: 20%;
  height: 60%;
  width: 2px;
  border-radius: 2px;
  background: var(--primary-color, #00c9a7);
  box-shadow: 0 0 6px var(--primary-color, #00c9a7);
  animation: td-indicator-pulse 0.6s ease infinite alternate;
  pointer-events: none;
}

/* Before-tab indicator: sits at left edge of the tab */
.td-drop-indicator-before {
  left: -3px;
}

/* End-of-list indicator: sits at left edge of the sentinel */
.td-drop-indicator-end {
  left: 0;
}

@keyframes td-indicator-pulse {
  from {
    opacity: 0.7;
    transform: scaleY(0.9);
  }
  to {
    opacity: 1;
    transform: scaleY(1.05);
  }
}

/* ── Sentinel (drop zone after last tab) ── */
.td-tab-drop-sentinel {
  position: relative;
  flex-shrink: 0;
  width: 12px; /* small but hittable */
  height: 100%;
  min-height: 28px;
  align-self: stretch;
}

/* ── Tab label ── */
.td-tab-label {
  font-size: var(--font-size-medium-rare);
}

/* ── Close button ── */
.td-tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    opacity: 1 !important;
  }
}

/* Show close button when tab hovered or active */
.td-tab-item:hover .td-tab-close,
.td-tab-item.td-tab-active .td-tab-close {
  opacity: 0.5;
}

/* ── Exit button ── */
.td-tab-exit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-left: auto;
  margin-right: 4px;
  align-self: center;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary-color);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

/* ── Content ── */
.td-tab-content {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.td-tab-pane {
  width: 100%;
  height: 100%;
}
</style>
