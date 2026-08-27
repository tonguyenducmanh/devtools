<template>
  <canvas ref="cursorCanvas" class="cursor-canvas"></canvas>
</template>

<script>
import { getThemeEffectColors } from "@/views/backgroundEffect/helpers/TDThemeEffectColors.js";

export default {
  name: "TDCursorRingEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      rafId: null,
      target: { x: innerWidth / 2, y: innerHeight / 2 },
      pos: { x: innerWidth / 2, y: innerHeight / 2 },
      trail: [], // các vòng ma theo sau
      width: 0,
      height: 0,
      dpr: 1,
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
    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const { rgb } = getThemeEffectColors();
      const color = rgb.trail;

      // easing vòng chính về phía con trỏ
      this.pos.x += (this.target.x - this.pos.x) * 0.16;
      this.pos.y += (this.target.y - this.pos.y) * 0.16;

      // lưu vết các vị trí trước (tạo vòng đuôi ma)
      this.trail.push({ x: this.pos.x, y: this.pos.y });
      if (this.trail.length > 14) this.trail.shift();

      // vòng đuôi ma
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        const t = i / this.trail.length;
        this.ctx.strokeStyle = `rgba(${color},${(0.4 * t).toFixed(2)})`;
        this.ctx.lineWidth = 1 + t * 1.6;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 8 + t * 6, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // vòng chính sáng + chấm tâm
      this.ctx.save();
      this.ctx.shadowColor = `rgba(${color},0.9)`;
      this.ctx.shadowBlur = 18;
      this.ctx.strokeStyle = `rgba(${color},0.95)`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(this.pos.x, this.pos.y, 16, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.fillStyle = `rgba(${color},1)`;
      this.ctx.beginPath();
      this.ctx.arc(this.pos.x, this.pos.y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
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
