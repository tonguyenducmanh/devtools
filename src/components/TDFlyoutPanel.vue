<template>
  <Teleport to="body">
    <Transition :name="transitionName">
      <div
        v-if="show"
        ref="panelEl"
        class="td-flyout-panel"
        :class="panelClass"
        :style="panelStyle"
        @mouseenter="$emit('mouseenter')"
        @mouseleave="$emit('mouseleave')"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script>
const SIDES = ["top", "bottom", "left", "right"];

export default {
  name: "TDFlyoutPanel",
  props: {
    // Có hiển thị panel hay không (thường truyền `!!activeKey` từ useFlyout)
    show: {
      type: Boolean,
      default: false,
    },
    // DOM element làm điểm neo để định vị (thường truyền `anchorEl` từ useFlyout)
    anchorEl: {
      default: null,
    },
    // 'auto' sẽ tự chọn hướng còn nhiều chỗ trống nhất và đủ chỗ chứa panel
    placement: {
      type: String,
      default: "auto",
      validator: (v) => v === "auto" || SIDES.includes(v),
    },
    gap: {
      type: Number,
      default: 4,
    }, // khoảng cách giữa anchor và panel
    edgePadding: {
      type: Number,
      default: 8,
    }, // khoảng cách tối thiểu tới mép màn hình
    zIndex: {
      type: Number,
      default: 1000,
    },
    // class riêng theo nơi sử dụng (vd: 'td-header-flyout', 'td-sidebar-group-flyout')
    panelClass: {
      type: [String, Array, Object],
      default: "",
    },
  },
  emits: ["mouseenter", "mouseleave"],
  data() {
    return {
      panelStyle: {},
      resolvedPlacement: "bottom",
      _resizeHandler: null,
    };
  },
  computed: {
    // Transition đổi hướng theo placement thực tế đã resolve (kể cả khi auto-flip)
    transitionName() {
      return `td-flyout-${this.resolvedPlacement}`;
    },
  },
  watch: {
    // Trường hợp đổi sang anchor khác trong lúc panel ĐANG mở (vd: rê chuột
    // từ item này sang item kế bên mà không rời khỏi vùng menu) — `show`
    // vẫn là true suốt nên phải lắng riêng anchorEl để định vị lại.
    anchorEl(el) {
      if (this.show && el) this._preparePosition();
    },
    show(val) {
      if (val) {
        this._preparePosition();
        this._bindReposition();
      } else {
        this._unbindReposition();
      }
    },
  },
  beforeUnmount() {
    this._unbindReposition();
  },
  methods: {
    // Đặt panel ở trạng thái ẩn (visibility) tại vị trí tạm, đợi DOM render
    // xong nội dung thật rồi mới đo kích thước chính xác để tính toạ độ.
    _preparePosition() {
      this.panelStyle = {
        position: "fixed",
        top: "0px",
        left: "0px",
        visibility: "hidden",
        zIndex: this.zIndex,
      };
      this.$nextTick(this.position);
    },

    position() {
      const anchor = this.anchorEl;
      const panel = this.$refs.panelEl;
      if (!anchor || !panel) return;

      const anchorRect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { gap, edgePadding } = this;

      // Chỗ trống thực tế ở mỗi hướng tính từ mép anchor tới mép màn hình
      const space = {
        bottom: vh - anchorRect.bottom,
        top: anchorRect.top,
        right: vw - anchorRect.right,
        left: anchorRect.left,
      };

      const fits = {
        bottom: space.bottom >= panelRect.height + gap,
        top: space.top >= panelRect.height + gap,
        right: space.right >= panelRect.width + gap,
        left: space.left >= panelRect.width + gap,
      };

      let placement = this.placement;
      if (placement === "auto" || !fits[placement]) {
        // Ưu tiên hướng được yêu cầu nếu đủ chỗ; nếu không thì thử lần lượt
        // các hướng còn lại theo thứ tự ưu tiên; nếu không hướng nào đủ chỗ
        // thì chọn hướng có nhiều chỗ trống nhất (sẽ được clamp ở bước sau).
        const tryOrder = [
          this.placement,
          "bottom",
          "right",
          "top",
          "left",
        ].filter((p) => SIDES.includes(p));
        placement =
          tryOrder.find((p) => fits[p]) ||
          SIDES.reduce((a, b) => (space[a] >= space[b] ? a : b));
      }

      const coords = {
        bottom: { top: anchorRect.bottom + gap, left: anchorRect.left },
        top: {
          top: anchorRect.top - panelRect.height - gap,
          left: anchorRect.left,
        },
        right: { top: anchorRect.top, left: anchorRect.right + gap },
        left: {
          top: anchorRect.top,
          left: anchorRect.left - panelRect.width - gap,
        },
      }[placement];

      // Clamp để panel không bao giờ tràn ra ngoài viewport
      const maxTop = Math.max(vh - panelRect.height - edgePadding, edgePadding);
      const maxLeft = Math.max(vw - panelRect.width - edgePadding, edgePadding);
      const top = Math.min(Math.max(coords.top, edgePadding), maxTop);
      const left = Math.min(Math.max(coords.left, edgePadding), maxLeft);

      this.resolvedPlacement = placement;
      this.panelStyle = {
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        visibility: "visible",
        zIndex: this.zIndex,
      };
    },

    // Khi panel đang mở, nếu user resize/scroll thì định vị lại cho khỏi lệch
    _bindReposition() {
      this._resizeHandler = () => {
        if (this.show) this.position();
      };
      window.addEventListener("resize", this._resizeHandler);
      window.addEventListener("scroll", this._resizeHandler, true);
    },
    _unbindReposition() {
      if (this._resizeHandler) {
        window.removeEventListener("resize", this._resizeHandler);
        window.removeEventListener("scroll", this._resizeHandler, true);
        this._resizeHandler = null;
      }
    },
  },
};
</script>
