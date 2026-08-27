<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "./TDThemeEffectColors.js";

export default {
  name: "TDGeometryFlowEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      animationId: null,
      themeObserver: null,
      resizeObserver: null,
      displayWidth: 0,
      displayHeight: 0,
      shapes: [],
      maxShapes: 26,
      mouse: null,
    };
  },
  mounted() {
    this.initCanvas();
    window.addEventListener("mousemove", this.handleMouseMove);
    this.initThemeObserver();
    this.initResizeObserver();
  },
  beforeUnmount() {
    window.removeEventListener("mousemove", this.handleMouseMove);
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

    handleMouseMove(e) {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
      this.createShapes();
    },

    createShapes() {
      this.shapes = [];
      for (let i = 0; i < this.maxShapes; i++) {
        const sides = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
        this.shapes.push({
          x: Math.random() * this.displayWidth,
          y: Math.random() * this.displayHeight,
          size: Math.random() * 22 + 8,
          sides,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.01,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          alpha: Math.random() * 0.4 + 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    },

    drawPolygon(shape, rgb, isDark) {
      this.ctx.save();
      this.ctx.translate(shape.x, shape.y);
      this.ctx.rotate(shape.rotation);

      const lineAlpha = isDark ? 0.5 : 0.35;
      this.ctx.strokeStyle = `rgba(${rgb},${((shape.alpha + 0.2) * lineAlpha).toFixed(3)})`;
      this.ctx.lineWidth = 1.2;
      this.ctx.fillStyle = `rgba(${rgb},${(shape.alpha * 0.15).toFixed(3)})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = `rgba(${rgb},0.4)`;

      this.ctx.beginPath();
      for (let i = 0; i < shape.sides; i++) {
        const angle = (i / shape.sides) * Math.PI * 2;
        const r = shape.size;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    },

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      const { rgb, isDark } = getThemeEffectColors();
      const color = rgb.trail;

      this.shapes.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vx += Math.sin(Date.now() * 0.0005 + s.phase) * 0.002;
        s.vy += Math.cos(Date.now() * 0.0004 + s.phase) * 0.002;
        s.rotation += s.rotSpeed;

        if (s.x < -30) s.x = this.displayWidth + 30;
        if (s.x > this.displayWidth + 30) s.x = -30;
        if (s.y < -30) s.y = this.displayHeight + 30;
        if (s.y > this.displayHeight + 30) s.y = -30;

        if (this.mouse) {
          const dx = s.x - this.mouse.x;
          const dy = s.y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            s.x += (dx / dist) * force * 1.5;
            s.y += (dy / dist) * force * 1.5;
          }
        }

        this.drawPolygon(s, color, isDark);
      });

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
