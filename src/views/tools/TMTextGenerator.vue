<template>
  <div class="flex tm-text-generator">
    <div class="flex flex-col tm-text-gen-container">
      <div class="tm-text-gen-result">
        <TMTextEditor
          :placeHolder="$t('i18nCommon.textgenerator.resultPlaceholder')"
          v-model="randomTextGenerated"
          :readOnly="true"
        ></TMTextEditor>
      </div>
      <div class="flex build-area">
        <TMComboBox
          :width="120"
          :noMargin="true"
          v-model="genType"
          :options="genTypeOption"
          :isDropTop="true"
        />
        <span class="title-input-config">{{ generateTitle }}</span>
        <div>
          <TMInput
            v-model="exampleCount"
            :inputType="'number'"
            :placeHolder="10"
            :noMargin="true"
          />
        </div>
        <TMButton
          :noMargin="true"
          :readOnly="!exampleCount"
          @click="generate"
          :label="$t('i18nCommon.textgenerator.generate')"
        ></TMButton>
        <TMButton
          @click="copyResult"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.copy')"
        ></TMButton>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <TMTextGeneratorHelp />
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
import TMMockTextGenerate from "@/common/mock/TMMockTextGenerate.js";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMTextGeneratorHelp from "@/views/helps/TMTextGeneratorHelp.vue";
export default {
  extends: TMToolBase,
  name: "TMTextGenerator",
  components: { TMSubSidebar, TMTextGeneratorHelp },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    generate() {
      let me = this;
      if (me.exampleCount && me.exampleCount > 0) {
        switch (me.genType) {
          case "word": {
            me.randomTextGenerated = TMMockTextGenerate.generateLoremWords(
              me.exampleCount,
            );
            break;
          }
          case "paragraph": {
            me.randomTextGenerated = TMMockTextGenerate.generateLoremIpsum(
              me.exampleCount,
              true,
            );
            break;
          }
          default: {
            break;
          }
        }
      }
    },
    /**
     * copy kết quả
     */
    copyResult() {
      let me = this;
      me.$tmUtility.copyToClipboard(me.randomTextGenerated);
    },
  },
  computed: {
    generateTitle() {
      let me = this;
      return me.$t("i18nCommon.textgenerator.exampleCount");
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.TextGeneratorConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
      },
      randomTextGenerated: null,
      exampleCount: 10,
      genType: "word",
      genTypeOption: [
        {
          value: "word",
          label: this.$t("i18nCommon.textgenerator.genTypeWord"),
        },
        {
          value: "paragraph",
          label: this.$t("i18nCommon.textgenerator.genTypeParagraph"),
        },
      ],
    };
  },
};
</script>
<style scoped lang="scss">
.tm-text-generator {
  width: 100%;
  height: 100%;
}
.tm-text-gen-container {
  flex: 1;
  display: flex;
  width: 100%;
  height: 100%;
  .tm-text-gen-result {
    flex: 1;
    width: 100%;
  }
  .build-area {
    width: 100%;
    gap: var(--padding);
  }
}
</style>
