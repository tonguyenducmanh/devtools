<!-- component hiển thị dynamic group view của các tính năng mà user chủ động chọn thành nhiều tab 
support cùng 1 tính năng được phép hiển thị thành nhiều lần
-->
<template>
  <div class="tm-dynamic-tab-view">
    <!-- Tab bar: chỉ hiện khi có tab và không ở zen mode -->
    <Transition name="tm-tabbar">
      <div v-if="isTabMode && !zenMode" class="flex tm-tab-wrap">
        <div
          class="tm-tab-bar"
          :class="{ 'tm-tab-bar-wrap': wrapTab }"
          ref="tabBarRef"
          @dragover.prevent="onDragOver"
          @drop.prevent="onDrop"
          @dragleave="onDragLeave"
        >
          <div
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="tm-tab-item"
            :class="{
              'tm-tab-active': activeTabId === tab.id,
              'tm-tab-dragging': draggingId === tab.id,
              'tm-tab-drag-over':
                dragOverIndex === index && draggingId !== tab.id,
              'tm-tab-shift-right': shouldShiftRight(index),
              'tm-tab-shift-left': shouldShiftLeft(index),
            }"
            :draggable="true"
            @dragstart="onDragStart($event, tab.id, index)"
            @dragend="onDragEnd"
            @click="activateTab(tab.id)"
            @contextmenu.prevent="openContextMenu($event, tab)"
            @click.middle="onCloseTab(tab.id)"
            v-tooltip="getTabTitle(tab)"
          >
            <div class="tm-tab-bg"></div>

            <div
              v-if="dragOverIndex === index && draggingId !== tab.id"
              class="tm-drop-indicator tm-drop-indicator-before"
            ></div>

            <span class="tm-tab-label">
              {{ getTabLabel(tab) }}
            </span>

            <button class="flex tm-tab-quick-btn">
              <span
                class="tm-icon tm-dupplicate-icon"
                v-tooltip="$t('i18nCommon.tabManager.duplicateTab')"
                @click.stop="duplicateTab(tab.id)"
              ></span>
              <span
                class="tm-icon tm-close-icon"
                v-tooltip="$t('i18nCommon.tabManager.closeTab')"
                @click.stop="onCloseTab(tab.id)"
              ></span>
            </button>
          </div>

          <div
            class="tm-tab-drop-sentinel"
            :class="{
              'tm-tab-drop-sentinel-active': dragOverIndex === tabs.length,
            }"
          >
            <div
              v-if="dragOverIndex === tabs.length && draggingId !== null"
              class="tm-drop-indicator tm-drop-indicator-end"
            ></div>
          </div>
        </div>

        <!-- Nút đóng tất cả -->
        <button
          class="tm-tab-exit-btn"
          @click="onExitTabMode"
          v-tooltip="$t('i18nCommon.tabManager.closeAllTabs')"
        >
          <span class="tm-icon tm-close-icon"> </span>
        </button>
      </div>
    </Transition>

    <!-- Content area -->
    <div
      class="tm-tab-content"
      :class="{
        'tm-zen-active': zenMode,
        'tm-tab-content-flush': isContentFlush,
      }"
    >
      <!-- Zen mode toolbar -->
      <div
        v-if="zenMode"
        class="tm-zen-toolbar"
        :class="{ 'tm-zen-toolbar-pinned': zenToolbarPinned }"
      >
        <div
          v-if="!zenToolbarPinned"
          class="flex toolbar-btn"
          @click="pinZenToolbar"
          v-tooltip="$t('i18nCommon.remoteDesktop.pin')"
        >
          <span class="tm-icon tm-pin-icon"></span>
        </div>
        <div
          v-else
          class="flex toolbar-btn"
          @click="unpinZenToolbar"
          v-tooltip="$t('i18nCommon.remoteDesktop.unpin')"
        >
          <span class="tm-icon tm-unpin-icon"></span>
        </div>
        <div
          class="flex toolbar-btn"
          @click="zenPrevTab"
          v-tooltip="$t('i18nCommon.tabManager.tabPrevious')"
        >
          <TMArrow :arrowDirection="tmEnum.Direction.left" />
        </div>
        <div
          class="flex toolbar-btn"
          @click="zenNextTab"
          v-tooltip="$t('i18nCommon.tabManager.tabNext')"
        >
          <TMArrow :arrowDirection="tmEnum.Direction.right" />
        </div>
        <span class="tm-zen-toolbar-separator"></span>
        <div
          class="flex toolbar-btn"
          @click="exitZenMode"
          v-tooltip="$t('i18nCommon.tmheader.exitZenMode')"
        >
          <span class="tm-icon tm-center-icon"></span>
        </div>
      </div>

      <!-- Tab mode: render sẵn tất cả bằng v-show -->
      <template v-if="isTabMode">
        <KeepAlive>
          <component
            v-if="activeTab"
            :ref="setTabRef"
            :is="activeTab.resolvedComponent"
            :key="activeTab.id"
            :tabId="activeTab.id"
            class="tm-tab-pane"
            @updateTabTitle="(payload) => onTabTitleUpdate(payload)"
          />
        </KeepAlive>
      </template>

      <!-- zero tabs mode: show Welcome -->
      <TMWelcome v-else />
    </div>

    <!-- Tab preview overlay (Alt+A / Alt+D / Alt+Q) -->
    <Teleport to="body">
      <div v-if="showTabPreview && isTabMode" class="tm-tab-preview-overlay">
        <div class="tm-tab-preview-container">
          <div class="tm-tab-preview-grid">
            <div
              v-for="(tab, index) in tabs"
              :key="tab.id"
              class="text-nowrap tm-tab-preview-item"
              :class="{ 'tm-tab-preview-item--active': previewIndex === index }"
              @click="selectTabFromPreview(tab.id)"
              @mouseenter="previewIndex = index"
            >
              {{ getTabLabel(tab) }}
            </div>
          </div>
          <div class="tm-tab-preview-footer">
            <div class="tm-tab-preview-footer__grid">
              <div
                v-for="item in tabShortcuts"
                :key="item.key"
                class="tm-tab-preview-footer__item"
              >
                <span class="tm-tab-preview-footer__keys">
                  <kbd v-for="part in item.presentKey" :key="part">{{
                    part
                  }}</kbd>
                </span>
                <span class="tm-tab-preview-footer__label">{{
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
  getCurrentInstance,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useTabManager } from "@/stores/TMTabManager.js";
import i18nData from "@/i18n/i18nData.js";
import tmUtility from "@/common/TMUtility.js";
import TMDialogUtil from "@/common/TMDialogUtil.js";
import TMShortcutAction, {
  TMShortcutActionEnum,
} from "@/common/TMShortcutAction.js";
import eventBus from "@/common/event/TMEventBus.js";
import { TMEnumEventBus } from "@/common/event/TMEnumEventBus.js";
import TMArrow from "@/components/TMArrow.vue";
import tmEnum from "@/common/TMEnum.js";
import { appState } from "@/stores/TMAppState.js";
const isMacOS = tmUtility.isMacOS();
// 2. Thay bằng defineAsyncComponent để import động:
const TMWelcome = defineAsyncComponent(
  () => import("@/views/misc/TMWelcome.vue"),
);
export default {
  name: "TMDynamicTabView",
  components: { TMWelcome, TMArrow },
  created() {
    this.processWhenMouted();
  },
  mounted() {
    this.registerTabShortcuts();
    this.zenModeUnsubscribe = eventBus.on(
      TMEnumEventBus.zenModeToggle,
      this.toggleZenMode,
    );
  },
  beforeUnmount() {
    TMShortcutAction.unregister(TMShortcutActionEnum.TabPrevious);
    TMShortcutAction.unregister(TMShortcutActionEnum.TabNext);
    TMShortcutAction.unregister(TMShortcutActionEnum.TabClose);
    TMShortcutAction.unregister(TMShortcutActionEnum.TabZenMode);
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
      me.wrapTab = await me.$tmUtility.getUserSettings("wrapTab");
      appState.zenMode =
        (await me.$tmUtility.getUserSettings("zenMode")) || false;
    },
    toggleZenMode() {
      appState.zenMode = !appState.zenMode;
      if (!appState.zenMode) {
        this.zenToolbarPinned = false;
      }
      this.$tmUtility.saveUserSettings("zenMode", appState.zenMode);
    },
    exitZenMode() {
      appState.zenMode = false;
      this.zenToolbarPinned = false;
      this.$tmUtility.saveUserSettings("zenMode", false);
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

      TMShortcutAction.register(TMShortcutActionEnum.TabPrevious, {
        sortOrder: 10,
        presentKey: [altKey, "A"],
        labelKey: "i18nCommon.tabManager.tabPrevious",
      });

      TMShortcutAction.register(TMShortcutActionEnum.TabNext, {
        sortOrder: 11,
        presentKey: [altKey, "D"],
        labelKey: "i18nCommon.tabManager.tabNext",
      });

      TMShortcutAction.register(TMShortcutActionEnum.TabClose, {
        sortOrder: 12,
        presentKey: [altKey, "Q"],
        labelKey: "i18nCommon.tabManager.tabClose",
      });

      // Alt+F11 (Option+F11 trên macOS) thay cho Alt+F:
      // - Alt+F trùng phím với Shift+Alt+F (format code của monaco) vì handler
      //   cũ chỉ kiểm tra altKey + KeyF nên không chặn Shift → bấm format SQL là
      //   zen mode bật/tắt luôn.
      // - Không dùng F11 trần vì browser đã chiếm F11 để fullscreen.
      TMShortcutAction.register(TMShortcutActionEnum.TabZenMode, {
        sortOrder: 13,
        presentKey: [altKey, "F11"],
        labelKey: "i18nCommon.tmheader.zenMode",
      });
    },
  },
  setup() {
    const {
      state,
      activateTab,
      closeTab,
      closeTabs,
      exitTabMode,
      setTabTitle,
      duplicateTab,
      resolveTabComponent,
    } = useTabManager();

    // Lấy context menu từ plugin toàn cục
    const tmContextMenu = inject("tmContextMenu");

    // Dùng cho TMDialogUtil.confirm (kế thừa appContext để popup có $t, v-tooltip…)
    const ownerForm = getCurrentInstance()?.proxy ?? null;

    const tabs = computed(() => state.tabs);
    const activeTabId = computed(() => state.activeTabId);
    const activeTab = computed(() => {
      return tabs.value.find((t) => t.id === activeTabId.value);
    });
    const isTabMode = computed(() => {
      let isMultiTab = state.tabs.length > 0;
      return isMultiTab;
    });
    // Tool tự khai báo contentFlush (vd: app vẽ canvas) → vùng nội dung không padding
    const isContentFlush = computed(() => !!activeTab.value?.contentFlush);

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
          document.title = `${tmUtility.defaultTitleApp()} - ${tmUtility.getAuthorApp()}`;
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

    // ── Đóng tab có hỏi xác nhận ────────────────────────────────────────────
    // Tool có dữ liệu tạm chưa lưu khai báo confirmOnClose trong TMToolConfigs
    // → đóng bằng nút X, chuột giữa, context menu, Alt+Q hay đóng tất cả đều
    // phải hỏi lại user trước.
    function getTabsNeedConfirm(ids) {
      const idSet = new Set(ids);
      return tabs.value.filter((t) => idSet.has(t.id) && t.confirmOnClose);
    }

    async function confirmCloseTabs(ids) {
      const listNeedConfirm = getTabsNeedConfirm(ids);
      if (!listNeedConfirm.length) return true;

      const tabLabel = (key) =>
        i18nData.global.t(`i18nCommon.tabManager.${key}`);

      return await TMDialogUtil.confirm({
        ownerForm,
        title: tabLabel("confirmCloseTabTitle"),
        message: tabLabel("confirmCloseTabMessage"),
        confirmLabel: tabLabel("confirmCloseYes"),
        cancelLabel: tabLabel("confirmCloseNo"),
      });
    }

    /** Đóng 1 tab, hỏi xác nhận nếu tool có dữ liệu chưa lưu */
    async function onCloseTab(id) {
      if (await confirmCloseTabs([id])) {
        closeTab(id);
      }
    }

    /** Đóng nhiều tab, chỉ hỏi 1 lần nếu trong đó có tool cần xác nhận */
    async function onCloseTabs(ids) {
      if (await confirmCloseTabs(ids)) {
        closeTabs(ids);
      }
    }

    /** Đóng toàn bộ tab (nút thoát tab mode) */
    async function onExitTabMode() {
      if (await confirmCloseTabs(tabs.value.map((t) => t.id))) {
        exitTabMode();
      }
    }

    // ── Context menu ── dùng plugin thay vì tự quản lý state
    function openContextMenu(event, tab) {
      const tabList = tabs.value;
      const index = tabList.findIndex((t) => t.id === tab.id);
      if (index === -1) return;

      activateTab(tab.id); // highlight tab đang được right-click

      // các tab bên trái / bên phải / tất cả tab còn lại so với tab vừa click
      const leftIds = tabList.slice(0, index).map((t) => t.id);
      const rightIds = tabList.slice(index + 1).map((t) => t.id);
      const otherIds = tabList.filter((t) => t.id !== tab.id).map((t) => t.id);

      const tabLabel = (key) =>
        i18nData.global.t(`i18nCommon.tabManager.${key}`);

      // chỉ hiện item khi thực sự có tab tương ứng, tránh hiện item bấm vào không làm gì
      const bulkItems = [
        {
          ids: otherIds,
          item: {
            key: "closeOthers",
            label: tabLabel("closeOtherTabs"),
            action: () => onCloseTabs(otherIds),
          },
        },
        {
          ids: rightIds,
          item: {
            key: "closeRight",
            label: tabLabel("closeTabsToRight"),
            action: () => onCloseTabs(rightIds),
          },
        },
        {
          ids: leftIds,
          item: {
            key: "closeLeft",
            label: tabLabel("closeTabsToLeft"),
            action: () => onCloseTabs(leftIds),
          },
        },
      ]
        .filter((group) => group.ids.length > 0)
        .map((group) => group.item);

      tmContextMenu.open(event, [
        {
          key: "duplicate",
          label: tabLabel("duplicateTab"),
          action: () => duplicateTab(tab.id),
        },
        {
          key: "close",
          label: tabLabel("closeTab"),
          action: () => onCloseTab(tab.id),
        },
        ...bulkItems,
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

      const tabEls = [...bar.querySelectorAll(".tm-tab-item")];
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

    // ── Zen mode + tab preview (Alt+F11 / Alt+A / Alt+D / Alt+Q) ─────────────
    const altKeyName = isMacOS ? "Option" : "Alt";
    const tabShortcuts = ref(TMShortcutAction.getActiveShortcuts());
    const showTabPreview = ref(false);
    const previewIndex = ref(0);

    function selectTabFromPreview(tabId) {
      activateTab(tabId);
      showTabPreview.value = false;
    }

    /**
     * Chỉ nhận shortcut khi bấm ĐÚNG bộ modifier đã khai báo (Alt mà không kèm
     * Shift/Ctrl/Cmd). Bắt buộc vì Shift+Alt+F là keybinding format document mặc
     * định của monaco (editor.action.formatDocument) — nếu không chặn Shift thì
     * bấm format code SQL sẽ bị bật/tắt zen mode theo.
     */
    function isExactAltCombo(event) {
      return (
        event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey
      );
    }

    function handleTabPreviewKeydown(event) {
      if (!isExactAltCombo(event)) return;

      // Alt+F11: bật/tắt zen mode. Bỏ qua event repeat để giữ phím không làm
      // zen mode nhấp nháy (và không spam ghi setting mỗi lần auto-repeat).
      if (event.code === "F11") {
        if (event.repeat) return;
        event.preventDefault();
        eventBus.emit(TMEnumEventBus.zenModeToggle);
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
          onCloseTab(activeTabId.value);
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

      tabShortcuts.value = TMShortcutAction.getActiveShortcuts();
      TMShortcutAction.onChange(() => {
        tabShortcuts.value = TMShortcutAction.getActiveShortcuts();
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
      tmEnum,
      activateTab,
      onCloseTab,
      onCloseTabs,
      onExitTabMode,
      duplicateTab,
      isContentFlush,
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
.tm-dynamic-tab-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-layer-color);
}

/* ── Tabbar transition ── */
.tm-tabbar-enter-active {
  transition:
    max-height 0.2s ease,
    opacity 0.2s ease;
}

.tm-tabbar-leave-active {
  transition:
    max-height 0.15s ease,
    opacity 0.15s ease;
}

.tm-tabbar-enter-from,
.tm-tabbar-leave-to {
  max-height: 0;
  opacity: 0;
}

.tm-tabbar-enter-to,
.tm-tabbar-leave-from {
  max-height: 48px;
  opacity: 1;
}

/* ── Layout ── */
.tm-tab-wrap {
  width: 100%;
  gap: var(--padding);
  background-color: var(--bg-layer-color);
}

.tm-tab-bar {
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

.tm-tab-bar-wrap {
  flex-wrap: wrap;
  align-items: flex-start;
}

/* ── Tab item ── */
.tm-tab-item {
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

  .tm-tab-bg {
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

  > *:not(.tm-tab-bg) {
    position: relative;
    z-index: 1;
  }

  &:hover {
    color: var(--text-color);
    border-color: var(--focus-color);
  }

  &.tm-tab-active {
    color: var(--selected-item-text-color);
    border-color: unset !important;
    border: 1px solid var(--focus-color);
    .tm-tab-bg {
      opacity: 1;
      transform: scale(1);
    }

    .tm-icon {
      background-color: var(--selected-item-text-color);
    }
  }

  &.tm-tab-dragging {
    opacity: 0.35;
    cursor: grabbing;
    transform: scale(0.97);
    background-color: var(--bg-layer-color);
  }

  &.tm-tab-shift-right {
    transform: translateX(8px);
  }

  &.tm-tab-shift-left {
    transform: translateX(-8px);
  }
}

/* ── Drop indicator line ── */
.tm-drop-indicator {
  position: absolute;
  top: 20%;
  height: 60%;
  width: 2px;
  border-radius: 2px;
  background: var(--text-primary-color);
  box-shadow: 0 0 6px var(--text-primary-color);
  animation: tm-indicator-pulse 0.6s ease infinite alternate;
  pointer-events: none;
}

.tm-drop-indicator-before {
  left: -3px;
}

.tm-drop-indicator-end {
  left: 0;
}

@keyframes tm-indicator-pulse {
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
.tm-tab-drop-sentinel {
  position: relative;
  flex-shrink: 0;
  width: 1px;
  height: 100%;
  min-height: 28px;
  align-self: stretch;
}

/* ── Tab label ── */
.tm-tab-label {
  font-size: var(--font-size-medium-rare);
  transition: transform 0.2s ease;
}

.tm-tab-item:hover {
  background-color: var(--border-color);
  border: 1px solid var(--focus-color);
}

.tm-tab-item:hover .tm-tab-label {
  transform: translateX(-2px);
}

/* ── Close button ── */
.tm-tab-quick-btn {
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

  .tm-icon {
    background-color: var(--text-color);
  }
}

.tm-tab-item:hover .tm-tab-quick-btn {
  width: 40px;

  .tm-icon {
    opacity: 0.5;
  }

  transform: translateX(0) scale(1);
}

.tm-tab-quick-btn:hover {
  transform: scale(1.15);
  opacity: 1 !important;
}

.tm-tab-quick-btn {
  opacity: 1 !important;

  .tm-icon:hover {
    opacity: 1 !important;
  }

  transform: scale(1.15);
}

/* ── Exit button ── */
.tm-tab-exit-btn {
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

  .tm-icon {
    background-color: var(--text-color);
  }

  &:hover {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);

    .tm-icon {
      background-color: var(--selected-item-text-color);
    }
  }
}

/* ── Content ── */
.tm-tab-content {
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

/* Tool tự khai báo contentFlush (vd: app vẽ canvas) → không padding,
   để tool chiếm hết vùng nội dung */
.tm-tab-content-flush {
  padding: 0;
}

.tm-tab-pane {
  width: 100%;
  height: 100%;
}

/* ── Zen mode ── */
.tm-zen-active {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 5 !important;
  border-radius: 0 !important;
  padding: var(--padding) !important;
}

/* Zen mode vẫn giữ nguyên quy tắc contentFlush của tool */
.tm-tab-content-flush.tm-zen-active {
  padding: 0 !important;
}

.tm-zen-toolbar {
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

  &.tm-zen-toolbar-pinned {
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

  .tm-zen-toolbar-separator {
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
.tm-tab-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.tm-tab-preview-container {
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

.tm-tab-preview-grid {
  display: grid;
  /*
    minmax(0, 1fr): 2 cột đều nhau, mỗi cột tự giãn theo item dài nhất trong grid.
    Container max-content sẽ tính chiều rộng dựa theo grid → tự fit.
  */
  grid-template-columns: repeat(2, minmax(max-content, 1fr));
  gap: var(--padding);
}

.tm-tab-preview-item {
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

.tm-tab-preview-item:hover {
  background: var(--border-color);
  border-color: var(--text-secondary-color);
}

.tm-tab-preview-item--active {
  background: var(--focus-color) !important;
  color: var(--selected-item-text-color);
  font-weight: 600;
  border-color: var(--focus-color) !important;
}

.tm-tab-preview-footer {
  margin-top: var(--padding);
  padding-top: var(--padding);
  border-top: 1px solid var(--border-color);
  /* wrapper để center inline-grid bên trong */
  display: flex;
  justify-content: center;
}

.tm-tab-preview-footer__grid {
  /* inline-grid: tự co width vừa đủ nội dung, không ép full width */
  display: inline-grid;
  grid-template-columns: repeat(3, max-content);
  gap: 4px 16px;
  align-items: center;
}

.tm-tab-preview-footer__item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  white-space: nowrap;
}

.tm-tab-preview-footer__keys {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.tm-tab-preview-footer__label {
  font-size: 11px;
  color: var(--text-secondary-color);
  white-space: nowrap;
}

.tm-tab-preview-footer kbd {
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
