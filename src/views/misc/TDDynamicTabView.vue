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
            <!-- Drag handle indicator -->
            <span class="td-drag-handle">
              <span></span><span></span><span></span>
            </span>

            <span class="td-tab-label">{{ $t(tab.titleKey) }}</span>

            <button
              class="td-tab-close"
              @click.stop="closeTab(tab.id)"
              v-tooltip="$t('i18nCommon.tabManager.closeTab')"
            >
              <span class="td-icon td-close-icon"> </span>
            </button>

            <!-- Drop indicator line -->
            <div
              v-if="dragOverIndex === index && draggingId !== tab.id"
              class="td-drop-indicator"
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
          <component :is="tab.resolvedComponent" v-if="tab.resolvedComponent" />
        </div>
      </template>

      <!-- Normal mode: router-view như cũ -->
      <RouterView v-else />
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue";
import { useTabManager } from "@/stores/TDTabManager.js";

export default {
  name: "TDDynamicTabView",

  setup() {
    const { state, activateTab, closeTab } = useTabManager();

    const tabs = computed(() => state.tabs);
    const activeTabId = computed(() => state.activeTabId);
    const isTabMode = computed(() => state.tabs.length > 0);

    // Drag state
    const draggingId = ref(null);
    const draggingIndex = ref(-1);
    const dragOverIndex = ref(-1);
    const tabBarRef = ref(null);

    function exitTabMode() {
      state.tabs.splice(0, state.tabs.length);
      state.activeTabId = null;
    }

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
      ghost.style.background = "var(--bg-layer-color, #2a2a3a)";
      ghost.style.borderRadius = "var(--border-radius, 6px)";
      ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      ghost.style.padding = "var(--padding, 8px) 12px";
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

      // Find which tab index the cursor is over
      const tabEls = [...bar.querySelectorAll(".td-tab-item")];
      let foundIndex = tabs.value.length; // default: end

      for (let i = 0; i < tabEls.length; i++) {
        const rect = tabEls[i].getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (event.clientX < midX) {
          foundIndex = i;
          break;
        }
      }

      dragOverIndex.value = foundIndex;
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

      // Adjust: when moving right, insertion index shifts by 1
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
      if (from < to) {
        // Moving right: items between from+1 and to-1 shift left
        return false;
      }
      // Moving left: items from to to from-1 shift right
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
      // Moving right: items from from+1 to to-1 shift left
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

  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--bg-layer-color);
    border-radius: 2px;
  }
}

/* ── Tab item ── */
.td-tab-item {
  position: relative;
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

  /* Hover while drag is over */
  &.td-tab-drag-over {
    /* handled by drop indicator */
  }
}

/* ── Drag handle (3 dots) ── */
.td-drag-handle {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  padding-right: 2px;
  cursor: grab;

  span {
    display: block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
}

.td-tab-item:hover .td-drag-handle span,
.td-tab-item.td-tab-active .td-drag-handle span {
  opacity: 0.4;
}

/* ── Drop indicator line ── */
.td-drop-indicator {
  position: absolute;
  left: -3px;
  top: 20%;
  height: 60%;
  width: 2px;
  border-radius: 2px;
  background: var(--primary-color, #00c9a7);
  box-shadow: 0 0 6px var(--primary-color, #00c9a7);
  animation: td-indicator-pulse 0.6s ease infinite alternate;
  pointer-events: none;
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
