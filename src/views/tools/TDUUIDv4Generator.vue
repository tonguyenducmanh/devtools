<template>
  <div class="container">
    <!-- <div class="title">{{ $t("i18nCommon.uuidGenerator.title") }}</div> -->
    <div class="flex flex-col td-uuid-generator">
      <div class="flex flex-col td-uuid-area">
        <template v-for="item in uuidv4Result">
          <div class="td-uuid-item" @click="haddleCopyEvent(item)">
            {{ item }}
          </div>
        </template>
      </div>
      <TDButton
        @click="handleGenerate"
        :label="$t('i18nCommon.uuidGenerator.buttons.generate')"
      ></TDButton>
    </div>
  </div>
</template>
<script>
export default {
  name: "TDUUIDv4Generator",
  created() {
    let me = this;
    me.handleGenerate();
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    handleGenerate() {
      let me = this;
      me.uuidv4Result = [];
      for (let i = 0; i < me.timeGen; i++) {
        me.uuidv4Result.push(me.$tdUtility.newGuid());
      }
    },
    haddleCopyEvent(data) {
      let me = this;
      me.$tdUtility.copyToClipboard(data);
    },
  },
  data() {
    return {
      uuidv4Result: [],
      timeGen: 10,
    };
  },
};
</script>
<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;

  box-shadow: none;
}
.td-uuid-generator {
  width: 100%;
  height: 100%;
  .td-uuid-area {
    flex: 1;
    width: 100%;
    overflow: auto;
    gap: var(--padding);
    .td-uuid-item {
      cursor: pointer;
      padding: var(--padding);
      background-color: var(--bg-layer-color);
      border-radius: var(--border-radius);
    }
    .td-uuid-item:hover {
      background-color: var(--focus-color);
      color: white;
    }
  }
}
</style>
