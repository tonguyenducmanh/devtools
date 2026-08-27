<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "./TDThemeEffectColors.js";

export default {
  name: "TDRetro3DGridEffect",
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
      speed: 0.05, // Tốc độ cuộn của lưới
      offset: 0, // Biến dịch chuyển theo thời gian
      horizonY: 0.45, // Vị trí đường chân trời (45% tính từ đỉnh màn hình)
      gridLines: 24, // Số đường dọc chia lưới phối cảnh

      // Hạt/Vệt sáng chạy dọc trên các đường lưới
      lightStreaks: [],
      maxStreaks: 15,
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
        this.lightStreaks = [];
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
      this.lightStreaks = [];
    },

    generateStreak() {
      // Chọn ngẫu nhiên một đường lưới dọc để làm làn đường xuất phát
      const lineIndex = Math.floor(Math.random() * (this.gridLines + 1));
      return {
        lineIndex: lineIndex,
        z: 0.05, // Xuất phát từ rất xa ở đường chân trời
        speed: Math.random() * 0.008 + 0.006,
        length: Math.random() * 0.05 + 0.03,
        size: Math.random() * 2 + 1,
      };
    },

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      const { isDark, rgb } = getThemeEffectColors();
      const mainColor = rgb.trail;
      const subColor = rgb.trail;

      const centerX = this.displayWidth / 2;
      const horizon = this.displayHeight * this.horizonY;
      const viewHeight = this.displayHeight - horizon;

      // Cập nhật biến offset tạo hiệu ứng chuyển động cuộn tiến về phía trước
      this.offset = (this.offset + this.speed) % 1;

      // 1. VẼ CÁC ĐƯỜNG NGANG PHỐI CẢNH (HOÀN TOÀN THEO ĐỘ SÂU 3D LOGARITHMIC)
      // Sử dụng hàm mũ để các đường lưới ở xa thì dày đặc, ở gần thì giãn rộng ra
      for (let i = 0; i < 18; i++) {
        // z chạy từ 0 đến 1 biểu thị khoảng cách từ chân trời đến đáy màn hình
        let z = (i + this.offset) / 18;

        // Công thức phối cảnh mũ giúp tạo chiều sâu mượt mà
        let currentY = horizon + Math.pow(z, 2.5) * viewHeight;

        // Tính toán độ mờ giảm dần khi ở quá xa gần đường chân trời
        let alpha = Math.pow(z, 1.5) * (isDark ? 0.12 : 0.18);

        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(${subColor}, ${alpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(0, currentY);
        this.ctx.lineTo(this.displayWidth, currentY);
        this.ctx.stroke();
      }

      // 2. VẼ CÁC ĐƯỜNG DỌC PHỐI CẢNH (HỘI TỤ VỀ TÂM CHÂN TRỜI)
      for (let i = 0; i <= this.gridLines; i++) {
        // Tính vị trí x phân bố đều ở cạnh đáy màn hình
        let targetX = (i / this.gridLines) * this.displayWidth;

        this.ctx.beginPath();

        // Tạo hiệu ứng chuyển màu mờ dần khi đường thẳng đi về điểm tụ ở chân trời
        let gradient = this.ctx.createLinearGradient(
          centerX,
          horizon,
          targetX,
          this.displayHeight,
        );
        gradient.addColorStop(0, `rgba(${subColor}, 0)`);
        gradient.addColorStop(0.2, `rgba(${subColor}, 0.05)`);
        gradient.addColorStop(1, `rgba(${subColor}, ${isDark ? 0.15 : 0.25})`);

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(centerX, horizon);
        this.ctx.lineTo(targetX, this.displayHeight);
        this.ctx.stroke();
      }

      // 3. VẼ CÁC VỆT SÁNG NĂNG LƯỢNG CHẠY TRÊN LƯỚI
      while (this.lightStreaks.length < this.maxStreaks) {
        this.lightStreaks.push(this.generateStreak());
      }

      this.lightStreaks = this.lightStreaks.filter((s) => {
        s.z += s.speed;
        if (s.z >= 1) return false; // Biến mất khi chạm đáy màn hình

        // Tính tọa độ Y của vệt sáng
        let yStart = horizon + Math.pow(s.z, 2.5) * viewHeight;
        let yEnd = horizon + Math.pow(s.z + s.length, 2.5) * viewHeight;

        // Tính tọa độ X của vệt sáng dựa trên đường dọc tương ứng
        let bottomX = (s.lineIndex / this.gridLines) * this.displayWidth;

        let xStart = centerX + (bottomX - centerX) * Math.pow(s.z, 2.5);
        let xEnd =
          centerX + (bottomX - centerX) * Math.pow(s.z + s.length, 2.5);

        let alpha = Math.sin(s.z * Math.PI) * (isDark ? 0.4 : 0.6);

        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(${mainColor}, ${alpha})`;
        this.ctx.lineWidth = s.size * s.z; // Vệt sáng phình to ra khi lao đến gần
        this.ctx.moveTo(xStart, yStart);
        this.ctx.lineTo(xEnd, yEnd);
        this.ctx.stroke();

        return true;
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
