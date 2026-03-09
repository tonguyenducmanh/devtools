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

<style lang="scss">
/* Không scoped — dùng Teleport nên cần global */
.td-ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.td-ctx-menu {
  position: fixed;
  z-index: 1001;
  min-width: 200px;
  background-color: var(--bg-main-color);
  border: 1px solid var(--bg-layer-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: calc(var(--padding) / 2);
}

.td-ctx-fade-enter-active {
  animation: td-ctx-pop 0.1s ease;
}
.td-ctx-fade-leave-active {
  animation: td-ctx-pop 0.08s ease reverse;
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
