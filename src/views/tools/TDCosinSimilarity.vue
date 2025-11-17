<template>
  <div class="flex flex-col container">
    <!-- <div class="title">{{ $t("i18nCommon.feature.cosinSimilarity") }}</div> -->

    <div class="flex io-section">
      <TDTextarea
        isLabelTop
        :label="$t('i18nCommon.cosinSimilarity.firstVector')"
        :placeHolder="$t('i18nCommon.cosinSimilarity.vectorPlaceholder')"
        v-model="firstVector"
      ></TDTextarea>

      <TDTextarea
        isLabelTop
        :label="$t('i18nCommon.cosinSimilarity.secondVector')"
        :placeHolder="$t('i18nCommon.cosinSimilarity.vectorPlaceholder')"
        v-model="secondVector"
      ></TDTextarea>
    </div>

    <div class="flex result-section">
      <div class="result-container">
        <label>{{ $t("i18nCommon.cosinSimilarity.result") }}</label>
        <div class="result">{{ similarity }}</div>
      </div>
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
</template>

<script>
import mock from "@/common/mock/TDMockCosinSimilarity.js";
export default {
  name: "TDCosinSimilarity",
  data() {
    return {
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
        // Parse input vectors
        const vector1 = this.parseVector(this.firstVector);
        const vector2 = this.parseVector(this.secondVector);

        // Validate vectors
        if (!vector1 || !vector2 || vector1.length !== vector2.length) {
          this.$tdToast.error(
            this.$t("i18nCommon.cosinSimilarity.invalidVectors")
          );
          return;
        }

        // Calculate similarity
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

    parseVector(input) {
      try {
        // Remove brackets if present
        let processedInput = input;
        if (input.startsWith("[") && input.endsWith("]")) {
          processedInput = input.slice(1, -1);
        }

        // Split by commas and convert to numbers
        return processedInput
          .split(",")
          .map((num) => num.trim())
          .filter((num) => num !== "")
          .map((num) => parseFloat(num));
      } catch {
        return null;
      }
    },
    handleCopyResult() {
      this.$tdUtility.copyToClipboard(this.similarity);
    },
    applyExample() {
      this.firstVector = mock.firstVector.join(", ");
      this.secondVector = mock.secondVector.join(", ");
      this.$tdToast.success(
        this.$t("i18nCommon.toastMessage.applyMockSuccess")
      );
    },
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}

.io-section {
  flex: 1;
  column-gap: var(--padding);
  width: 95%;
}

.result-section {
  width: 95%;
  margin-top: var(--padding);
}

.result-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}

.result {
  padding: var(--padding);
  background-color: var(--td-background-color);
  border: 1px solid var(--td-border-color);
  border-radius: var(--border-radius);
  min-height: 42px;
}

.flex {
  display: flex;
  gap: var(--padding);
}

.flex-col {
  flex-direction: column;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: var(--padding);
}
</style>
