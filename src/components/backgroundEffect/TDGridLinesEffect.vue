<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "./TDThemeEffectColors.js";

export default {
  name: "TDGridLinesEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      animationId: null,
      themeObserver: null,
      resizeObserver: null,
      displayWidth: 0,
      displayHeight: 0,

      // ── Config ──
      gridSize: 30, // Khoảng cách giữa các ô lưới
      dots: [], // Danh sách các điểm chạy trên lưới
      maxDots: 50, // Số lượng hạt tối đa chạy trên màn hình
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
      this.themeObserver = new MutationObserver(() => {
        // Tái tạo lại các hạt khi đổi theme để cập nhật màu sắc phù hợp
        this.createDots();
      });
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

      this.createDots();
    },

    createDots() {
      this.dots = [];
      for (let i = 0; i < this.maxDots; i++) {
        this.dots.push(this.generateDot());
      }
    },

    generateDot() {
      const { isDark, rgb } = getThemeEffectColors();
      const colorPool = isDark
        ? [rgb.trail, rgb.secondary]
        : [rgb.trail, rgb.secondary];

      if (Math.random() > 0.85) {
        colorPool.push(isDark ? rgb.bg : rgb.bg);
      }

      // Loại bỏ trùng lặp màu khi primary === bg (theme sáng ít tương phản)
      const randomColor =
        colorPool[Math.floor(Math.random() * colorPool.length)];

      const col = Math.floor(
        Math.random() * (this.displayWidth / this.gridSize),
      );
      const row = Math.floor(
        Math.random() * (this.displayHeight / this.gridSize),
      );

      const isHorizontal = Math.random() > 0.5;

      // GIẢM vận tốc xuống một chút (0.4 - 0.6) để chuyển động mượt mà, không bị vội
      const speed = Math.random() * 0.2 + 0.4;

      return {
        x: col * this.gridSize,
        y: row * this.gridSize,
        vx: isHorizontal ? (Math.random() > 0.5 ? speed : -speed) : 0,
        vy: !isHorizontal ? (Math.random() > 0.5 ? speed : -speed) : 0,
        size: Math.random() * 5 + 1.2,
        color: randomColor,
        alpha: Math.random() * 0.4 + 0.2, // Giảm nhẹ alpha gốc để nhìn deep hơn
        // TĂNG tuổi thọ lên gấp 3-4 lần để hạt chạy được quãng đường dài khắp màn hình
        life: Math.random() * 600 + 400,
      };
    },

    drawGrid() {
      const { isDark, rgb } = getThemeEffectColors();
      // Đường lưới xám mờ tinh tế
      this.ctx.strokeStyle = isDark
        ? `rgba(${rgb.trail}, 0.08)`
        : `rgba(${rgb.trail}, 0.15)`;
      this.ctx.lineWidth = 0.5;

      // Vẽ các đường dọc
      for (let x = 0; x < this.displayWidth; x += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.displayHeight);
        this.ctx.stroke();
      }

      // Vẽ các đường ngang
      for (let y = 0; y < this.displayHeight; y += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.displayWidth, y);
        this.ctx.stroke();
      }
    },

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      this.drawGrid();

      this.dots.forEach((dot, index) => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.life--;

        // Kiểm tra xem hạt có đang ở gần giao điểm của lưới không
        const atHorizontalGrid = Math.abs(dot.x % this.gridSize) < 0.5;
        const atVerticalGrid = Math.abs(dot.y % this.gridSize) < 0.5;

        if (atHorizontalGrid && atVerticalGrid) {
          // GIẢM tỷ lệ bẻ góc xuống > 0.96 (chỉ có 4% cơ hội rẽ ngang/dọc tại mỗi ô)
          // Điều này giúp hạt đi được những đường thẳng rất dài trước khi quyết định quẹo
          if (Math.random() > 0.96) {
            const isHorizontal = dot.vx !== 0;
            const speed = Math.abs(dot.vx) || Math.abs(dot.vy); // Giữ nguyên vận tốc cũ khi rẽ

            // Bo tròn tọa độ về đúng tâm lưới để tránh sai số pixel tích lũy
            dot.x = Math.round(dot.x / this.gridSize) * this.gridSize;
            dot.y = Math.round(dot.y / this.gridSize) * this.gridSize;

            if (isHorizontal) {
              dot.vx = 0;
              dot.vy = Math.random() > 0.5 ? speed : -speed;
            } else {
              dot.vy = 0;
              dot.vx = Math.random() > 0.5 ? speed : -speed;
            }
          }
        }

        // Vẽ hạt
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${dot.color}, ${dot.alpha})`;
        this.ctx.fill();

        // Reset hạt
        if (
          dot.life <= 0 ||
          dot.x < -10 ||
          dot.x > this.displayWidth + 10 ||
          dot.y < -10 ||
          dot.y > this.displayHeight + 10
        ) {
          this.dots[index] = this.generateDot();
        }
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
