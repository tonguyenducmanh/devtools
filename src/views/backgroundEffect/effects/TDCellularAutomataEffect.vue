<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "../helpers/TDThemeEffectColors.js";

export default {
  name: "TDCellularAutomataEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      animationId: null,
      themeObserver: null,
      resizeObserver: null,
      displayWidth: 0,
      displayHeight: 0,
      cellSize: 26,
      cols: 0,
      rows: 0,
      grid: [],
      generation: 0,
      lastUpdate: 0,
      updateInterval: 220,
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
      this.buildGrid();
    },

    buildGrid() {
      this.cols = Math.floor(this.displayWidth / this.cellSize);
      this.rows = Math.floor(this.displayHeight / this.cellSize);
      this.grid = [];
      for (let y = 0; y < this.rows; y++) {
        const row = [];
        for (let x = 0; x < this.cols; x++) {
          row.push(Math.random() < 0.18 ? 1 : 0);
        }
        this.grid.push(row);
      }
      this.generation = 0;
    },

    countNeighbors(grid, x, y) {
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = (x + dx + this.cols) % this.cols;
          const ny = (y + dy + this.rows) % this.rows;
          count += grid[ny][nx];
        }
      }
      return count;
    },

    step() {
      const next = [];
      for (let y = 0; y < this.rows; y++) {
        const row = [];
        for (let x = 0; x < this.cols; x++) {
          const alive = this.grid[y][x];
          const neighbors = this.countNeighbors(this.grid, x, y);
          let newState = alive;
          if (alive && (neighbors < 2 || neighbors > 3)) newState = 0;
          else if (!alive && neighbors === 3) newState = 1;
          row.push(newState);
        }
        next.push(row);
      }
      this.grid = next;
      this.generation++;

      // Nếu mọi thứ chết hẳn, reset lại để luôn có chuyển động
      if (this.generation > 200) {
        const live = this.grid.reduce(
          (sum, row) => sum + row.reduce((s, c) => s + c, 0),
          0,
        );
        if (live < 10) this.buildGrid();
      }
    },

    drawGrid(rgb, isDark) {
      // Đường lưới mờ tinh tế
      this.ctx.strokeStyle = `rgba(${rgb},${isDark ? 0.06 : 0.1})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      for (let x = 0; x <= this.cols; x++) {
        this.ctx.moveTo(x * this.cellSize, 0);
        this.ctx.lineTo(x * this.cellSize, this.displayHeight);
      }
      for (let y = 0; y <= this.rows; y++) {
        this.ctx.moveTo(0, y * this.cellSize);
        this.ctx.lineTo(this.displayWidth, y * this.cellSize);
      }
      this.ctx.stroke();

      // Ô sống: tô nhẹ + viền rõ
      const fillAlpha = isDark ? 0.5 : 0.3;
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          if (this.grid[y][x]) {
            const px = x * this.cellSize;
            const py = y * this.cellSize;
            this.ctx.fillStyle = `rgba(${rgb},${fillAlpha})`;
            this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
            this.ctx.strokeStyle = `rgba(${rgb},${isDark ? 0.6 : 0.4})`;
            this.ctx.lineWidth = 1.2;
            this.ctx.strokeRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);
          }
        }
      }
    },

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      const now = performance.now();
      if (now - this.lastUpdate >= this.updateInterval) {
        this.lastUpdate = now;
        this.step();
      }

      const { rgb, isDark } = getThemeEffectColors();
      this.drawGrid(rgb.trail, isDark);

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
