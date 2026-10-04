<template>
  <div class="flex flex-col td-loading">
    <div v-if="loadingType == $tdEnum.LoadingType.Meme" class="meme"></div>
    <div
      v-else-if="loadingType == $tdEnum.LoadingType.Avatar"
      class="avatar"
    ></div>
    <div
      v-else-if="loadingType == $tdEnum.LoadingType.Normal"
      class="loader"
    ></div>
  </div>
</template>

<script>
export default {
  name: "TDLoading",
  created() {},
  mounted() {},
  emits: [],
  beforeUnmount() {},
  props: {},
  data() {
    return {
      loadingType: this.$tdEnum.LoadingType.Normal,
    };
  },
  async mounted() {
    this.loadingType =
      await this.$tdUtility.getUserSettings("currentLoadingType");
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
.td-loading {
  width: 100%;
  height: fit-content;
  align-items: center;
  justify-content: center;
  padding: var(--padding);
  z-index: 1;
}

/* Meme và avatar đều là ảnh tĩnh nên dùng chung khung 500px để 2 loại hiển
thị đều nhau, chỉ khác tỉ lệ ảnh và bo góc */
.meme,
.avatar {
  width: 100%;
  height: fit-content;
  max-width: 500px;
  max-height: 500px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  overflow: hidden;
}

.meme {
  aspect-ratio: 249 / 140;
  background-image: url("@/assets/dependency.jpg");
}

.avatar {
  aspect-ratio: 3 / 4;
  border-radius: var(--border-radius);
  background-image: url("@/assets/loading_avatar.jpg");
}

.loader {
  width: 20px;
  aspect-ratio: 1;
  background: var(--btn-color);
  box-shadow: 0 0 60px 15px var(--btn-color);
  transform: translate(-80px);
  clip-path: inset(0);
  animation:
    l4-1 0.5s ease-in-out infinite alternate,
    l4-2 1s ease-in-out infinite;
}
@keyframes l4-1 {
  100% {
    transform: translateX(80px);
  }
}
@keyframes l4-2 {
  33% {
    clip-path: inset(0 0 0 -100px);
  }
  50% {
    clip-path: inset(0 0 0 0);
  }
  83% {
    clip-path: inset(0 -100px 0 0);
  }
}
</style>
