<template>
  <div class="loader"></div>
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
    return {};
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
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
