<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
import { getThemeEffectColors } from "../helpers/TDThemeEffectColors.js";

/*
 * Tái tạo trung thực hiệu ứng vanta.globe trên canvas 2D.
 * Bố cục + camera giữ nguyên hệ tọa độ thế giới từ source gốc:
 *   - Camera PerspectiveCamera(20, aspect, 0.01, 10000) tại (50,100,150), lookAt(-40,0,0)
 *   - Mặt phẳng lưới chấm (cont) offset (-50,-20,0): lưới 11x11, spacing 15, điểm uốn sóng sine
 *   - Các điểm gần (maxDistance=20) nối bằng line, alpha = clamp(2*(1-d/20),0,1)
 *   - Quả cầu wireframe (SphereGeometry(18,18,14) -> EdgesGeometry) tại (0,15,0), tilt rotX -0.25,
 *     tự xoay rotY += 0.002
 *   - Scatter (80 đoạn ngắn, bán kính 18-24) + funnel (trục + 4 cánh xoắn) quanh quả cầu
 * Màu lấy từ theme (--trail-cursor-color). Vẽ theo thuật toán painter (depth sort).
 */
const NEAR = 0.01;

export default {
  name: "TDSphereGlobeEffect",
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
      gridDots: [], // [{x,z}] toạ độ local trên mặt phẳng
      sphereSegs: [], // [{a:[x,y,z], b:[x,y,z]}] local quanh cont2
      scatterSegs: [],
      funnelSegs: [],
      // camera
      eye: [50, 100, 150],
      target: [-40, 0, 0],
      basis: null,
      f: 1 / Math.tan((20 * Math.PI) / 360),
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
      this.computeBasis();
      this.buildScene();
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
    // helpers vector
    sub(a, b) {
      return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    },
    norm(v) {
      const l = Math.hypot(v[0], v[1], v[2]);
      return l ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 0];
    },
    cross(a, b) {
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ];
    },
    dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    },
    rotY(v, a) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
    },
    rotX(v, a) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    },
    rotZ(v, a) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
    },
    computeBasis() {
      const zaxis = this.norm(this.sub(this.eye, this.target));
      const xaxis = this.norm(this.cross([0, 1, 0], zaxis));
      const yaxis = this.cross(zaxis, xaxis);
      this.basis = { xaxis, yaxis, zaxis };
    },
    // world -> {sx, sy, depth} or null if behind camera
    project(p) {
      const d = this.sub(p, this.eye);
      const bx = this.basis;
      const vx = this.dot(d, bx.xaxis);
      const vy = this.dot(d, bx.yaxis);
      const vz = this.dot(d, bx.zaxis);
      const ahead = -vz;
      if (ahead <= NEAR) return null;
      const f = this.f;
      const aspect = this.displayWidth / this.displayHeight || 1;
      const nx = (f / aspect) * (vx / ahead);
      const ny = f * (vy / ahead);
      return {
        sx: (nx * 0.5 + 0.5) * this.displayWidth,
        sy: (0.5 - ny * 0.5) * this.displayHeight,
        depth: vz,
      };
    },
    buildScene() {
      this.buildGrid();
      this.buildSphere();
      this.buildScatter();
      this.buildFunnel();
    },
    // 1. lưới chấm phẳng 11x11 tại cont(-50,-20,0), spacing 15
    buildGrid() {
      this.gridDots = [];
      const n = 10;
      for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= n; j++) {
          this.gridDots.push({
            x: (i - n / 2) * 15,
            z: (j - n / 2) * 15,
          });
        }
      }
    },
    // 2. sphere wireframe: lưới kinh/vĩ tuyến (18x14), bán kính 18, local quanh cont2
    buildSphere() {
      this.sphereSegs = [];
      const R = 18;
      const lon = 18;
      const lat = 14;
      for (let i = 0; i < lon; i++) {
        const phi = (i / lon) * Math.PI * 2;
        for (let j = 0; j < lat; j++) {
          const t1 = (j / lat) * Math.PI;
          const t2 = ((j + 1) / lat) * Math.PI;
          const a = [
            R * Math.cos(phi) * Math.sin(t1),
            R * Math.cos(t1),
            R * Math.sin(phi) * Math.sin(t1),
          ];
          const b = [
            R * Math.cos(phi) * Math.sin(t2),
            R * Math.cos(t2),
            R * Math.sin(phi) * Math.sin(t2),
          ];
          this.sphereSegs.push({ a, b });
        }
      }
      for (let j = 1; j < lat; j++) {
        const t = (j / lat) * Math.PI;
        for (let i = 0; i < lon; i++) {
          const p1 = (i / lon) * Math.PI * 2;
          const p2 = ((i + 1) / lon) * Math.PI * 2;
          const a = [
            R * Math.cos(p1) * Math.sin(t),
            R * Math.cos(t),
            R * Math.sin(p1) * Math.sin(t),
          ];
          const b = [
            R * Math.cos(p2) * Math.sin(t),
            R * Math.cos(t),
            R * Math.sin(p2) * Math.sin(t),
          ];
          this.sphereSegs.push({ a, b });
        }
      }
    },
    // 3. scatter: 80 đoạn ngắn trên vỏ cầu bán kính 18-24
    buildScatter() {
      this.scatterSegs = [];
      for (let i = 0; i < 80; i++) {
        const z = Math.random() * 2 - 1;
        const r = Math.sqrt(1 - z * z);
        const theta = Math.random() * Math.PI * 2;
        const f1 = 18 + Math.random() * 6;
        const f2 = f1 + 1 + Math.random() * 5;
        const ux = Math.cos(theta) * r;
        const uy = Math.sin(theta) * r;
        this.scatterSegs.push({
          a: [ux * f1, uy * f1, z * f1],
          b: [ux * f2, uy * f2, z * f2],
        });
      }
    },
    // 4. funnel: trục đứng + 4 cánh xoắn
    buildFunnel() {
      this.funnelSegs = [];
      const heights = [
        17.9, 12, 8, 5, 3, 2, 1.5, 1.1, 0.8, 0.6, 0.45, 0.3,
        0.2, 0.1, 0.05, 0.03, 0.02, 0.01,
      ];
      this.funnelSegs.push({ a: [0, 30, 0], b: [0, -30, 0] });
      const num = 4;
      for (let i = 0; i < num; i++) {
        const x = 0.15 * Math.cos((i / num) * Math.PI * 2);
        const z = 0.15 * Math.sin((i / num) * Math.PI * 2);
        for (let j = 0; j < heights.length; j++) {
          const h = heights[j];
          const r = 6 * (j + 1);
          this.funnelSegs.push({ a: [x * r, h, z * r], b: [x * r, -h, z * r] });
        }
      }
    },
    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
      const { rgb } = getThemeEffectColors();
      const [r, g, b] = rgb.trail.split(",").map(Number);
      const c1 = `rgba(${rgb.trail},`;
      const c2 = `rgba(${Math.round(r + (255 - r) * 0.55)},${Math.round(
        g + (255 - g) * 0.55
      )},${Math.round(b + (255 - b) * 0.55)},`;

      const t = this.time++;
      const CONT = [-50, -20, 0];
      const CONT2 = [0, 15, 0];
      const TILT = -0.25;

      const items = []; // {type, ...}

      // ---- Lưới chấm ----
      const gridWorld = [];
      for (const gd of this.gridDots) {
        const ly =
          2 *
          Math.sin(gd.x / 10 + t * 0.01 + (gd.z / 10) * 0.5);
        gridWorld.push([gd.x + CONT[0], ly + CONT[1], gd.z + CONT[2]]);
      }
      // nối các điểm gần nhau
      const maxD = 20;
      for (let i = 0; i < gridWorld.length; i++) {
        const a = gridWorld[i];
        for (let j = i + 1; j < gridWorld.length; j++) {
          const b = gridWorld[j];
          const dx = a[0] - b[0];
          const dy = a[1] - b[1];
          const dz = a[2] - b[2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < maxD) {
            let alpha = (1 - d / maxD) * 2;
            if (alpha > 1) alpha = 1;
            if (alpha < 0) alpha = 0;
            items.push({ type: "line", pa: a, pb: b, color: c1, alpha });
          }
        }
      }
      // chấm
      for (const p of gridWorld) {
        items.push({ type: "dot", p, color: c1, alpha: 0.85 });
      }

      // ---- Sphere wireframe ----
      const sAngle = t * 0.002;
      for (const seg of this.sphereSegs) {
        const ra = this.rotY(seg.a, sAngle);
        const rb = this.rotY(seg.b, sAngle);
        const wa = this.add2(this.rotX(ra, TILT), CONT2);
        const wb = this.add2(this.rotX(rb, TILT), CONT2);
        items.push({ type: "line", pa: wa, pb: wb, color: c1, alpha: 0.85 });
      }

      // ---- Scatter & funnel ----
      const rz = t * 0.002;
      const rx = t * 0.0008;
      const ry = t * 0.0005;
      const fy = -t * 0.004;
      for (const seg of this.scatterSegs) {
        const ta = this.rotZ(seg.a, rz);
        const tb = this.rotZ(seg.b, rz);
        const t2a = this.rotX(ta, rx);
        const t2b = this.rotX(tb, rx);
        const t3a = this.rotY(t2a, ry);
        const t3b = this.rotY(t2b, ry);
        const wa = this.add2(this.rotX(t3a, TILT), CONT2);
        const wb = this.add2(this.rotX(t3b, TILT), CONT2);
        items.push({ type: "line", pa: wa, pb: wb, color: c2, alpha: 0.8 });
      }
      for (const seg of this.funnelSegs) {
        const ra = this.rotY(seg.a, fy);
        const rb = this.rotY(seg.b, fy);
        const wa = this.add2(this.rotX(ra, TILT), CONT2);
        const wb = this.add2(this.rotX(rb, TILT), CONT2);
        items.push({ type: "line", pa: wa, pb: wb, color: c2, alpha: 0.7 });
      }

      // ---- Project + depth sort (painter) ----
      const pr = [];
      for (const it of items) {
        let pa, pb;
        if (it.type === "dot") {
          const p = this.project(it.p);
          if (!p) continue;
          pr.push({ it, pa: p });
          continue;
        } else {
          pa = this.project(it.pa);
          pb = this.project(it.pb);
          if (!pa || !pb) continue;
          pr.push({ it, pa, pb, depth: (pa.depth + pb.depth) / 2 });
        }
      }
      // for dots depth already = p.depth; unify
      pr.forEach((x) => {
        if (x.pa && !x.pb) x.depth = x.pa.depth;
      });
      pr.sort((a, b) => b.depth - a.depth);

      // draw farthest first
      for (const x of pr) {
        const it = x.it;
        if (it.type === "dot") {
          const p = x.pa;
          const size = 1.1;
          this.ctx.fillStyle = `${it.color}${it.alpha})`;
          this.ctx.beginPath();
          this.ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          this.ctx.strokeStyle = `${it.color}${it.alpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(x.pa.sx, x.pa.sy);
          this.ctx.lineTo(x.pb.sx, x.pb.sy);
          this.ctx.stroke();
        }
      }

      this.animationId = requestAnimationFrame(this.animate);
    },
    add2(v, off) {
      return [v[0] + off[0], v[1] + off[1], v[2] + off[2]];
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
