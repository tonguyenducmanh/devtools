<template>
  <div class="flex td-welcome">
    <div class="flex flex-col wrap-container">
      <div class="container">
        <transition v-if="isShowLoading" name="td-fade-loading">
          <TDLoading />
        </transition>
        <div v-else class="main-line-title">{{ welcomeTitle }}</div>
        <transition name="td-tip" mode="out-in">
          <p :key="tipIndex" class="no-select tip-text" v-tooltip="$t('i18nTip.nextTip')" @click="nextTip">
            {{ currentTip }}
          </p>
        </transition>
        <TDDynamicBackgroundEffect />
      </div>
      <p class="agreement">{{ $t("i18nCommon.agreement") }}</p>
    </div>
    <TDSubSidebar v-model="currentConfigLayout.isShowSidebar" @toggleSidebar="toggleSidebar">
      <template v-slot:main>
        <TDWelcomeHelp />
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDWelcomeHelp from "@/views/helps/TDWelcomeHelp.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDDynamicBackgroundEffect from "@/views/backgroundEffect/TDDynamicBackgroundEffect.vue";
import TDLayoutConfigMixin from "@/mixins/TDLayoutConfigMixin.js";
import TDLoading from "../../components/TDLoading.vue";

export default {
  name: "TDWelcome",
  mixins: [TDLayoutConfigMixin],
  components: { TDWelcomeHelp, TDSubSidebar, TDDynamicBackgroundEffect },
  data() {
    return {
      loadingType: this.$tdEnum.LoadingType.Normal,
      keyCacheLayout: this.$tdEnum.cacheConfig.WelcomeLayout,
      languageList: Object.keys(this.$tdEnum.language).sort(),
      tipIndex: 0,
      tipTimer: null,
      currentConfigLayout: {
        isShowSidebar: false,
      },
    };
  },
  computed: {
    /**
     * lấy ra title để hiển thị ở màn welcome
     */
    welcomeTitle() {
      let me = this;
      return me.$tdUtility.getAuthorApp() ?? me.$tdUtility.defaultTitleApp();
    },
    isShowLoading() {
      return this.loadingType != this.$tdEnum.LoadingType.Normal;
    },
    /**
     * danh sách tip hướng dẫn sử dụng app
     */
    tipsList() {
      return this.$t("i18nTip.list") ?? [];
    },
    /**
     * tip đang hiển thị
     */
    currentTip() {
      return this.tipsList[this.tipIndex] ?? "";
    },
  },
  created() { },
  methods: {
    async toggleSidebar() {
      let me = this;
      await me.updateConfigLayout();
    },
    /**
     * tự động chuyển sang tip tiếp theo
     */
    autoNextTip() {
      let len = this.tipsList.length;
      if (!len) return;
      this.tipIndex = (this.tipIndex + 1) % len;
    },
    /**
     * bấm vào tip: clear interval cũ, chuyển tip và tạo interval mới để reset thời gian tự chuyển
     */
    nextTip() {
      this.autoNextTip();
      this.startTipTimer();
    },
    /**
     * clear interval cũ và tạo interval mới
     */
    startTipTimer() {
      clearInterval(this.tipTimer);
      this.tipTimer = setInterval(this.autoNextTip, 10000);
    },
    async processWhenMounted() {
      let me = this;
      me.loadingType =
        await me.$tdUtility.getUserSettings("currentLoadingType");
    },
  },
  mounted() {
    this.processWhenMounted();
    this.startTipTimer();
  },
  beforeUnmount() {
    clearInterval(this.tipTimer);
  },
};
</script>

<style lang="scss" scoped>
.td-welcome {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Giữ nguyên các style cũ của bạn */
.wrap-container {
  height: 100%;
  flex: 1;
}

.agreement {
  // color: var(--text-color-light);
  text-align: center;
  width: 95%;
  margin: var(--padding);
}


.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--padding);
  width: 100%;
  height: 100%;
  flex: 1;
}

.main-line-title {
  font-size: 10cqw;
  font-family: var(--straight-font);
  font-weight: 600;
  position: relative;
  opacity: 1;
  visibility: visible;
  z-index: 1;
}

.tip-text {
  // font-size: var(--font-size-medium);
  padding: var(--padding) calc(var(--padding) * 2);
  max-width: 60%;
  height: 2.5em;
  text-align: center;
  border-radius: var(--border-radius);
  cursor: pointer;

}

/* transition chuyển tip kiểu loading game Zelda Breath of the Wild */
.td-tip-enter-active {
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

.td-tip-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.td-tip-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.td-tip-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>