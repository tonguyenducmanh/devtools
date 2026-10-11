<template>
  <TMFullTabWrapper
    v-model="isFullTab"
    :alwaysShowToolbar="true"
    class="tm-craft-app-wrapper"
  >
    <template #toolbar-left>
      <div
        v-tooltip="$t('i18nCommon.remoteDesktop.screenshot')"
        class="flex toolbar-btn"
        @click="takeScreenshot"
      >
        <span class="tm-icon tm-camera-icon"></span>
      </div>
    </template>
    <div class="tm-craft-app-container">
      <!--
        App craft tự tìm canvas khi khởi động rồi giữ thẳng tham chiếu element,
        nên canvas nằm nguyên trong DOM của tab này và không bị reload khi đổi
        tab (giống cách Remote Desktop giữ canvas + phiên RDP).
      -->
      <canvas ref="craftCanvas" class="tm-craft-app-canvas"></canvas>
      <div v-if="isLoading" class="tm-craft-app-loading" @click.stop>
        <TMLoading />
      </div>
    </div>
  </TMFullTabWrapper>
</template>

<script>
import TMLoading from "@/components/TMLoading.vue";
import TMFullTabWrapper from "@/components/TMFullTabWrapper.vue";
import {
  registerCraftCanvas,
  unregisterCraftCanvas,
  nextCraftInstanceKey,
} from "@/common/TMCraftCanvas.js";

export default {
  name: "TMCraftApp",
  components: { TMLoading, TMFullTabWrapper },
  props: {
    // Tên thư mục trong src_wasm/pkg và assets-wasm (photocraft/vectorcraft/...)
    appKey: {
      type: String,
      required: true,
    },
    // Tên hiển thị, dùng cho tên file khi chụp màn hình
    appName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isLoading: true,
      isFullTab: false,
      // khoá riêng cho instance này, dùng làm query của URL glue
      instanceKey: nextCraftInstanceKey(this.appKey),
    };
  },
  computed: {
    baseUrl() {
      return `/assets-wasm-${import.meta.env.PACKAGE_VERSION}/${this.appKey}`;
    },
    // Id cố định mà Rust tra lúc khởi động — chỉ dùng làm khoá trong shim,
    // canvas thật không cần (và không được) mang id này.
    canvasId() {
      return `${this.appKey}_canvas`;
    },
  },
  mounted() {
    this.registerCanvas();
    this.bootCraftApp();
  },
  // KeepAlive: quay lại tab này thì canvas của tab này lại là canvas "đang active"
  activated() {
    this.registerCanvas();
  },
  beforeUnmount() {
      unregisterCraftCanvas(this.canvasId, this.$refs.craftCanvas);
    },
  methods: {
    registerCanvas() {
      registerCraftCanvas(this.canvasId, this.$refs.craftCanvas);
    },
    async bootCraftApp() {
      try {
        // 1. manifest: tên file có content-hash nên đổi theo từng build
        const manifest = await (await fetch(`${this.baseUrl}/manifest.json`)).json();

        // 2. wasm luôn lưu dạng gzip (xem scripts/wasm_dist_common.sh) để nằm dưới
        //    giới hạn 25 MiB/file của Cloudflare → tự giải nén ở đây.
        const gzResp = await fetch(`${this.baseUrl}/${manifest.wasm}`);
        if (!gzResp.ok) {
          throw new Error(`Fetching the wasm failed: ${gzResp.status}`);
        }
        const wasmBytes = await new Response(
          gzResp.body.pipeThrough(new DecompressionStream("gzip")),
        ).arrayBuffer();

        // 3. Nạp glue (wasm-bindgen ES module). Query theo instanceKey để mỗi tab có
        //    instance wasm riêng — xem nextCraftInstanceKey.
        const glueUrl = `${this.baseUrl}/${manifest.glue}?i=${this.instanceKey}`;
        const mod = await import(/* @vite-ignore */ glueUrl);

        // init() gọi wasm.__wbindgen_start() → Rust main() tra canvas (qua shim
        // getElementById) rồi tự vẽ.
        await mod.default({ module_or_path: wasmBytes });
        this.isLoading = false;
      } catch (e) {
        console.error(`${this.appName} failed to start`, e);
        this.isLoading = false;
      }
    },
    takeScreenshot() {
      const canvas = this.$refs.craftCanvas;
      if (!canvas || typeof canvas.toDataURL !== "function") return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${this.appKey}-screenshot-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (e) {
        // Canvas WebGPU có thể không đọc lại được; không phải lỗi nghiêm trọng
        console.error(`${this.appName} screenshot failed`, e);
      }
    },
  },
};
</script>

<style scoped>
.tm-craft-app-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.tm-craft-app-container {
  width: 100%;
  height: 100%;
  position: relative;
}
.tm-craft-app-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
}
.tm-craft-app-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>