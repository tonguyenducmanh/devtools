<template>
  <canvas ref="cursorCanvas" class="cursor-canvas"></canvas>
</template>

<script>
import { getThemeEffectColors } from "@/views/backgroundEffect/helpers/TDThemeEffectColors.js";

export default {
  name: "TDCursorPyramidEffect",
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
    drawPyramid(cx, cy, size, angle, alpha, color) {
      const s = size / 2;
      const apex = { x: 0, y: 0, z: -s };
      const base = [
        { x: -s, y: s, z: s },
        { x: s, y: s, z: s },
        { x: s, y: -s, z: s },
        { x: -s, y: -s, z: s },
      ];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const rot = (p) => {
        const x1 = cos * p.x + sin * p.z;
        const z1 = -sin * p.x + cos * p.z;
        return { x: x1, y: p.y, z: z1 };
      };

      const fov = 300;
      const proj = (p) => {
        const scale = fov / (fov + p.z);
        return { x: cx + p.x * scale, y: cy + p.y * scale };
      };

      const a = rot(apex);
      const b = base.map(rot);
      const ptsB = b.map(proj);
      const ptsA = proj(a);

      this.ctx.strokeStyle = `rgba(${color},${alpha.toFixed(2)})`;
      this.ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const n = (i + 1) % 4;
        this.ctx.beginPath();
        this.ctx.moveTo(ptsA.x, ptsA.y);
        this.ctx.lineTo(ptsB[i].x, ptsB[i].y);
        this.ctx.lineTo(ptsB[n].x, ptsB[n].y);
        this.ctx.closePath();
        this.ctx.stroke();
      }
      this.ctx.beginPath();
      this.ctx.moveTo(ptsB[0].x, ptsB[0].y);
      for (let i = 1; i < 4; i++) this.ctx.lineTo(ptsB[i].x, ptsB[i].y);
      this.ctx.closePath();
      this.ctx.stroke();
    },
    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const { rgb } = getThemeEffectColors();
      const color = rgb.trail;
      const white = "255,255,255";
      this.time += 0.05;

      this.pos.x += (this.target.x - this.pos.x) * 0.16;
      this.pos.y += (this.target.y - this.pos.y) * 0.16;

      this.trail.push({ x: this.pos.x, y: this.pos.y });
      if (this.trail.length > 14) this.trail.shift();

      const cA = [255, 255, 255];
      const cB = color.split(",").map(Number);
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        const t = i / this.trail.length;
        const alpha = 0.4 * t;
        const size = 6 + t * 8;
        const g = Math.round(cA[0] + (cB[0] - cA[0]) * t);
        const gr = Math.round(cA[1] + (cB[1] - cA[1]) * t);
        const gb = Math.round(cA[2] + (cB[2] - cA[2]) * t);
        this.drawPyramid(p.x, p.y, size, this.time + i * 0.4, alpha, `${g},${gr},${gb}`);
      }

      this.ctx.save();
      this.ctx.shadowColor = `rgba(${color},0.9)`;
      this.ctx.shadowBlur = 16;
      this.drawPyramid(this.pos.x, this.pos.y, 16, this.time, 0.95, color);
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
