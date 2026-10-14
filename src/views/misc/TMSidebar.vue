<template>
  <!-- Trigger vô hình ở mép trái, fixed riêng không bị ảnh hưởng bởi transform -->
  <div v-if="zenMode" class="tm-sidebar-zen-trigger" :class="zenTriggerClass"
    @mouseenter="onZenMouseEnter" @mouseleave="onZenMouseLeave"></div>
  <div class="tm-sidebar-container" :class="containerClass" v-click-outside="closeFlyout">
    <div v-if="showSideBar || zenMode" class="tm-sidebar" :class="sidebarClass"
      @mouseenter="onZenMouseEnter" @mouseleave="onZenMouseLeave">
      <div class="tm-tool-group">
        <template v-for="(item, index) in sidebarItems" :key="index">
          <!-- Group item: hover → flyout -->
          <div v-if="item.type === 'group'" class="tm-sidebar-item" :class="{
            'tm-sidebar-item--active': activeKeyFlyOut === item.groupKey,
          }" @mouseenter="openFlyout(item.groupKey, $event)" @mouseleave="scheduleCloseFlyout()">
            <div class="flex no-select tm-item-content" @click="onOpenGroup(item)">
              <span>{{ $t(item.groupTitleKey) }}</span>
            </div>
          </div>

          <!-- Standalone route item: link + nút pin -->
          <div v-else class="tm-sidebar-item tm-sidebar-item--route">
            <div class="no-select tm-item-content flex" @click="onOpenRouteTab(item.route)">
              <span>{{ $t(item.route.meta.titleKey) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <TMToggleArea v-if="!zenMode" :collapsed="!showSideBar" :edge="toggleEdge" :align="toggleAlign"
      v-tooltip="showSideBar
        ? $t('i18nCommon.sidebar.hide')
        : $t('i18nCommon.sidebar.show')
      " @toggle="toggleSidebar" />

    <!-- Flyout: mở theo hướng còn chỗ (mặc định sang phải, tự lật nếu sát mép) -->
    <TMFlyoutPanel :show="!!activeKeyFlyOut" :anchorElFlyout="anchorElFlyout" :placement="flyoutPlacement"
      panelClass="tm-sidebar-group-flyout" @mouseenter="cancelCloseFlyOut" @mouseleave="scheduleCloseFlyout()">
      <div v-for="row in sidebarFlyoutRows" :key="row.child.meta.titleKey" class="no-select tm-sidebar-flyout-row">
        <div class="tm-sidebar-flyout-item" @click="onOpenGroupChildTab(row.item, row.child)">
          {{ $t(row.child.meta.titleKey) }}
        </div>
      </div>
    </TMFlyoutPanel>
  </div>
</template>

<script>
import { getSidebarItems } from "@/stores/TMToolConfigs.js";
import TMToggleArea from "@/components/TMToggleArea.vue";
import TMFlyoutPanel from "@/components/TMFlyoutPanel.vue";
import { useTabManager } from "@/stores/TMTabManager.js";
import { useFlyout } from "@/common/plugin/TMUseFlyout.js";
import _ from "@/common/TMCommonFunction.js";
import { appState } from "@/stores/TMAppState.js";

export default {
  name: "TMSidebar",
  components: { TMToggleArea, TMFlyoutPanel },

  setup() {
    const { openTab } = useTabManager();
    const {
      activeKeyFlyOut,
      anchorElFlyout,
      openFlyout,
      scheduleCloseFlyout,
      cancelCloseFlyOut,
      closeFlyout,
    } = useFlyout();
    return {
      openTab,
      activeKeyFlyOut,
      anchorElFlyout,
      openFlyout,
      scheduleCloseFlyout,
      cancelCloseFlyOut,
      closeFlyout,
    };
  },

  data() {
    return {
      sidebarItems: getSidebarItems(),
      showSideBar: true,
      zenHover: false,
      zenHideTimer: null,
    };
  },

  computed: {
    zenMode() {
      return appState.zenMode;
    },
    position() {
      return appState.sideBarMenuPosition;
    },
    isRight() {
      return this.position === this.$tmEnum.sideBarMenuPosition.Right;
    },
    containerClass() {
      return {
        "tm-sidebar-container-collapsed": !this.showSideBar,
        "tm-sidebar-container--right": this.isRight,
      };
    },
    /** Nút thu gọn luôn nằm ở mép trong của cột (trái với cột dọc) */
    toggleEdge() {
      return this.isRight ? "right" : "left";
    },
    /**
     * Cột bên phải đặt nút thu gọn ở đầu cột (start) cho khỏi nằm giữa
     * đè lên vùng nội dung; cột bên trái giữ căn giữa như cũ.
     */
    toggleAlign() {
      return this.isRight ? "start" : "center";
    },
    /** Menu con mở sang trái khi cột ở bên phải, sang phải khi ở bên trái */
    flyoutPlacement() {
      return this.isRight ? "left" : "right";
    },
    /**
     * Class của khung sidebar. Các modifier `--zen-*` định vị theo
     * position:fixed và dịch khung ra ngoài màn hình, nên CHỈ bật khi thật
     * sự vào zen mode — bật vô điều kiện sẽ đẩy sidebar tràn màn hình.
     */
    sidebarClass() {
      return {
        "tm-sidebar--zen": this.zenMode,
        "tm-sidebar--zen-hover": this.zenMode && this.zenHover,
        "tm-sidebar--zen-right": this.zenMode && this.isRight,
      };
    },
    /** Vùng rê chuột mở sidebar trong zen mode, theo đúng mép đang đặt */
    zenTriggerClass() {
      return {
        "tm-sidebar-zen-trigger--right": this.isRight,
      };
    },
    activeItem() {
      return (
        this.sidebarItems.find(
          (item) => item.groupKey === this.activeKeyFlyOut,
        ) ?? null
      );
    },
    // Chụp item tại thời điểm render. Nếu dùng activeItem trực tiếp trong
    // handler click, click-outside có thể đóng flyout trước khi handler chạy
    // làm activeItem thành null và gây lỗi.
    sidebarFlyoutRows() {
      const item = this.activeItem;
      return (item?.children ?? []).map((child) => ({ item, child }));
    },
  },

  created() {
    this.processWhenCreated();
  },

  beforeUnmount() {
    clearTimeout(this.zenHideTimer);
  },

  methods: {
    async processWhenCreated() {
      let me = this;
      me.showSideBar = await me.$tmUtility.getUserSettings("showSideBar");
    },

    async toggleSidebar() {
      let me = this;
      me.showSideBar = !me.showSideBar;
      await me.$tmUtility.saveUserSettings("showSideBar", me.showSideBar);
    },

    onZenMouseEnter() {
      clearTimeout(this.zenHideTimer);
      this.zenHover = true;
    },
    onZenMouseLeave() {
      clearTimeout(this.zenHideTimer);
      this.zenHideTimer = setTimeout(() => {
        this.zenHover = false;
      }, 400);
    },

    // Mở tất từ group
    onOpenGroup: _.debounce(async function (groupItem) {
      if (!groupItem.children || groupItem.children.length === 0) return;
      // chỉ mở tab đầu tiên
      const child = groupItem.children[0];
      await this.openTab({
        titleKey: child.meta.titleKey,
        helpKey: child.meta?.helpKey,
        groupKey: groupItem.groupKey,
        toolKey: child.name,
        component: child.component,
      });
    }, 300),

    // Mở tab từ group flyout item
    onOpenGroupChildTab: _.debounce(function (groupItem, child) {
      this.openTab({
        titleKey: child.meta.titleKey,
        helpKey: child.meta?.helpKey,
        groupKey: groupItem.groupKey,
        toolKey: child.name,
        component: child.component,
      });
      this.closeFlyout();
    }, 300),

    // Mở tab từ standalone route item
    onOpenRouteTab: _.debounce(function (route) {
      this.openTab({
        titleKey: route.meta.titleKey,
        helpKey: route.meta?.helpKey,
        groupKey: "",
        toolKey: route.name,
        // Standalone route dùng component trực tiếp từ route config
        component: route.component,
      });
    }, 300),
  },
};
</script>

<style lang="scss" scoped>
.tm-sidebar-container {
  position: relative;
  height: 100%;
  margin-right: var(--padding);
}

.tm-sidebar-container-collapsed {
  margin-right: unset;
}

// Cột dọc bên phải: đảo khoảng cách so với cột bên trái
.tm-sidebar-container--right {
  margin-right: unset;
  margin-left: var(--padding);

  &.tm-sidebar-container-collapsed {
    margin-left: unset;
  }

  // Nút thu gọn phải nằm ở mép TRONG của cột (bên trái, quay về phía vùng
  // nội dung). TMToggleArea với edge="right" lại đặt nút ở mép phải của
  // element cha, tức là lọt ra ngoài màn hình — phải kéo về mép trái.
  // --padding bên trong nút là 10px do TMToggleArea tự set.
  :deep(.tm-toggle-button) {
    right: unset;
    left: calc(-1 * var(--padding));
  }
}

.tm-sidebar {
  position: relative;
  width: 210px;
  min-width: 210px;
  max-width: 210px;
  height: 100%;
  background-color: var(--bg-main-color);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  transition: transform 0.3s ease-in-out;
  overflow-x: hidden;
  padding: var(--padding);
  border-radius: var(--border-radius);
  animation: slideIn 0.3s ease-out forwards;
  border: var(--border-component-style);

  .tm-tool-group {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
  }
}

.tm-sidebar-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 45px;
  padding: var(--padding);
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: visible;

  .tm-item-content {
    flex: 1;
    justify-content: space-between;
    column-gap: var(--padding);
    padding: var(--padding);
    border-radius: var(--border-radius-component);
    text-decoration: none;
    color: var(--text-color);
    min-width: 0;
    cursor: pointer;
  }

  &:hover .tm-item-content {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }

  &--active .tm-item-content {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }

  // Nút pin chỉ hiện khi hover vào item
  &--route {
    &:hover .tm-sidebar-pin-btn {
      opacity: 1;
    }
  }
}

// Zen hover trigger: fixed ở mép trái, chỉ vài px, chừa khoảng toolbar phía trên
.tm-sidebar-zen-trigger {
  position: fixed;
  left: 0;
  top: 50px;
  width: var(--padding);
  height: calc(100vh - 50px);
  z-index: 99;
}

.tm-sidebar-zen-trigger--right {
  left: unset;
  right: 0;
}

// Zen mode: floating panel with gaps and rounded corners
.tm-sidebar--zen {
  position: fixed;
  left: var(--padding);
  top: 50px;
  height: calc(100vh - 100px);
  z-index: 100;
  transform: translateX(calc(-100% - var(--padding)));
  transition:
    transform 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
  opacity: 0.6;
  animation: none;
  border-radius: var(--border-radius);
  border: none;
  padding: 4px;
  overflow: hidden;

  .tm-tool-group {
    overflow: hidden;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &:hover,
  &.tm-sidebar--zen-hover {
    transform: translateX(0);
    opacity: 1;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

    .tm-tool-group {
      overflow-y: auto;
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        display: block;
      }
    }
  }
}

// Zen mode đặt cột ở bên phải: lật ngược phía trong màn hình
.tm-sidebar--zen-right {
  left: unset;
  right: var(--padding);
  transform: translateX(calc(100% + var(--padding)));

  &:hover,
  &.tm-sidebar--zen-hover {
    transform: translateX(0);
  }
}

.tm-sidebar-pin-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 2px;
  border-radius: calc(var(--border-radius) * 0.75);
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    opacity: 1;
  }
}
</style>
