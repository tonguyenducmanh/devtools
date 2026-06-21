<template>
  <Teleport to="body">
    <Transition name="td-ctx-fade">
      <div
        v-if="state.visible"
        class="td-ctx-menu"
        :style="menuStyle"
        @click.stop
      >
        <button
          v-for="item in state.items"
          :key="item.key"
          class="td-ctx-item"
          @click="handleClick(item)"
        >
          <span
            v-if="item.icon"
            class="td-ctx-icon td-icon"
            :class="item.icon"
          />
          {{ item.label }}
        </button>
      </div>
    </Transition>

    <!-- Overlay bắt click ra ngoài -->
    <div
      v-if="state.visible"
      class="td-ctx-overlay"
      @click="close"
      @contextmenu.prevent="close"
    />
  </Teleport>
</template>

<script>
import { reactive, computed } from "vue";

// State dùng chung — được export để ContextMenuPlugin truy cập
export const contextMenuState = reactive({
  visible: false,
  x: 0,
  y: 0,
  items: [], // [{ key, label, icon?, action }]
});

export default {
  name: "TDContextMenu",

  setup() {
    // Tính vị trí menu tránh tràn ra ngoài viewport
    const menuStyle = computed(() => ({
      top: contextMenuState.y + "px",
      left: contextMenuState.x + "px",
    }));

    function handleClick(item) {
      close();
      if (typeof item.action === "function") item.action();
    }

    function close() {
      contextMenuState.visible = false;
      contextMenuState.items = [];
    }

    // Expose cho plugin gọi trực tiếp qua instance
    function open({ x, y, items }) {
      const menuW = 220;
      const menuH = Math.max(items.length * 40, 48);

      contextMenuState.x = Math.min(x, window.innerWidth - menuW - 8);
      contextMenuState.y = Math.min(y, window.innerHeight - menuH - 8);
      contextMenuState.items = items;
      contextMenuState.visible = true;
    }

    return { state: contextMenuState, menuStyle, handleClick, close, open };
  },
};
</script>
