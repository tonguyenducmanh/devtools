<template>
  <div class="container">
    <div class="title">{{ $t("i18nCommon.uuidGenerator.title") }}</div>
    <div class="flex flex-col td-uuid-generator">
      <TDInput
        :label="$t('i18nCommon.uuidGenerator.input.result')"
        type="text"
        :readOnly="true"
        v-model="uuidv4Result"
      />
      <div class="flex">
        <TDButton
          @click="handleGenerate"
          :label="$t('i18nCommon.uuidGenerator.buttons.generate')"
        ></TDButton>
        <TDButton
          @click="haddleCopyEvent"
          :label="$t('i18nCommon.uuidGenerator.buttons.copy')"
        ></TDButton>
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

  box-shadow: none;
}
.td-uuid-generator {
  width: 100%;
}
</style>
