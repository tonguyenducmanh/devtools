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
      particles: [],
      width: 0,
      height: 0,
      dpr: 1,
      mouse: { x: innerWidth / 2, y: innerHeight / 2 },
      lastEmit: 0,
    };
  },
  methods: {
    onMouseMove(e) {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    },
    onResize() {
      this.dpr = window.devicePixelRatio || 1;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    emitBurst() {
      for (let i = 0; i < 2; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        this.particles.push({
          x: this.mouse.x,
          y: this.mouse.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 1,
          size: 1 + Math.random() * 2.2,
        });
      }
      if (this.particles.length > 220) {
        this.particles.splice(0, this.particles.length - 220);
      }
    },
    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const { rgb } = getThemeEffectColors();

      // phun hạt liên tục khi di chuyển
      this.emitBurst();

      const keep = [];
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 0.028;
        if (p.life <= 0) continue;
        keep.push(p);
        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = `rgba(${rgb.trail},${p.life.toFixed(2)})`;
        this.ctx.shadowColor = `rgba(${rgb.trail},0.9)`;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
      this.particles = keep;

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
