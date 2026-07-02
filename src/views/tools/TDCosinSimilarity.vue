<template>
  <div class="flex td-cosin-similarity">
    <div class="flex flex-col container">
      <div class="flex io-section">
        <TDTextEditor
          isLabelTop
          :label="$t('i18nCommon.cosinSimilarity.firstVector')"
          :placeHolder="$t('i18nCommon.cosinSimilarity.vectorPlaceholder')"
          v-model="firstVector"
          language="json"
          :enableHighlight="true"
        ></TDTextEditor>

        <TDTextEditor
          isLabelTop
          :label="$t('i18nCommon.cosinSimilarity.secondVector')"
          :placeHolder="$t('i18nCommon.cosinSimilarity.vectorPlaceholder')"
          v-model="secondVector"
          language="json"
          :enableHighlight="true"
        ></TDTextEditor>
      </div>

      <div class="flex result-section">
        <label>{{ $t("i18nCommon.cosinSimilarity.result") }}</label>
        <div class="result">{{ similarity }}</div>
      </div>

      <div class="flex">
        <TDButton
          @click="calculateSimilarity"
          :label="$t('i18nCommon.cosinSimilarity.calculate')"
        ></TDButton>
        <TDButton
          @click="handleCopyResult"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.copy')"
        ></TDButton>
        <TDButton
          @click="applyExample"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.example')"
        ></TDButton>
      </div>
    </div>
    <TDSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <TDCosinSimilarityHelp />
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDCosinSimilarityHelp from "@/views/helps/TDCosinSimilarityHelp.vue";
export default {
  extends: TDToolBase,
  name: "TDCosinSimilarity",
  components: { TDSubSidebar, TDCosinSimilarityHelp },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.CosinSimilarityConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
      },
      firstVector: "",
      secondVector: "",
      similarity: "",
    };
  },
  created() {
    let me = this;
  },
  methods: {
    async calculateSimilarity() {
      try {
        const vector1 = JSON.parse(this.firstVector);
        const vector2 = JSON.parse(this.secondVector);

        if (!vector1 || !vector2 || vector1.length !== vector2.length) {
          this.$tdToast.error(
            this.$t("i18nCommon.cosinSimilarity.invalidVectors"),
          );
          return;
        }

        const resultString = this.cosineSimilarity(vector1, vector2);
        this.similarity = resultString;

        this.$tdToast.success(this.$t("i18nCommon.cosinSimilarity.calculated"));
      } catch (error) {
        console.error("Error calculating cosine similarity:", error);
        this.$tdToast.error(this.$t("i18nCommon.toastMessage.error"));
      }
    },

    cosineSimilarity(a, b) {
      if (a.length !== b.length) throw new Error("Vector phải cùng chiều");

      let dot = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }

      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    },

    handleCopyResult() {
      this.$tdUtility.copyToClipboard(this.similarity);
    },
    applyExample() {
      this.firstVector = JSON.stringify(
        [-0.017751375, 0.04524436, 0.004933944, 0.014026112, 0.014828892],
        null,
        2,
      );
      this.secondVector = JSON.stringify(
        [-0.0026613525, 0.043090295, 0.02586871, 0.022998447, 0.010381999],
        null,
        2,
      );
      this.$tdToast.success(
        this.$t("i18nCommon.toastMessage.applyMockSuccess"),
      );
    },
  },
};
</script>

<style scoped>
.td-cosin-similarity {
  width: 100%;
  height: 100%;
}
.container {
  width: 100%;
  height: 100%;
  flex: 1;
}

.io-section {
  flex: 1;
  width: 100%;
}

.result-section {
  width: 100%;
}

.flex {
  display: flex;
  gap: var(--padding);
}

.flex-col {
  flex-direction: column;
}
</style>
