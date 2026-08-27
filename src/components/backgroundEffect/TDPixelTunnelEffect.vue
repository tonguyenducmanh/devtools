<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "./TDThemeEffectColors.js";

export default {
  name: "TDPixelTunnelEffect",
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
      pixels: [],
      maxPixels: 60, // Số lượng hạt pixel hiển thị cùng lúc
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
        // Làm mới mảng pixel để cập nhật màu sắc theo theme mới nhanh chóng
        this.pixels = [];
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

      this.pixels = [];
    },

    generatePixel() {
      const { isDark, rgb } = getThemeEffectColors();

      // Chọn màu ngẫu nhiên dựa theo độ tương phản của theme
      const colorPool = isDark
        ? [rgb.trail, rgb.secondary]
        : [rgb.trail, rgb.secondary];

      if (Math.random() > 0.8) {
        colorPool.push(rgb.bg);
      }
      const randomColor =
        colorPool[Math.floor(Math.random() * colorPool.length)];

      // Góc bắn ngẫu nhiên từ tâm (360 độ)
      const angle = Math.random() * Math.PI * 2;

      return {
        angle: angle,
        // z đại diện cho khoảng cách (chiều sâu 3D). Càng nhỏ nghĩa là càng ở xa (gần tâm), càng lớn là càng lao gần màn hình.
        z: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.001 + 0.003, // Tốc độ lao tới
        baseSize: Math.random() * 8 + 4, // Kích thước thật của khối pixel
        color: randomColor,
        alpha: 0, // Ban đầu mờ hẳn, khi lao ra xa tâm sẽ rõ dần
      };
    },

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      // Tâm màn hình (Điểm tụ 3D)
      const centerX = this.displayWidth / 2;
      const centerY = this.displayHeight / 2;

      // Giữ cho số lượng hạt luôn ổn định
      while (this.pixels.length < this.maxPixels) {
        this.pixels.push(this.generatePixel());
      }

      // Sắp xếp các hạt theo thuộc tính z để các hạt ở gần (z lớn) che lên các hạt ở xa (z nhỏ) đúng quy luật phối cảnh
      this.pixels.sort((a, b) => a.z - b.z);

      this.pixels = this.pixels.filter((p) => {
        // Tăng z để hạt lao về phía trước màn hình
        p.z += p.speed;

        // Nếu hạt đã vượt quá tầm nhìn (lao ra khỏi màn hình hoặc quá to), loại bỏ để sinh hạt mới
        if (p.z >= 2.5) return false;

        // Tính toán tọa độ 2D dựa trên chiều sâu 3D (Phép chiếu phối cảnh - Perspective Projection)
        // Khi z tăng, khoảng cách từ tâm (X, Y) sẽ mở rộng ra theo cấp số nhân
        const distance = p.z * p.z * (this.displayWidth * 0.4);
        const x = centerX + Math.cos(p.angle) * distance;
        const y = centerY + Math.sin(p.angle) * distance;

        // Kích thước hạt cũng tỷ lệ thuận với độ gần (z càng lớn khối pixel càng to)
        const currentSize = p.baseSize * p.z;

        // Hạt ở quá gần tâm (z nhỏ) hoặc quá rìa màn hình sẽ mờ dần (Fade in / Fade out)
        if (p.z < 0.6) {
          p.alpha = (p.z - 0.2) / 0.4; // Fade in khi vừa sinh ra từ tâm
        } else if (p.z > 1.8) {
          p.alpha = (2.5 - p.z) / 0.7; // Fade out khi chuẩn bị biến mất ở rìa
        } else {
          p.alpha = 1;
        }
        p.alpha = Math.max(0, Math.min(1, p.alpha)) * 0.45; // Giới hạn opacity tối đa 0.45 cho thanh thoát

        // Vẽ khối vuông phong cách Pixel
        this.ctx.fillStyle = `rgba(${p.color}, ${p.alpha.toFixed(2)})`;
        // Thay vì vẽ hình tròn, vẽ hình vuông (rect) căn giữa tọa độ để ra đúng chất pixel đặc
        this.ctx.fillRect(
          x - currentSize / 2,
          y - currentSize / 2,
          currentSize,
          currentSize,
        );

        // Giữ hạt nếu hạt vẫn nằm trong vùng hiển thị an toàn
        return (
          x >= -currentSize &&
          x <= this.displayWidth + currentSize &&
          y >= -currentSize &&
          y <= this.displayHeight + currentSize
        );
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
