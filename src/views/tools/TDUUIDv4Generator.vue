<template>
  <div class="container flex flex-col">
    <div class="title">💖 UUIDv4 generator tool!</div>
    <div class="flex flex-col td-uuid-generator">
      <TDInput
        label="Result"
        type="text"
        :readOnly="true"
        v-model="uuidv4Result"
      />
      <div class="flex">
        <TDButton @click="handleGenerate" label="Generate"></TDButton>
        <TDButton @click="haddleCopyEvent" label="Copy"></TDButton>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "TDUUIDv4Generator",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    handleGenerate() {
      let me = this;
      me.uuidv4Result = me.$tdUtility.newGuid();
    },
    haddleCopyEvent() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.uuidv4Result);
    },
  },
  data() {
    return {
      uuidv4Result: null,
    };
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;
  min-height: 100vh;
  box-shadow: none;
}
.td-uuid-generator{
  width: 100%;
}
</style>
