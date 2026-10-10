<template>
  <TMFullTabWrapper
    v-model="isFullTab"
    :alwaysShowToolbar="true"
    fullScreenBgColor="#262626"
    class="photocraft-wrapper"
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
    <div class="tm-photocraft-container">
      <iframe
        ref="photocraftFrame"
        class="photocraft-frame"
        :src="iframeSrc"
        title="PhotoCraft"
        allow="fullscreen; clipboard-read; clipboard-write"
        allowfullscreen
        @load="onIframeLoad"
        @error="onIframeError"
      ></iframe>
      <div v-if="isLoading" class="photocraft-loading" @click.stop>
        <TMLoading />
        <p class="photocraft-loading-text">
          {{ $t("i18nCommon.photoCraft.loading") }}
        </p>
        <p v-if="loadFailed" class="photocraft-loading-error">
          {{ $t("i18nCommon.photoCraft.loadFailed") }}
        </p>
        <p v-else class="photocraft-loading-hint">
          {{ $t("i18nCommon.photoCraft.loadingHint") }}
        </p>
      </div>
    </div>
  </TMFullTabWrapper>
</template>

<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMLoading from "@/components/TMLoading.vue";
import TMFullTabWrapper from "@/components/TMFullTabWrapper.vue";

export default {
  name: "TMPhotoCraft",
  extends: TMToolBase,
  components: { TMLoading, TMFullTabWrapper },
  data() {
    return {
      // Tool này chỉ có 1 nhiệm vụ: tải wasm PhotoCraft về và load lên.
      // Build output (index.html + js glue + ~19MB wasm) được copy vào
      // assets-wasm-<version>/photocraft bởi vite.config.js (xem src_wasm/photocraft).
      iframeSrc: "",
      isLoading: true,
      loadFailed: false,
      isFullTab: false,
    };
  },
  mounted() {
    let me = this;
    const APP_VERSION = import.meta.env.PACKAGE_VERSION;
    me.iframeSrc = `/assets-wasm-${APP_VERSION}/photocraft/index.html`;
  },
  methods: {
    onIframeLoad() {
      // App đã tải xong (wasm được download + load bên trong iframe)
      this.isLoading = false;
      this.loadFailed = false;
    },
    onIframeError() {
      this.isLoading = false;
      this.loadFailed = true;
    },
    takeScreenshot() {
      const iframe = this.$refs.photocraftFrame;
      if (!iframe) return;
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const canvas = iframeDoc?.getElementById("photocraft_canvas");
        if (canvas && typeof canvas.toDataURL === "function") {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `photocraft-screenshot-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
          return;
        }
        if (typeof iframe.contentWindow?.html2canvas === "function") {
          iframe.contentWindow.html2canvas(iframeDoc?.body || document.body).then((c) => {
            const dataUrl = c.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `photocraft-screenshot-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
          });
          return;
        }
      } catch (e) {
        console.error("PhotoCraft screenshot failed", e);
      }
    },
  },
};
</script>

<style scoped>
.photocraft-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.tm-photocraft-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #262626;
}
.photocraft-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
.photocraft-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #262626;
  color: #b8b8b8;
  text-align: center;
}
.photocraft-loading-text {
  margin: 0;
  font-size: 14px;
}
.photocraft-loading-hint {
  margin: 0;
  font-size: 12px;
  color: #8c8c8c;
  max-width: 420px;
  line-height: 1.5;
}
.photocraft-loading-error {
  margin: 0;
  font-size: 13px;
  color: #e06c75;
  max-width: 420px;
  line-height: 1.5;
}
</style>