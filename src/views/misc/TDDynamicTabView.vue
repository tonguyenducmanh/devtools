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
            @contextmenu.prevent="openContextMenu($event, tab)"
            @click.middle="closeTab(tab.id)"
            v-tooltip="getTabTitle(tab)"
          >
            <div class="td-tab-bg"></div>

            <div
              v-if="dragOverIndex === index && draggingId !== tab.id"
              class="td-drop-indicator td-drop-indicator-before"
            ></div>

            <span v-if="showTabNumber" class="td-tab-number">
              {{ index + 1 }}.
            </span>

            <span class="td-tab-label">
              {{ getTabLabel(tab) }}
            </span>

            <button class="flex td-tab-quick-btn">
              <span
                class="td-icon td-dupplicate-icon"
                v-tooltip="$t('i18nCommon.tabManager.duplicateTab')"
                @click.stop="duplicateTab(tab.id)"
              ></span>
              <span
                class="td-icon td-close-icon"
                v-tooltip="$t('i18nCommon.tabManager.closeTab')"
                @click.stop="closeTab(tab.id)"
              ></span>
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
        <Transition name="td-tab-switch" mode="out-in">
          <KeepAlive>
            <component
              v-if="activeTab"
              :ref="setTabRef"
              :is="activeTab.resolvedComponent"
              :key="activeTab.id"
              :tabId="activeTab.id"
              class="td-tab-pane"
              @updateTabTitle="(payload) => onTabTitleUpdate(payload)"
            />
          </KeepAlive>
        </Transition>
      </template>

      <!-- zero tabs mode: show Welcome -->
      <TDWelcome v-else />
    </div>
  </div>
</template>

<script>
import { computed, ref, inject, watch as vueWatch, nextTick } from "vue";
import TDWelcome from "@/views/misc/TDWelcome.vue";
import { useTabManager } from "@/stores/TDTabManager.js";
import i18nData from "@/i18n/i18nData.js";

export default {
  name: "TDDynamicTabView",
  components: { TDWelcome },
  created() {
    this.processWhenMouted();
  },
  data() {
    return {
      wrapTab: true,
      showTabNumber: false,
    };
  },
  methods: {
    async processWhenMouted() {
      let me = this;
      me.wrapTab = await me.$tdUtility.getUserSettings("wrapTab");
      me.showTabNumber = await me.$tdUtility.getUserSettings("showTabNumber");
    },
  },
  setup() {
    const {
      state,
      activateTab,
      closeTab,
      exitTabMode,
      setTabTitle,
      duplicateTab,
      resolveTabComponent,
    } = useTabManager();

    // Lấy context menu từ plugin toàn cục
    const tdContextMenu = inject("tdContextMenu");

    const tabs = computed(() => state.tabs);
    const activeTabId = computed(() => state.activeTabId);
    const activeTab = computed(() => {
      return tabs.value.find((t) => t.id === activeTabId.value);
    });
    const isTabMode = computed(() => {
      let isMultiTab = state.tabs.length > 0;
      return isMultiTab;
    });

    // quản lý danh sách các tab đang mở theo $refs để sau có thể handle 1 số event custom
    const tabRefs = {};
    const setTabRef = (el) => {
      if (el && el.$props && el.$props.tabId) {
        tabRefs[el.$props.tabId] = el;
      } else if (el && el.tabId) {
        tabRefs[el.tabId] = el;
      }
    };

    // Theo dõi tab đang active, nếu tab đó chưa được load component (resolveComponent === null)
    // thì gọi component() để lấy về module.
    vueWatch(
      activeTabId,
      async (newId, oldId) => {
        // nếu có tab cũ thì remove event của tab cũ đi
        if (oldId && tabRefs[oldId]) {
          if (typeof tabRefs[oldId].onTabLeave === "function") {
            try {
              tabRefs[oldId].onTabLeave();
            } catch (e) {
              console.error("Error calling onTabLeave", e);
            }
          }
        }

        if (!newId) return;
        await resolveTabComponent(newId);

        nextTick(() => {
          // nếu có tab mới thì add các event của tab mới
          if (tabRefs[newId]) {
            if (typeof tabRefs[newId].onTabEnter === "function") {
              try {
                tabRefs[newId].onTabEnter();
              } catch (e) {
                console.error("Error calling onTabEnter", e);
              }
            }
          }
        });
      },
      { immediate: true },
    );

    // ── Context menu ── dùng plugin thay vì tự quản lý state
    function openContextMenu(event, tab) {
      activateTab(tab.id); // highlight tab đang được right-click

      tdContextMenu.open(event, [
        {
          icon: "td-dupplicate-icon",
          key: "duplicate",
          label: i18nData.global.t("i18nCommon.tabManager.duplicateTab"),
          action: () => duplicateTab(tab.id),
        },
        {
          icon: "td-close-icon",
          key: "close",
          label: i18nData.global.t("i18nCommon.tabManager.closeTab"),
          action: () => closeTab(tab.id),
        },
      ]);
    }

    /**
     * Lắng nghe emit "update:tabTitle" từ component con.
     */
    function onTabTitleUpdate(payload) {
      // 1. Kiểm tra trường hợp null/undefined
      if (payload === null || payload === undefined) {
        return;
      }

      // 2. Hàm helper để cắt chuỗi nếu dài hơn 20 ký tự
      const formatTitle = (text) => {
        const str = text ?? "";
        return str.length > 20 ? str.substring(0, 20) + "..." : str;
      };

      // 3. Xử lý nếu payload là một object
      setTabTitle(payload.tabId, {
        title: formatTitle(payload.title),
        titleFull: payload.title,
        append: !!payload.append,
      });
    }

    function getTabLabel(tab) {
      if (!tab.customTitle || !tab.customTitle.title)
        return i18nData.global.t(tab.titleKey);
      const { title, append } = tab.customTitle;
      if (append) return `${i18nData.global.t(tab.titleKey)} (${title})`;
      return title;
    }

    function getTabTitle(tab) {
      return tab.customTitle?.titleFull;
    }

    // Drag state
    const draggingId = ref(null);
    const draggingIndex = ref(-1);
    const dragOverIndex = ref(-1);
    const tabBarRef = ref(null);

    function onDragStart(event, tabId, index) {
      draggingId.value = tabId;
      draggingIndex.value = index;

      const el = event.currentTarget;
      const ghost = el.cloneNode(true);
      ghost.style.position = "absolute";
      ghost.style.top = "-9999px";
      ghost.style.opacity = "0.85";
      ghost.style.transform = "rotate(2deg) scale(1.05)";
      ghost.style.pointerEvents = "none";
      ghost.style.background = "var(--bg-layer-color)";
      ghost.style.padding = "var(--padding)";
      ghost.style.minWidth = el.offsetWidth + "px";
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(
        ghost,
        el.offsetWidth / 2,
        el.offsetHeight / 2,
      );
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

      const rects = tabEls.map((el) => el.getBoundingClientRect());
      const rows = [];

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

      let bestRow = rows[0];
      let bestRowDist = Infinity;
      for (const row of rows) {
        let dy = 0;
        if (my < row.top) dy = row.top - my;
        else if (my > row.bottom) dy = my - row.bottom;
        if (dy < bestRowDist) {
          bestRowDist = dy;
          bestRow = row;
        }
      }

      const rowTabs = bestRow.tabs;
      let newIndex = rowTabs[rowTabs.length - 1].index + 1;

      for (let i = 0; i < rowTabs.length; i++) {
        const { rect, index } = rowTabs[i];
        const midX = rect.left + rect.width / 2;
        if (mx < midX) {
          newIndex = index;
          break;
        }
      }

      dragOverIndex.value = newIndex;
    }

    function onDragLeave(event) {
      const bar = tabBarRef.value;
      if (bar && !bar.contains(event.relatedTarget)) {
        dragOverIndex.value = -1;
      }
    }

    function onDrop() {
      const from = draggingIndex.value;
      const to = dragOverIndex.value;

      if (from === -1 || to === -1 || from === to || from + 1 === to) {
        onDragEnd();
        return;
      }

      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(from, 1);
      const insertAt = to > from ? to - 1 : to;
      newTabs.splice(insertAt, 0, moved);
      state.tabs = newTabs;
      onDragEnd();
    }

    function onDragEnd() {
      draggingId.value = null;
      draggingIndex.value = -1;
      dragOverIndex.value = -1;
    }

    function shouldShiftRight(index) {
      const from = draggingIndex.value;
      const to = dragOverIndex.value;
      if (from < to) return false;
      return (
        index < from &&
        index >= to &&
        draggingId.value !== tabs.value[index]?.id
      );
    }

    function shouldShiftLeft(index) {
      const from = draggingIndex.value;
      const to = dragOverIndex.value;
      if (from > to) return false;
      return (
        index > from && index < to && draggingId.value !== tabs.value[index]?.id
      );
    }

    return {
      tabs,
      activeTab,
      activeTabId,
      isTabMode,
      activateTab,
      closeTab,
      duplicateTab,
      exitTabMode,
      getTabLabel,
      getTabTitle,
      onTabTitleUpdate,
      openContextMenu,
      setTabRef,
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
  background-color: var(--bg-layer-color);
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
  gap: var(--padding);
  background-color: var(--bg-layer-color);
}

.td-tab-bar {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: var(--padding);
  margin-bottom: calc(var(--padding) / 2);
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
  padding: var(--padding);

  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  border-radius: var(--border-radius);

  color: var(--text-secondary-color);

  transition:
    width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    padding-right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    color 0.2s ease,
    transform 0.18s ease,
    opacity 0.15s ease;

  .td-tab-bg {
    position: absolute;
    inset: 0;

    background: var(--bg-main-color);

    border-radius: inherit;

    opacity: 0;
    transform: scale(0.92);

    transition:
      opacity 0.22s ease,
      transform 0.22s ease;

    z-index: 0;
  }

  > *:not(.td-tab-bg) {
    position: relative;
    z-index: 1;
  }

  &:hover {
    color: var(--text-color);
  }

  &.td-tab-active {
    color: var(--text-color);

    .td-tab-bg {
      opacity: 1;
      transform: scale(1);
    }
  }

  &.td-tab-dragging {
    opacity: 0.35;
    cursor: grabbing;
    transform: scale(0.97);
    background-color: var(--bg-layer-color);
  }

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
  background: var(--text-primary-color);
  box-shadow: 0 0 6px var(--text-primary-color);
  animation: td-indicator-pulse 0.6s ease infinite alternate;
  pointer-events: none;
}

.td-drop-indicator-before {
  left: -3px;
}

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

/* ── Sentinel ── */
.td-tab-drop-sentinel {
  position: relative;
  flex-shrink: 0;
  width: 1px;
  height: 100%;
  min-height: 28px;
  align-self: stretch;
}

/* ── Tab label ── */
.td-tab-number {
  color: var(--border-hard-color);
  font-size: var(--font-size-small);
}

.td-tab-label {
  font-size: var(--font-size-medium-rare);
  transition: transform 0.2s ease;
}
.td-tab-item:hover {
  background-color: var(--border-color);
}
.td-tab-item:hover .td-tab-label {
  transform: translateX(-2px);
}
/* ── Close button ── */
.td-tab-quick-btn {
  width: 0;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  height: 16px;

  border: none;
  background: transparent;

  cursor: pointer;

  opacity: 0;

  transform: translateX(8px) scale(0.8);

  transition:
    width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.18s ease,
    transform 0.18s ease,
    background-color 0.15s ease;
}
.td-tab-item:hover .td-tab-quick-btn {
  width: 40px;
  .td-icon {
    opacity: 0.5;
  }
  transform: translateX(0) scale(1);
}
.td-tab-quick-btn:hover {
  transform: scale(1.15);
  opacity: 1 !important;
}

.td-tab-quick-btn {
  opacity: 1 !important;

  .td-icon:hover {
    opacity: 1 !important;
  }
  transform: scale(1.15);
}
.td-tab-switch-enter-active,
.td-tab-switch-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.td-tab-switch-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.td-tab-switch-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.td-tab-switch-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.td-tab-switch-leave-to {
  opacity: 0;
  transform: translateY(6px);
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
  background-color: var(--bg-main-color);
  color: var(--text-secondary-color);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

/* ── Content ── */
.td-tab-content {
  box-sizing: border-box;
  flex: 1;
  padding: var(--padding);
  min-height: 0;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-main-color);
  border-radius: var(--border-radius);
}

.td-tab-pane {
  width: 100%;
  height: 100%;
}
</style>
