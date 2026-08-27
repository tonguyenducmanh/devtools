<template>
  <svg
    v-show="visible"
    class="cursor-trail-svg"
    :style="{ opacity: svgOpacity }"
  >
    <path
      :d="pathD"
      fill="none"
      stroke="var(--trail-color)"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script>
export default {
  name: "TDCursorTrailEffect",
  data() {
    return {
      trailLen: 20,
      trail: [],
      visible: false,
      svgOpacity: 1,
      mousePos: { x: 0, y: 0 },
      strokeWidth: 2,
      rafId: null,
    };
  },
  computed: {
    pathD() {
      if (this.trail.length < 2) return "";
      return this.trail
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
    },
  },
  methods: {
    onMouseMove(e) {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
      if (!this.visible) {
        this.trail = Array.from({ length: this.trailLen }, () => ({
          x: e.clientX,
          y: e.clientY,
        }));
        this.visible = true;
      }
    },
    onMouseLeave() {
      this.svgOpacity = 0;
    },
    onMouseEnter() {
      this.svgOpacity = 1;
    },
    updateTrail() {
      this.trail = [
        { x: this.mousePos.x, y: this.mousePos.y },
        ...this.trail.slice(0, this.trailLen - 1),
      ];
      this.rafId = requestAnimationFrame(this.updateTrail);
    },
  },
  async mounted() {
    let showCursorTrail =
      await this.$tdUtility.getUserSettings("showCursorTrail");
    if (showCursorTrail === false) return;
    this.mousePos = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    this.trail = Array.from({ length: this.trailLen }, () => ({
      x: this.mousePos.x,
      y: this.mousePos.y,
    }));
    window.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseleave", this.onMouseLeave);
    document.addEventListener("mouseenter", this.onMouseEnter);
    this.rafId = requestAnimationFrame(this.updateTrail);
  },
  beforeUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseleave", this.onMouseLeave);
    document.removeEventListener("mouseenter", this.onMouseEnter);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  },
};
</script>

<style scoped>
.cursor-trail-svg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
  transition: opacity 0.3s 0.2s ease;
  --trail-color: var(--trail-cursor-color);
}
</style>
