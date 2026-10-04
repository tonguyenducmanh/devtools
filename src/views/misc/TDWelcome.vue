<template>
  <div class="flex td-welcome">
    <div class="flex flex-col wrap-container">
      <div class="container">
        <transition v-if="isShowLoading" name="td-fade-loading">
          <TDLoading />
        </transition>
        <div v-else class="main-line-title">{{ welcomeTitle }}</div>
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
  },
  created() { },
  methods: {
    async toggleSidebar() {
      let me = this;
      await me.updateConfigLayout();
    },
    async processWhenMounted() {
      let me = this;
      me.loadingType =
        await me.$tdUtility.getUserSettings("currentLoadingType");
    },
  },
  mounted() {
    this.processWhenMounted();
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
</style>