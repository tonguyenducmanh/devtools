<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
export default {
  name: "TDDynamicBackgroundEffect",
  data() {
    return {
      canvas: null,
      ctx: null,
      particles: [],
      animationId: null,
      particleCount: 40,
      shapes: ["circle", "square", "triangle"],
      mouse: {
        x: null,
        y: null,
        radius: 150,
      },
      themeObserver: null,
      resizeObserver: null,
      // Kích thước hiển thị thực (CSS px), dùng thay window.innerWidth/Height
      displayWidth: 0,
      displayHeight: 0,
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
      this.themeObserver = new MutationObserver(() => {
        this.updateParticleColors();
      });
      this.themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-theme"],
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

    updateParticleColors() {
      this.particles.forEach((p) => {
        const { color, glow, shadowBlur } = this.getParticleStyle();
        p.color = color;
        p.glow = glow;
        p.shadowBlur = shadowBlur;
      });
    },

    initCanvas() {
      this.canvas = this.$refs.particleCanvas;
      this.ctx = this.canvas.getContext("2d");

      // Lấy kích thước parent ngay lần đầu
      const parent = this.canvas.parentElement;
      const w = parent ? parent.clientWidth : 300;
      const h = parent ? parent.clientHeight : 300;
      this.handleResize(w, h);

      this.animate();
    },

    /**
     * Resize canvas theo kích thước CSS của parent, có tính devicePixelRatio
     * để tránh méo trên màn Retina / HiDPI.
     */
    handleResize(cssWidth, cssHeight) {
      if (!cssWidth || !cssHeight) return;

      const dpr = window.devicePixelRatio || 1;

      // Lưu kích thước CSS để dùng trong logic (random vị trí, va chạm chuột…)
      this.displayWidth = cssWidth;
      this.displayHeight = cssHeight;

      // Thuộc tính canvas = pixel vật lý
      this.canvas.width = Math.round(cssWidth * dpr);
      this.canvas.height = Math.round(cssHeight * dpr);

      // CSS giữ kích thước hiển thị
      this.canvas.style.width = `${cssWidth}px`;
      this.canvas.style.height = `${cssHeight}px`;

      // Scale context để toàn bộ code vẫn tính theo CSS px
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.createParticles();
    },

    handleMouseMove(e) {
      // Chuyển toạ độ chuột sang toạ độ tương đối trong canvas
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    },

    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push(this.generateParticle());
      }
    },

    generateParticle() {
      const size = Math.random() * 20 + 5;
      const style = this.getParticleStyle();
      return {
        x: Math.random() * this.displayWidth,
        y: Math.random() * this.displayHeight,
        size,
        color: style.color,
        glow: style.glow,
        shadowBlur: style.shadowBlur,
        shape: this.shapes[Math.floor(Math.random() * this.shapes.length)],
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        opacity: Math.random() * 0.5 + 0.1,
        floatingOffset: Math.random() * Math.PI * 2,
      };
    },

    getParticleStyle() {
      const isDark = document.body.getAttribute("data-theme") === "dark";
      if (isDark) {
        const baseColor = "#33a16f";
        return {
          color: this.hexToRgba(baseColor, Math.random() * 0.3 + 0.4),
          glow: this.hexToRgba(baseColor, 0.5),
          shadowBlur: 8,
        };
      } else {
        const baseColor = "#000000";
        return {
          color: this.hexToRgba(baseColor, Math.random() * 0.2 + 0.3),
          glow: this.hexToRgba(baseColor, 0.3),
          shadowBlur: 3,
        };
      }
    },

    hexToRgba(hex, alpha) {
      let r = 0,
        g = 0,
        b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    drawParticle(p) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);

      this.ctx.shadowBlur = p.shadowBlur;
      this.ctx.shadowColor = p.glow;
      this.ctx.fillStyle = p.color;

      const isOutline = p.size > 15;
      if (isOutline) {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 1;
      }

      this.ctx.beginPath();
      if (p.shape === "circle") {
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      } else if (p.shape === "square") {
        this.ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === "triangle") {
        const h = (p.size * Math.sqrt(3)) / 2;
        this.ctx.moveTo(0, -h / 2);
        this.ctx.lineTo(-p.size / 2, h / 2);
        this.ctx.lineTo(p.size / 2, h / 2);
        this.ctx.closePath();
      }

      if (isOutline) {
        this.ctx.stroke();
      } else {
        this.ctx.fill();
      }

      this.ctx.restore();
    },

    updateParticle(p) {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Mouse repel (toạ độ chuột đã được tính tương đối với canvas)
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.mouse.radius) {
          const force = (this.mouse.radius - distance) / this.mouse.radius;
          p.x += (dx / distance) * force * 2;
          p.y += (dy / distance) * force * 2;
        }
      }

      // Floating effect
      p.y += Math.sin(Date.now() * 0.001 + p.floatingOffset) * 0.1;

      // Wrap around — dùng displayWidth/Height thay window
      if (p.x < -p.size) p.x = this.displayWidth + p.size;
      if (p.x > this.displayWidth + p.size) p.x = -p.size;
      if (p.y < -p.size) p.y = this.displayHeight + p.size;
      if (p.y > this.displayHeight + p.size) p.y = -p.size;
    },

    animate() {
      // clearRect dùng kích thước CSS (ctx đã scale theo dpr)
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      this.particles.forEach((p) => {
        this.updateParticle(p);
        this.drawParticle(p);
      });

      this.drawConnections();

      this.animationId = requestAnimationFrame(this.animate);
    },

    drawConnections() {
      const maxDistance = 150;
      const isDark = document.body.getAttribute("data-theme") === "dark";
      const baseColor = isDark ? "#33a16f" : "#000000";
      const lineColor = this.hexToRgba(baseColor, isDark ? 0.25 : 0.15);

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = lineColor;
            this.ctx.lineWidth = 0.5;
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        }
      }
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
