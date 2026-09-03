<!-- component hiển thị dynamic group view của các tính năng mà user chủ động chọn thành nhiều tab 
support cùng 1 tính năng được phép hiển thị thành nhiều lần
-->
<template>
  <div class="td-dynamic-tab-view">
    <!-- Tab bar: chỉ hiện khi có tab và không ở zen mode -->
    <Transition name="td-tabbar">
      <div v-if="isTabMode && !zenMode" class="flex td-tab-wrap">
        <div class="td-tab-bar" :class="{ 'td-tab-bar-wrap': wrapTab }" ref="tabBarRef" @dragover.prevent="onDragOver"
          @drop.prevent="onDrop" @dragleave="onDragLeave">
          <div v-for="(tab, index) in tabs" :key="tab.id" class="td-tab-item" :class="{
            'td-tab-active': activeTabId === tab.id,
            'td-tab-dragging': draggingId === tab.id,
            'td-tab-drag-over':
              dragOverIndex === index && draggingId !== tab.id,
            'td-tab-shift-right': shouldShiftRight(index),
            'td-tab-shift-left': shouldShiftLeft(index),
          }" :draggable="true" @dragstart="onDragStart($event, tab.id, index)" @dragend="onDragEnd"
            @click="activateTab(tab.id)" @contextmenu.prevent="openContextMenu($event, tab)"
            @click.middle="closeTab(tab.id)" v-tooltip="getTabTitle(tab)">
            <div class="td-tab-bg"></div>

            <div v-if="dragOverIndex === index && draggingId !== tab.id"
              class="td-drop-indicator td-drop-indicator-before"></div>

            <span class="td-tab-label">
              {{ getTabLabel(tab) }}
            </span>

            <button class="flex td-tab-quick-btn">
              <span class="td-icon td-dupplicate-icon" v-tooltip="$t('i18nCommon.tabManager.duplicateTab')"
                @click.stop="duplicateTab(tab.id)"></span>
              <span class="td-icon td-close-icon" v-tooltip="$t('i18nCommon.tabManager.closeTab')"
                @click.stop="closeTab(tab.id)"></span>
            </button>
          </div>

          <div class="td-tab-drop-sentinel" :class="{
            'td-tab-drop-sentinel-active': dragOverIndex === tabs.length,
          }">
            <div v-if="dragOverIndex === tabs.length && draggingId !== null"
              class="td-drop-indicator td-drop-indicator-end"></div>
          </div>
        </div>

        <!-- Nút đóng tất cả -->
        <button class="td-tab-exit-btn" @click="exitTabMode" v-tooltip="$t('i18nCommon.tabManager.closeAllTabs')">
          <span class="td-icon td-close-icon"> </span>
        </button>
      </div>
    </Transition>

    <!-- Content area -->
    <div class="td-tab-content" :class="{ 'td-zen-active': zenMode }">
      <!-- Zen mode toolbar -->
      <div v-if="zenMode" class="td-zen-toolbar" :class="{ 'td-zen-toolbar-pinned': zenToolbarPinned }">
        <div v-if="!zenToolbarPinned" class="flex toolbar-btn" @click="pinZenToolbar"
          v-tooltip="$t('i18nCommon.remoteDesktop.pin')">
          <span class="td-icon td-pin-icon"></span>
        </div>
        <div v-else class="flex toolbar-btn" @click="unpinZenToolbar" v-tooltip="$t('i18nCommon.remoteDesktop.unpin')">
          <span class="td-icon td-unpin-icon"></span>
        </div>
        <div class="flex toolbar-btn" @click="zenPrevTab" v-tooltip="$t('i18nCommon.tabManager.tabPrevious')">
          <TDArrow :arrowDirection="tdEnum.Direction.left" />
        </div>
        <div class="flex toolbar-btn" @click="zenNextTab" v-tooltip="$t('i18nCommon.tabManager.tabNext')">
          <TDArrow :arrowDirection="tdEnum.Direction.right" />
        </div>
        <span class="td-zen-toolbar-separator"></span>
        <div class="flex toolbar-btn" @click="exitZenMode" v-tooltip="$t('i18nCommon.tdheader.exitZenMode')">
          <span class="td-icon td-center-icon"></span>
        </div>
      </div>

      <!-- Tab mode: render sẵn tất cả bằng v-show -->
      <template v-if="isTabMode">
        <KeepAlive>
          <component v-if="activeTab" :ref="setTabRef" :is="activeTab.resolvedComponent" :key="activeTab.id"
            :tabId="activeTab.id" class="td-tab-pane" @updateTabTitle="(payload) => onTabTitleUpdate(payload)" />
        </KeepAlive>
      </template>

      <!-- zero tabs mode: show Welcome -->
      <TDWelcome v-else />
    </div>

    <!-- Tab preview overlay (Alt+A / Alt+D) -->
    <Teleport to="body">
      <div v-if="showTabPreview && isTabMode" class="td-tab-preview-overlay">
        <div class="td-tab-preview-container">
          <div class="td-tab-preview-grid">
            <div v-for="(tab, index) in tabs" :key="tab.id" class="text-nowrap td-tab-preview-item"
              :class="{ 'td-tab-preview-item--active': previewIndex === index }" @click="selectTabFromPreview(tab.id)"
              @mouseenter="previewIndex = index">
              {{ getTabLabel(tab) }}
            </div>
          </div>
          <div class="td-tab-preview-footer">
            <div class="td-tab-preview-footer__grid">
              <div v-for="item in tabShortcuts" :key="item.key" class="td-tab-preview-footer__item">
                <span class="td-tab-preview-footer__keys">
                  <kbd v-for="part in item.presentKey" :key="part">{{
                    part
                    }}</kbd>
                </span>
                <span class="td-tab-preview-footer__label">{{
                  $t(item.labelKey)
                  }}</span>
              </div>
            </div>
            <!-- /__grid -->
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import {
  computed,
  ref,
  inject,
  watch as vueWatch,
  nextTick,
  defineAsyncComponent,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useTabManager } from "@/stores/TDTabManager.js";
import i18nData from "@/i18n/i18nData.js";
import tdUtility from "@/common/TDUtility.js";
import TDShortcutAction, {
  TDShortcutActionEnum,
} from "@/common/TDShortcutAction.js";
import eventBus from "@/common/event/TDEventBus.js";
import { TDEnumEventBus } from "@/common/event/TDEnumEventBus.js";
import TDArrow from "@/components/TDArrow.vue";
import tdEnum from "@/common/TDEnum.js";
import { appState } from "@/stores/TDAppState.js";
const isMacOS = tdUtility.isMacOS();
// 2. Thay bằng defineAsyncComponent để import động:
const TDWelcome = defineAsyncComponent(
  () => import("@/views/misc/TDWelcome.vue"),
);
export default {
  name: "TDDynamicTabView",
  components: { TDWelcome, TDArrow },
  created() {
    this.processWhenMouted();
  },
  mounted() {
    this.registerTabShortcuts();
    this.zenModeUnsubscribe = eventBus.on(
      TDEnumEventBus.zenModeToggle,
      this.toggleZenMode,
    );
  },
  beforeUnmount() {
    TDShortcutAction.unregister(TDShortcutActionEnum.TabPrevious);
    TDShortcutAction.unregister(TDShortcutActionEnum.TabNext);
    TDShortcutAction.unregister(TDShortcutActionEnum.TabClose);
    TDShortcutAction.unregister(TDShortcutActionEnum.TabZenMode);
    if (this.zenModeUnsubscribe) {
      this.zenModeUnsubscribe();
    }
  },
  data() {
    return {
      wrapTab: true,
      zenToolbarPinned: false,
    };
  },
  computed: {
    zenMode: {
      get() {
        return appState.zenMode;
      },
      set(val) {
        appState.zenMode = val;
      },
    },
  },
  methods: {
    async processWhenMouted() {
      let me = this;
      me.wrapTab = await me.$tdUtility.getUserSettings("wrapTab");
      appState.zenMode =
        (await me.$tdUtility.getUserSettings("zenMode")) || false;
    },
    toggleZenMode() {
      appState.zenMode = !appState.zenMode;
      if (!appState.zenMode) {
        this.zenToolbarPinned = false;
      }
      this.$tdUtility.saveUserSettings("zenMode", appState.zenMode);
    },
    exitZenMode() {
      appState.zenMode = false;
      this.zenToolbarPinned = false;
      this.$tdUtility.saveUserSettings("zenMode", false);
    },
    pinZenToolbar() {
      this.zenToolbarPinned = true;
    },
    unpinZenToolbar() {
      this.zenToolbarPinned = false;
    },
    zenPrevTab() {
      const tabList = this.tabs;
      if (!tabList.length) return;
      const cur = tabList.findIndex((t) => t.id === this.activeTabId);
      const idx = cur > 0 ? cur - 1 : tabList.length - 1;
      this.activateTab(tabList[idx].id);
    },
    zenNextTab() {
      const tabList = this.tabs;
      if (!tabList.length) return;
      const cur = tabList.findIndex((t) => t.id === this.activeTabId);
      const idx = cur < tabList.length - 1 ? cur + 1 : 0;
      this.activateTab(tabList[idx].id);
    },
    registerTabShortcuts() {
      const altKey = isMacOS ? "Option" : "Alt";
      const guid = () => this.$tdUtility.newGuid();

      TDShortcutAction.register(TDShortcutActionEnum.TabPrevious, {
        sortOrder: 10,
        presentKey: [altKey, "A"],
        labelKey: "i18nCommon.tabManager.tabPrevious",
      });

      TDShortcutAction.register(TDShortcutActionEnum.TabNext, {
        sortOrder: 11,
        presentKey: [altKey, "D"],
        labelKey: "i18nCommon.tabManager.tabNext",
      });

      TDShortcutAction.register(TDShortcutActionEnum.TabClose, {
        sortOrder: 12,
        presentKey: [altKey, "Q"],
        labelKey: "i18nCommon.tabManager.tabClose",
      });

      TDShortcutAction.register(TDShortcutActionEnum.TabZenMode, {
        sortOrder: 13,
        presentKey: [altKey, "F"],
        labelKey: "i18nCommon.tdheader.zenMode",
      });
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
        // Update document title
        if (newId) {
          const tab = tabs.value.find((t) => t.id === newId);
          if (tab) {
            document.title = getTabLabel(tab);
          }
        } else {
          document.title = `${tdUtility.defaultTitleApp()} - ${tdUtility.getAuthorApp()}`;
        }

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

      // Cập nhật document.title nếu đây là tab đang active
      if (activeTabId.value === payload.tabId) {
        const tab = tabs.value.find((t) => t.id === payload.tabId);
        if (tab) document.title = getTabLabel(tab);
      }
    }

    function getTabLabel(tab) {
      if (!tab.customTitle || !tab.customTitle.title)
        return i18nData.global.t(tab.titleKey);
      const { title, append } = tab.customTitle;
      if (append) return `${i18nData.global.t(tab.titleKey)} (${title})`;
      return title;
    }

    function getTabTitle(tab) {
      return {
        text: tab.customTitle?.titleFull,
        maxWidth: "600px",
      };
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

    // ── Tab preview (Alt+A / Alt+D / Alt+Q) ──────────────────────────────
    const altKeyName = isMacOS ? "Option" : "Alt";
    const tabShortcuts = ref(TDShortcutAction.getActiveShortcuts());
    const showTabPreview = ref(false);
    const previewIndex = ref(0);

    function selectTabFromPreview(tabId) {
      activateTab(tabId);
      showTabPreview.value = false;
    }

    function handleTabPreviewKeydown(event) {
      if (!event.altKey) return;

      if (event.code === "KeyF") {
        event.preventDefault();
        eventBus.emit(TDEnumEventBus.zenModeToggle);
        return;
      }

      const tabList = tabs.value;
      if (!tabList.length) return;

      if (event.code === "KeyA") {
        event.preventDefault();
        showTabPreview.value = true;
        const cur = tabList.findIndex((t) => t.id === activeTabId.value);
        const idx = cur > 0 ? cur - 1 : tabList.length - 1;
        previewIndex.value = idx;
        activateTab(tabList[idx].id);
      } else if (event.code === "KeyD") {
        event.preventDefault();
        showTabPreview.value = true;
        const cur = tabList.findIndex((t) => t.id === activeTabId.value);
        const idx = cur < tabList.length - 1 ? cur + 1 : 0;
        previewIndex.value = idx;
        activateTab(tabList[idx].id);
      } else if (event.code === "KeyQ") {
        event.preventDefault();
        showTabPreview.value = false;
        if (activeTabId.value) {
          closeTab(activeTabId.value);
        }
      }
    }

    function handleTabPreviewKeyup(event) {
      if (
        event.code === "AltLeft" ||
        event.code === "AltRight" ||
        event.key === "Alt"
      ) {
        showTabPreview.value = false;
      } else if (event.code === "Escape") {
        showTabPreview.value = false;
      }
    }

    onMounted(() => {
      window.addEventListener("keydown", handleTabPreviewKeydown);
      window.addEventListener("keyup", handleTabPreviewKeyup);

      tabShortcuts.value = TDShortcutAction.getActiveShortcuts();
      TDShortcutAction.onChange(() => {
        tabShortcuts.value = TDShortcutAction.getActiveShortcuts();
      });
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleTabPreviewKeydown);
      window.removeEventListener("keyup", handleTabPreviewKeyup);
    });

    return {
      tabs,
      activeTab,
      activeTabId,
      isTabMode,
      tdEnum,
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
      // tab preview
      showTabPreview,
      previewIndex,
      selectTabFromPreview,
      tabShortcuts,
      altKeyName,
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
    background: var(--focus-color);
    border-radius: inherit;
    opacity: 0;
    transform: scale(0.92);
    transition:
      opacity 0.22s ease,
      transform 0.22s ease;
    z-index: 0;
  }

  >*:not(.td-tab-bg) {
    position: relative;
    z-index: 1;
  }

  &:hover {
    color: var(--text-color);
    border-color: var(--focus-color);
  }

  &.td-tab-active {
    color: var(--selected-item-text-color);
    border: var(--border-component-style);

    .td-tab-bg {
      opacity: 1;
      transform: scale(1);
    }

    .td-icon {
      background-color: var(--selected-item-text-color);
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
.td-tab-label {
  font-size: var(--font-size-medium-rare);
  transition: transform 0.2s ease;
}

.td-tab-item:hover {
  background-color: var(--border-color);
  border: 1px solid var(--focus-color);
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
  color: var(--text-color);
  cursor: pointer;
  opacity: 0;
  transform: translateX(8px) scale(0.8);
  transition:
    width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.18s ease,
    transform 0.18s ease,
    background-color 0.15s ease;

  .td-icon {
    background-color: var(--text-color);
  }
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
  color: var(--text-color);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  .td-icon {
    background-color: var(--text-color);
  }

  &:hover {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);

    .td-icon {
      background-color: var(--selected-item-text-color);
    }
  }
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
  border: var(--border-component-style);
}

.td-tab-pane {
  width: 100%;
  height: 100%;
}

/* ── Zen mode ── */
.td-zen-active {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 5 !important;
  border-radius: 0 !important;
  padding: var(--padding) !important;
}

.td-zen-toolbar {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  gap: 4px;
  background-color: var(--bg-layer-color);
  border-radius: var(--border-radius);
  padding: 4px;
  z-index: 6;
  transition: all 0.3s ease-in-out;
  transform: translateX(calc(-100% + 8px));
  opacity: 0.6;

  &:hover {
    opacity: 1;
    transform: translateX(0);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }

  &.td-zen-toolbar-pinned {
    opacity: 1;
    transform: translateX(0);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -50px;
    right: -20px;
    bottom: -20px;
    z-index: -1;
  }

  .td-zen-toolbar-separator {
    width: 1px;
    height: 20px;
    background-color: var(--border-color);
    align-self: center;
  }

  .toolbar-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;

    &:hover {
      background-color: var(--focus-color);
      color: var(--selected-item-text-color);
      border: 1px solid var(--border-color);
    }
  }
}
</style>

<style>
/* Tab preview — unscoped because Teleport to body */
.td-tab-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.td-tab-preview-container {
  background: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--padding);
  box-shadow: var(--box-shadow);
  pointer-events: auto;
  /* tự giãn theo content, giới hạn tối đa 90vw */
  width: max-content;
  max-width: 90vw;
}

.td-tab-preview-grid {
  display: grid;
  /*
    minmax(0, 1fr): 2 cột đều nhau, mỗi cột tự giãn theo item dài nhất trong grid.
    Container max-content sẽ tính chiều rộng dựa theo grid → tự fit.
  */
  grid-template-columns: repeat(2, minmax(max-content, 1fr));
  gap: var(--padding);
}

.td-tab-preview-item {
  padding: var(--padding);
  border-radius: var(--border-radius-component);
  cursor: pointer;
  color: var(--text-color);
  font-size: var(--font-size-medium-rare);
  text-align: left;
  white-space: nowrap;
  border: 1px solid var(--border-color);
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

.td-tab-preview-item:hover {
  background: var(--border-color);
  border-color: var(--text-secondary-color);
}

.td-tab-preview-item--active {
  background: var(--focus-color) !important;
  color: var(--selected-item-text-color);
  font-weight: 600;
  border-color: var(--focus-color) !important;
}

.td-tab-preview-footer {
  margin-top: var(--padding);
  padding-top: var(--padding);
  border-top: 1px solid var(--border-color);
  /* wrapper để center inline-grid bên trong */
  display: flex;
  justify-content: center;
}

.td-tab-preview-footer__grid {
  /* inline-grid: tự co width vừa đủ nội dung, không ép full width */
  display: inline-grid;
  grid-template-columns: repeat(3, max-content);
  gap: 4px 16px;
  align-items: center;
}

.td-tab-preview-footer__item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  white-space: nowrap;
}

.td-tab-preview-footer__keys {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.td-tab-preview-footer__label {
  font-size: 11px;
  color: var(--text-secondary-color);
  white-space: nowrap;
}

.td-tab-preview-footer kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 11px;
  font-family: inherit;
  background: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
