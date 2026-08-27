<template>
  <canvas ref="cursorCanvas" class="cursor-canvas"></canvas>
</template>

<script>
import { getThemeEffectColors } from "@/views/backgroundEffect/helpers/TDThemeEffectColors.js";

export default {
  name: "TDCursorConfettiEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      rafId: null,
      target: { x: innerWidth / 2, y: innerHeight / 2 },
      pos: { x: innerWidth / 2, y: innerHeight / 2 },
      trail: [],
      width: 0,
      height: 0,
      dpr: 1,
      time: 0,
    };
  },
  methods: {
    onMouseMove(e) {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    },
    onResize() {
      this.dpr = window.devicePixelRatio || 1;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    drawConfetti(cx, cy, w, h, angle, alpha, color) {
      this.ctx.save();
      this.ctx.translate(cx, cy);
      this.ctx.rotate(angle);
      this.ctx.fillStyle = `rgba(${color},${alpha.toFixed(2)})`;
      this.ctx.fillRect(-w / 2, -h / 2, w, h);
      this.ctx.restore();
    },
    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const { rgb } = getThemeEffectColors();
      const color = rgb.trail;
      this.time += 0.08;

      this.pos.x += (this.target.x - this.pos.x) * 0.16;
      this.pos.y += (this.target.y - this.pos.y) * 0.16;

      this.trail.push({ x: this.pos.x, y: this.pos.y });
      if (this.trail.length > 18) this.trail.shift();

      const cA = [255, 255, 255];
      const cB = color.split(",").map(Number);
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        const t = i / this.trail.length;
        const alpha = 0.5 * t;
        const w = 8 + t * 6;
        const h = 4 + t * 4;
        const g = Math.round(cA[0] + (cB[0] - cA[0]) * t);
        const gr = Math.round(cA[1] + (cB[1] - cA[1]) * t);
        const gb = Math.round(cA[2] + (cB[2] - cA[2]) * t);
        this.drawConfetti(p.x, p.y, w, h, this.time * 2 + i * 0.5, alpha, `${g},${gr},${gb}`);
      }

      this.ctx.save();
      this.ctx.shadowColor = `rgba(${color},0.9)`;
      this.ctx.shadowBlur = 14;
      this.drawConfetti(this.pos.x, this.pos.y, 16, 10, this.time * 2, 0.95, color);
      this.ctx.restore();

      this.rafId = requestAnimationFrame(this.animate);
    },
  },
  mounted() {
    this.canvas = this.$refs.cursorCanvas;
    this.ctx = this.canvas.getContext("2d");
    this.onResize();
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("resize", this.onResize);
    this.rafId = requestAnimationFrame(this.animate);
  },
  beforeUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("resize", this.onResize);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  },
};
</script>

<style scoped>
.cursor-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
  background: transparent;
}
</style>
