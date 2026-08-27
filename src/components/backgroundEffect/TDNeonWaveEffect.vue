<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "./TDThemeEffectColors.js";

export default {
  name: "TDNeonWaveEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      animationId: null,
      themeObserver: null,
      resizeObserver: null,
      displayWidth: 0,
      displayHeight: 0,
      time: 0,
      rows: 18,
      cols: 34,
      amplitude: 26,
      speed: 0.0008,
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
    },

    drawWave(rgb, isDark) {
      const t = this.time * this.speed;
      const baseAlpha = isDark ? 0.5 : 0.32;
      const cellW = this.displayWidth / (this.cols - 1);
      const cellH = this.displayHeight / (this.rows - 1);
      const grid = [];

      for (let r = 0; r < this.rows; r++) {
        const row = [];
        for (let c = 0; c < this.cols; c++) {
          const nd = Math.sqrt(
            Math.pow(c / this.cols - 0.5, 2) + Math.pow(r / this.rows - 0.5, 2) * 0.5,
          );
          const z =
            Math.sin(nd * 12 - t * 3 + c * 0.25 + r * 0.15) * this.amplitude;
          row.push({
            x: c * cellW,
            y: r * cellH + z,
            z,
          });
        }
        grid.push(row);
      }

      for (let r = 0; r < this.rows - 1; r++) {
        for (let c = 0; c < this.cols - 1; c++) {
          const opacity =
            1 - Math.abs(grid[r][c].z) / (this.amplitude * 1.6);
          this.ctx.strokeStyle = `rgba(${rgb},${(baseAlpha * opacity).toFixed(3)})`;
          this.ctx.lineWidth = 0.7;

          this.ctx.beginPath();
          this.ctx.moveTo(grid[r][c].x, grid[r][c].y);
          this.ctx.lineTo(grid[r][c + 1].x, grid[r][c + 1].y);
          this.ctx.lineTo(grid[r + 1][c + 1].x, grid[r + 1][c + 1].y);
          this.ctx.lineTo(grid[r + 1][c].x, grid[r + 1][c].y);
          this.ctx.closePath();
          this.ctx.stroke();
        }
      }
    },

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
      this.time++;

      const { rgb, isDark } = getThemeEffectColors();
      this.drawWave(rgb.trail, isDark);

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
