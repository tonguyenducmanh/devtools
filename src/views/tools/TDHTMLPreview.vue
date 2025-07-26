<template>
  <div class="flex flex-col container">
    
  </div>
</template>
<script>

export default {
  name: "TDHTMLPreview",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    async applyMock() {
      try {
      } catch (error) {
        console.error("Load mock formatter failed:", error);
      }
    },
  },
  data() {
    return {
    };
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>
