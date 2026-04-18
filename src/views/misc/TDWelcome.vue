<template>
  <div class="flex td-welcome">
    <TDDynamicBackgroundEffect />
    <div class="flex flex-col wrap-container">
      <div class="container">
        <div class="main-line-title">Dev Tools</div>
        <p class="description">
          {{ displayText }}<span class="cursor">|</span>
        </p>
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
import TDDynamicBackgroundEffect from "@/components/TDDynamicBackgroundEffect.vue";
import TDLayoutConfigMixin from "@/mixins/TDLayoutConfigMixin.js";

export default {
  name: "TDWelcome",
  mixins: [TDLayoutConfigMixin],
  components: { TDWelcomeHelp, TDSubSidebar, TDDynamicBackgroundEffect },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.WelcomeLayout,
      languageList: Object.keys(this.$tdEnum.language).sort(),
      displayText: "",
      currentConfigLayout: {
        isShowSidebar: true,
      },
    };
  },
  created() {},
  methods: {
    async toggleSidebar() {
      let me = this;
      await me.updateConfigLayout();
    },
    // Logic tạo hiệu ứng gõ chữ
    async runTypingEffect() {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // 1. Gõ chữ sai "Wherever"
      const typoText = "Wherever";
      for (let i = 0; i <= typoText.length; i++) {
        this.displayText = typoText.slice(0, i);
        await sleep(150);
      }

      await sleep(800); // Tạm dừng để người dùng thấy lỗi

      // 2. Xóa ngược lại 6 ký tự (xóa "erver", còn lại "Wh")
      for (let i = 0; i < 6; i++) {
        this.displayText = this.displayText.slice(0, -1);
        await sleep(100);
      }

      await sleep(300); // Khựng lại một chút trước khi gõ đúng

      // 3. Gõ phần còn lại của "Whatever you code, code with all your heart"
      // Bắt đầu gõ từ ký tự thứ 3 của fullText (chữ 'a' trong 'Whatever')
      const fullText = "Whatever you code, code with all your heart";
      for (let i = this.displayText.length; i < fullText.length; i++) {
        this.displayText += fullText.charAt(i);
        await sleep(80);
      }
    },
  },
  mounted() {
    // Chạy hiệu ứng khi component vừa hiển thị
    this.runTypingEffect();
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
  color: var(--text-color-light);
  text-align: center;
  width: 95%;
  margin: var(--padding);
}
body[data-theme="dark"] .agreement {
  color: var(--text-color-dark);
}
.language-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 30px;
}

.language-btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--btn-secondary-color);
  color: var(--btn-secondary-text-color);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: var(--btn-secondary-focus-color);
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--btn-color);
    background-color: var(--btn-color);
    color: white;
  }
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
body[data-theme="dark"] {
  .main-line-title {
    color: #33a16f;
  }
  .main-line-title::before {
    background-color: var(--bg-layer-color);
    mix-blend-mode: lighten;
  }
}

.description {
  font-family: var(--straight-font);
  font-size: 2cqw;
  min-height: 50px;
}

/* Thêm style cho con trỏ nhấp nháy */
.cursor {
  display: inline-block;
  margin-left: 5px;
  color: var(--btn-color);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  from,
  to {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

body[data-theme="dark"] {
  .main-line-title {
    color: #33a16f;
  }
  .agreement {
    color: var(--text-color-dark);
  }
}
</style>
