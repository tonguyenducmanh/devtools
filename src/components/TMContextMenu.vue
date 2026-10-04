<template>
  <Teleport to="body">
    <Transition name="tm-ctx-fade">
      <div
        v-if="state.visible"
        ref="menuRef"
        class="tm-ctx-menu"
        :style="menuStyle"
        @click.stop
      >
        <button
          v-for="item in state.items"
          :key="item.key"
          class="tm-ctx-item"
          @click="handleClick(item)"
        >
          <span
            v-if="item.icon"
            class="tm-ctx-icon tm-icon"
            :class="item.icon"
          />
          {{ item.label }}
        </button>
      </div>
    </Transition>

    <!-- Overlay bắt click ra ngoài -->
    <div
      v-if="state.visible"
      class="tm-ctx-overlay"
      @click="close"
      @contextmenu.prevent="close"
    />
  </Teleport>
</template>

<script>
import { reactive, computed, ref, nextTick } from "vue";

// Khoảng cách tối thiểu giữa mép menu và mép màn hình
const MENU_VIEWPORT_MARGIN = 8;

// State dùng chung — được export để ContextMenuPlugin truy cập
export const contextMenuState = reactive({
  visible: false,
  x: 0,
  y: 0,
  items: [], // [{ key, label, icon?, action }]
});

export default {
  name: "TMContextMenu",

  setup() {
    const menuRef = ref(null);

    // Tính vị trí menu, giá trị x/y đã được open() chỉnh sẵn cho vừa màn hình
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
      // Tạm đặt đúng vị trí con trỏ để menu hiện ngay tại chỗ bấm,
      // phần chỉnh lại cho khỏi tràn làm ở bên dưới.
      contextMenuState.x = x;
      contextMenuState.y = y;
      contextMenuState.items = items;
      contextMenuState.visible = true;

      // Menu phải render xong mới đo được kích thước thật.
      // nextTick là microtask chạy trước lúc browser vẽ frame, nên đo + dời ở đây
      // không bị nháy, user không thấy chuyển vị trí.
      nextTick(() => {
        let el = menuRef.value;
        if (!el) return;

        // Đo kích thước THẬT, không đoán cứng.
        // Trước đây đoán cứng 220px nên chỗ nào cách mép phải < 228px là menu bị
        // đẩy lệch sang trái so với con trỏ, dù menu thật chỉ rộng ~150px.
        // Sidebar collection nằm sát mép phải nên lúc nào cũng bị lệch.
        let menuW = el.offsetWidth;
        let menuH = el.offsetHeight;

        // Vừa khít thì giữ nguyên: menu nằm sát điểm bấm
        let nextX = x;
        let nextY = y;

        // Tràn mép phải / mép dưới thì lật sang hướng ngược lại,
        // giống context menu native của OS (tab view cũng dùng chung hàm này).
        if (nextX + menuW + MENU_VIEWPORT_MARGIN > window.innerWidth) {
          nextX = x - menuW;
        }
        if (nextY + menuH + MENU_VIEWPORT_MARGIN > window.innerHeight) {
          nextY = y - menuH;
        }

        // Menu to hơn cả màn hình thì chỉ bảo đảm không tràn
        contextMenuState.x = Math.max(
          MENU_VIEWPORT_MARGIN,
          Math.min(nextX, window.innerWidth - menuW - MENU_VIEWPORT_MARGIN),
        );
        contextMenuState.y = Math.max(
          MENU_VIEWPORT_MARGIN,
          Math.min(nextY, window.innerHeight - menuH - MENU_VIEWPORT_MARGIN),
        );
      });
    }

    return {
      state: contextMenuState,
      menuRef,
      menuStyle,
      handleClick,
      close,
      open,
    };
  },
};
</script>
