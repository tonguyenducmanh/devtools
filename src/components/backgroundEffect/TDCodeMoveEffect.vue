<template>
  <canvas ref="particleCanvas" class="particle-background"></canvas>
</template>

<script>
export default {
  name: "TDCodeMoveEffect",
  data() {
    return {
      // ── Config ──
      snippets: [
        // Vue 3 Options API
        "data() { return {}",
        "methods: {",
        "mounted() {",
        "computed: {",
        "watch: { val(",
        'emits: ["update"]',
        "components: {",
        "props: { id: Number",
        "beforeUnmount() {",
        '$emit("change")',
        "this.$router.push(",
        "this.$store.commit(",
        'v-model="form"',
        'v-for="i in list"',
        ':class="{ active"',
        '@click.stop="fn"',
        'v-if="isReady"',
        '<slot name="hd">',
        // JavaScript
        "const res = await",
        "Promise.all([",
        "Array.from({",
        ".filter(x => x)",
        ".map(x => ({",
        "Object.keys(obj)",
        "try { await fn(",
        "catch (err) {",
        "JSON.parse(str)",
        "export default {",
        "import { ref } from",
        "localStorage.set(",
        "setTimeout(() => {",
        "console.error(",
        '?.split(".")',
        // C#
        "public async Task",
        "await Task.WhenAll(",
        "var result = new",
        "string? name = null",
        "List<T> items = []",
        "record User(int Id",
        "if (obj is null)",
        "foreach (var x in",
        "return Ok(data)",
        '[HttpGet("{id}")]',
        "services.AddScoped(",
        "builder.Build()",
        "Console.WriteLine(",
        ".Select(x => x.Id)",
        "throw new Exception(",
        // Go
        "func main() {",
        "go func() {",
        "defer wg.Done()",
        "if err != nil {",
        "var wg sync.WaitGroup",
        "ch := make(chan",
        "ctx, cancel :=",
        "log.Fatal(err)",
        "http.HandleFunc(",
        "json.Unmarshal(",
        "type User struct {",
        "interface{}",
        "select { case v :=",
        ":= range items {",
        "fmt.Println(",
      ],
      maxNodes: 14, // số snippet hiển thị cùng lúc tối đa
      spawnMs: 700, // ms giữa mỗi lần spawn snippet mới
      fontSize: 11, // px
      minLife: 2.8, // giây
      maxLife: 5.0,
      // ── Runtime ──
      canvas: null,
      ctx: null,
      animationId: null,
      spawnTimer: null,
      themeObserver: null,
      resizeObserver: null,
      displayWidth: 0,
      displayHeight: 0,
      nodes: [],
      usedSlots: [],
      slotCols: 0,
      slotRows: 0,
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
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    cancelAnimationFrame(this.animationId);
  },
  methods: {
    initThemeObserver() {
      this.themeObserver = new MutationObserver(() => {});
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

    initCanvas() {
      this.canvas = this.$refs.particleCanvas;
      this.ctx = this.canvas.getContext("2d");
      const parent = this.canvas.parentElement;
      const w = parent ? parent.clientWidth : 300;
      const h = parent ? parent.clientHeight : 300;
      this.handleResize(w, h);
      for (let i = 0; i < 5; i++) this.spawnNode();
      this.spawnTimer = setInterval(() => this.spawnNode(), this.spawnMs);
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
      this.buildSlots();
      this.nodes = [];
    },

    buildSlots() {
      const cellW = 160;
      const cellH = 40;
      this.slotCols = Math.floor(this.displayWidth / cellW) || 1;
      this.slotRows = Math.floor(this.displayHeight / cellH) || 1;
      this.usedSlots = Array(this.slotCols * this.slotRows).fill(false);
    },

    getFreeSlot() {
      const free = [];
      this.usedSlots.forEach((used, i) => {
        if (!used) free.push(i);
      });
      if (!free.length) return null;
      return free[Math.floor(Math.random() * free.length)];
    },

    slotToXY(slotIdx) {
      const cellW = this.displayWidth / this.slotCols;
      const cellH = this.displayHeight / this.slotRows;
      const col = slotIdx % this.slotCols;
      const row = Math.floor(slotIdx / this.slotCols);
      const x = col * cellW + Math.random() * (cellW * 0.5) + cellW * 0.1;
      const y = row * cellH + Math.random() * (cellH * 0.4) + cellH * 0.3;
      return { x, y };
    },

    spawnNode() {
      if (this.nodes.length >= this.maxNodes) return;
      const slotIdx = this.getFreeSlot();
      if (slotIdx === null) return;

      this.usedSlots[slotIdx] = true;
      const { x, y } = this.slotToXY(slotIdx);
      const text =
        this.snippets[Math.floor(Math.random() * this.snippets.length)];
      const life = this.minLife + Math.random() * (this.maxLife - this.minLife);

      this.nodes.push({
        x,
        y,
        text,
        slotIdx,
        born: performance.now() / 1000,
        maxLife: life,
        typed: 0,
        typeSpeed: text.length / (life * 0.35),
      });
    },

    getColor() {
      const isDark = document.body.getAttribute("data-theme") === "dark";
      return isDark ? "221,250,66" : "30,30,30";
    },

    animate() {
      const ctx = this.ctx;
      const W = this.displayWidth;
      const H = this.displayHeight;
      const now = performance.now() / 1000;
      const rgb = this.getColor();

      ctx.clearRect(0, 0, W, H);
      ctx.font = `${this.fontSize}px "Courier New", monospace`;
      ctx.textBaseline = "top";

      this.nodes = this.nodes.filter((n) => {
        const age = now - n.born;
        if (age >= n.maxLife) {
          this.usedSlots[n.slotIdx] = false;
          return false;
        }

        n.typed = Math.min(n.text.length, n.typed + n.typeSpeed * (1 / 60));
        const visibleText = n.text.slice(0, Math.floor(n.typed));

        const p = age / n.maxLife;
        let alpha;
        if (p < 0.12) alpha = p / 0.12;
        else if (p < 0.75) alpha = 1;
        else alpha = (1 - p) / 0.25;
        alpha = Math.max(0, Math.min(1, alpha)) * 0.55;

        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.fillText(visibleText, n.x, n.y);

        if (Math.floor(n.typed) < n.text.length) {
          const cursorAlpha = (Math.sin(now * 8) * 0.5 + 0.5) * alpha * 1.4;
          ctx.fillStyle = `rgba(${rgb},${Math.min(1, cursorAlpha).toFixed(3)})`;
          const cursorX = n.x + ctx.measureText(visibleText).width + 1;
          ctx.fillRect(cursorX, n.y, 1, this.fontSize);
        }

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
