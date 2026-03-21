<template>
  <div class="flex td-text-generator">
    <div class="flex flex-col td-text-gen-container">
      <div class="td-text-gen-result">
        <TDTextarea
          :placeHolder="$t('i18nCommon.textgenerator.resultPlaceholder')"
          v-model="randomTextGenerated"
          :readOnly="true"
        ></TDTextarea>
      </div>
      <div class="flex build-area">
        <TDComboBox
          :width="120"
          :noMargin="true"
          v-model="genType"
          :options="genTypeOption"
          :isDropTop="true"
        />
        <span class="title-input-config">{{ generateTitle }}</span>
        <div>
          <TDInput
            v-model="exampleCount"
            :inputType="'number'"
            :placeHolder="10"
            :noMargin="true"
          />
        </div>
        <TDButton
          :noMargin="true"
          :readOnly="!exampleCount"
          @click="generate"
          :label="$t('i18nCommon.textgenerator.generate')"
        ></TDButton>
        <TDButton
          @click="copyResult"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.copy')"
        ></TDButton>
      </div>
    </div>
    <TDSubSidebar v-model="isShowSidebar">
      <template v-slot:main>
        <TDTextGeneratorHelp />
      </template>
    </TDSubSidebar>
  </div>
</template>
<script>
import TDMockTextGenerate from "@/common/mock/TDMockTextGenerate.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDTextGeneratorHelp from "@/views/helps/TDTextGeneratorHelp.vue";
export default {
  extends: TDToolBase,
  name: "TDTextGenerator",
  components: { TDSubSidebar, TDTextGeneratorHelp },
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
            me.randomTextGenerated = TDMockTextGenerate.generateLoremWords(
              me.exampleCount,
            );
            break;
          }
          case "paragraph": {
            me.randomTextGenerated = TDMockTextGenerate.generateLoremIpsum(
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
      me.$tdUtility.copyToClipboard(me.randomTextGenerated);
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
      isShowSidebar: true,
      randomTextGenerated: null,
      exampleCount: 10,
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
.td-text-generator {
  width: 100%;
  height: 100%;
}
.td-text-gen-container {
  flex: 1;
  display: flex;
  width: 100%;
  height: 100%;
  .td-text-gen-result {
    flex: 1;
    width: 100%;
  }
  .build-area {
    width: 100%;
    gap: var(--padding);
  }
}
</style>
