<template>
  <canvas ref="cursorCanvas" class="cursor-canvas"></canvas>
</template>

<script>
import { getThemeEffectColors } from "@/views/backgroundEffect/helpers/TDThemeEffectColors.js";

export default {
  name: "TDCursorSparklesEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      rafId: null,
      target: { x: innerWidth / 2, y: innerHeight / 2 },
      pos: { x: innerWidth / 2, y: innerHeight / 2 },
      trail: [], // các hình hộp vuông 3d theo sau
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
    project(x, y, z) {
      const fov = 300;
      const vpX = this.width / 2;
      const vpY = this.height / 2;
      const scale = fov / (fov + z);
      return {
        x: vpX + x * scale,
        y: vpY + y * scale,
        scale,
      };
    },
    drawCube(cx, cy, size, angleX, angleY, alpha, color = "255,255,255") {
      const s = size / 2;
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const corners = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
      ];

      const pts = corners.map(([x, y, z]) => {
        let x1 = cosY * x + sinY * z;
        let z1 = -sinY * x + cosY * z;
        let y1 = y;
        let y2 = cosX * y1 - sinX * z1;
        let z2 = sinX * y1 + cosX * z1;
        const p = this.project(x1, y2, z2);
        return { x: cx + (p.x - this.width / 2), y: cy + (p.y - this.height / 2) };
      });

      const faces = [
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
        [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5],
      ];

      for (const f of faces) {
        this.ctx.beginPath();
        this.ctx.moveTo(pts[f[0]].x, pts[f[0]].y);
        for (let i = 1; i < f.length; i++) {
          this.ctx.lineTo(pts[f[i]].x, pts[f[i]].y);
        }
        this.ctx.closePath();
        this.ctx.strokeStyle = `rgba(${color},${alpha.toFixed(2)})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    },
    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const { rgb } = getThemeEffectColors();
      const color = rgb.trail;
      this.time += 0.03;

      // easing hộp chính về phía con trỏ
      this.pos.x += (this.target.x - this.pos.x) * 0.16;
      this.pos.y += (this.target.y - this.pos.y) * 0.16;

      // lưu vết các vị trí trước (tạo các hộp đuôi)
      this.trail.push({ x: this.pos.x, y: this.pos.y });
      if (this.trail.length > 14) this.trail.shift();

      // các hộp đuôi mờ dần về phía sau, gradient từ màu trail (đầu/gần con trỏ) sang trắng (đuôi/xa)
      const cA = [255, 255, 255];
      const cB = color.split(",").map(Number);
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        const t = i / this.trail.length;
        const alpha = 0.35 * t;
        const size = 6 + t * 8;
        const angleX = this.time + i * 0.35;
        const angleY = this.time * 1.3 + i * 0.25;
        const g = Math.round(cA[0] + (cB[0] - cA[0]) * t);
        const gr = Math.round(cA[1] + (cB[1] - cA[1]) * t);
        const gb = Math.round(cA[2] + (cB[2] - cA[2]) * t);
        this.ctx.save();
        this.drawCube(p.x, p.y, size, angleX, angleY, alpha, `${g},${gr},${gb}`);
        this.ctx.restore();
      }

      // hộp chính sáng (đầu, dùng màu trail cursor)
      this.ctx.save();
      this.ctx.shadowColor = `rgba(${color},0.9)`;
      this.ctx.shadowBlur = 16;
      this.drawCube(this.pos.x, this.pos.y, 16, this.time, this.time * 1.3, 0.95, color);
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
