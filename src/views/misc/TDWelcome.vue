<template>
  <div class="flex td-welcome">
    <div class="flex flex-col wrap-container">
      <div class="container">
        <!-- Đã chọn hình nền (xem $tdEnum.welcomeBackgroundList) thì chỉ hiện ảnh
nền phủ kín màn welcome, không hiện text author -->
        <div
          v-if="isShowBackground"
          class="welcome-background"
          :class="`welcome-background--${welcomeBackground}`"
        ></div>
        <div v-else class="main-line-title">{{ welcomeTitle }}</div>
        <TDDynamicBackgroundEffect />
      </div>
    </div>
    <TDSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
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
import eventBus from "@/common/event/TDEventBus.js";
import { TDEnumEventBus } from "@/common/event/TDEnumEventBus.js";

export default {
  name: "TDWelcome",
  mixins: [TDLayoutConfigMixin],
  components: { TDWelcomeHelp, TDSubSidebar, TDDynamicBackgroundEffect },
  data() {
    return {
      welcomeBackground: this.$tdEnum.welcomeBackground.Normal,
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
    /**
     * normal là không chọn ảnh nên không hiện lớp nền
     */
    isShowBackground() {
      let me = this;
      return me.welcomeBackground != me.$tdEnum.welcomeBackground.Normal;
    },
  },
  created() {
    // Đổi hình nền từ menu giao diện trên header thì áp dụng tức thì, không
    // cần khởi động lại app như các thiết lập khác
    this.unsubscribeBackground = eventBus.on(
      TDEnumEventBus.welcomeBackgroundChanged,
      (value) => {
        this.welcomeBackground = value;
      },
    );
  },
  methods: {
    async toggleSidebar() {
      let me = this;
      await me.updateConfigLayout();
    },
    async processWhenMounted() {
      let me = this;
      me.welcomeBackground =
        await me.$tdUtility.getUserSettings("welcomeBackground");
    },
  },
  mounted() {
    this.processWhenMounted();
  },
  beforeUnmount() {
    this.unsubscribeBackground?.();
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

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--padding);
  width: 100%;
  height: 100%;
  flex: 1;
  /* làm mốc định vị cho lớp nền bên trong */
  position: relative;
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

/* Hình nền màn welcome: inset tạo khoảng cách (margin) với mép màn hình.
contain để ảnh co vừa khung mà vẫn giữ nguyên tỷ lệ gốc (không méo, không
cắt), z-index 0 để nằm dưới text author và dưới TDDynamicBackgroundEffect */
.welcome-background {
  position: absolute;
  inset: var(--padding-large);
  z-index: 0;
  border-radius: var(--border-radius);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  pointer-events: none;
}

.welcome-background--meme {
  background-image: url("@/assets/dependency.jpg");
}

.welcome-background--avatar {
  background-image: url("@/assets/loading_avatar.jpg");
}
</style>
