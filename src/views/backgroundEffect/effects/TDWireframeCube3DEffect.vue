<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "../helpers/TDThemeEffectColors.js";

// 8 đỉnh của cube (unit, tâm gốc)
const VERTICES = [
  { x: 0.5, y: 0.5, z: 0.5 },
  { x: -0.5, y: 0.5, z: 0.5 },
  { x: -0.5, y: -0.5, z: 0.5 },
  { x: 0.5, y: -0.5, z: 0.5 },
  { x: 0.5, y: 0.5, z: -0.5 },
  { x: -0.5, y: 0.5, z: -0.5 },
  { x: -0.5, y: -0.5, z: -0.5 },
  { x: 0.5, y: -0.5, z: -0.5 },
];

// Các mặt (index) + pháp tuyến
const FACES = [
  { idx: [0, 1, 2, 3], normal: { x: 0, y: 0, z: 1 } },
  { idx: [4, 5, 6, 7], normal: { x: 0, y: 0, z: -1 } },
  { idx: [0, 1, 5, 4], normal: { x: 0, y: 1, z: 0 } },
  { idx: [2, 3, 7, 6], normal: { x: 0, y: -1, z: 0 } },
  { idx: [3, 0, 4, 7], normal: { x: 1, y: 0, z: 0 } },
  { idx: [1, 2, 6, 5], normal: { x: -1, y: 0, z: 0 } },
];

export default {
  name: "TDWireframeCube3DEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      animationId: null,
      themeObserver: null,
      resizeObserver: null,
      displayWidth: 0,
      displayHeight: 0,
      cubes: [],
      color: null,
      time: 0,
      focal: 500,
    };
  },
  mounted() {
    this.initCanvas();
    this.initThemeObserver();
    this.initResizeObserver();
  },
  beforeUnmount() {
    if (this.themeObserver) this.themeObserver.disconnect();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    cancelAnimationFrame(this.animationId);
  },
  methods: {
    initThemeObserver() {
      this.themeObserver = new MutationObserver(() => {});
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    },

    initResizeObserver() {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.handleResize(width, height);
        }
      });
      this.resizeObserver.observe(parent);
    },

    initCanvas() {
      this.canvas = this.$refs.particleCanvas;
      this.ctx = this.canvas.getContext("2d");
      const parent = this.canvas.parentElement;
      const w = parent ? parent.clientWidth : 300;
      const h = parent ? parent.clientHeight : 300;
      this.handleResize(w, h);
      this.spawnCubes();
      this.animate();
    },

    handleResize(cssWidth, cssHeight) {
      if (!cssWidth || !cssHeight) return;
      const dpr = window.devicePixelRatio || 1;
      this.displayWidth = cssWidth;
      this.displayHeight = cssHeight;
      this.canvas.width = Math.round(cssWidth * dpr);
      this.canvas.height = Math.round(cssHeight * dpr);
      this.canvas.style.width = `${cssWidth}px`;
      this.canvas.style.height = `${cssHeight}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.focal = Math.min(this.displayWidth, this.displayHeight) * 0.9;
    },

    spawnCubes() {
      const count = 7 + Math.floor(Math.random() * 4); // 7..10
      this.cubes = [];
      for (let i = 0; i < count; i++) {
        this.cubes.push({
          cx: Math.random() * this.displayWidth,
          cy: Math.random() * this.displayHeight,
          size: Math.random() * 140 + 40, // px
          depth: 350 + Math.random() * 750,
          speedY: (Math.random() * 0.7 + 0.4) * (Math.random() > 0.5 ? 1 : -1),
          speedX: Math.random() * 0.3 - 0.15,
          angleY: Math.random() * Math.PI * 2,
          angleX: Math.random() * 0.6 + 0.2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          bobPhase: Math.random() * Math.PI * 2,
          halfSize: 45 + Math.random() * 40,
        });
      }
    },

    rotateY({ x, y, z }, angle) {
      return {
        x: x * Math.cos(angle) + z * Math.sin(angle),
        y,
        z: x * -Math.sin(angle) + z * Math.cos(angle),
      };
    },

    rotateX({ x, y, z }, angle) {
      return {
        x,
        y: y * Math.cos(angle) - z * Math.sin(angle),
        z: y * Math.sin(angle) + z * Math.cos(angle),
      };
    },

    // Phối cảnh: chia cho z để vật xa nhỏ hơn
    perspective(p, depth) {
      const eps = 1e-6;
      const d = depth <= eps ? eps : depth;
      return { x: p.x / d, y: p.y / d };
    },

    drawCube(cube) {
      const bob = Math.sin(this.time * 0.002 + cube.bobPhase) * 12;
      const cy = cube.cy + bob;

      // Xoay các đỉnh (unit * size) rồi chiếu phối cảnh + đưa về pixel
      const points = VERTICES.map((v) => {
        const rotated = this.rotateX(
          this.rotateY(
            { x: v.x * cube.size, y: v.y * cube.size, z: v.z * cube.size },
            cube.angleY,
          ),
          cube.angleX,
        );
        const p = this.perspective(rotated, cube.depth);
        return {
          x: cube.cx + p.x * this.focal,
          y: cy + p.y * this.focal,
        };
      });

      // Vẽ wireframe, chỉ vẽ cạnh của các mặt hướng về camera + shade theo pháp tuyến
      FACES.forEach((face) => {
        const rn = this.rotateX(
          this.rotateY(
            { x: face.normal.x, y: face.normal.y, z: face.normal.z },
            cube.angleY,
          ),
          cube.angleX,
        );
        const brightness = Math.max(0, rn.z);
        if (brightness < 0.02) return;

        const idx = face.idx;
        const alpha = 0.15 + brightness * 0.6;
        this.ctx.strokeStyle = `rgba(${this.color},${alpha.toFixed(3)})`;
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.moveTo(points[idx[0]].x, points[idx[0]].y);
        for (let i = 1; i < idx.length; i++) {
          this.ctx.lineTo(points[idx[i]].x, points[idx[i]].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
      });
    },

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      const { rgb } = getThemeEffectColors();
      this.color = rgb.trail;
      this.time++;

      this.cubes.forEach((c) => {
        c.angleY += c.speedY * 0.01;
        c.angleX += c.speedX * 0.01;

        // Trôi dạt chậm + wrap quanh màn hình (giống TDParticleShapeEffect)
        c.cx += c.vx;
        c.cy += c.vy;
        if (c.cx < -c.halfSize) c.cx = this.displayWidth + c.halfSize;
        if (c.cx > this.displayWidth + c.halfSize) c.cx = -c.halfSize;
        if (c.cy < -c.halfSize) c.cy = this.displayHeight + c.halfSize;
        if (c.cy > this.displayHeight + c.halfSize) c.cy = -c.halfSize;
      });

      // Depth sort: vẽ cube xa (depth lớn) trước
      const sorted = this.cubes
        .slice()
        .sort((a, b) => b.depth - a.depth);

      sorted.forEach((o) => this.drawCube(o));

      this.animationId = requestAnimationFrame(this.animate);
    },
  },
};
</script>

<style scoped>
.particle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  background: transparent;
}
</style>
