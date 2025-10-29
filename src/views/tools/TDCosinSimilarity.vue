<template>
  <div class="td-container">
    <h1 class="td-title">{{ $t("i18nCommon.feature.cosinSimilarity") }}</h1>

    <div class="td-tool-container">
      <div class="td-input-group">
        <label>{{ $t("i18nCommon.cosinSimilarity.firstVector") }}</label>
        <TDTextarea
          v-model="firstVector"
          :placeholder="$t('i18nCommon.cosinSimilarity.vectorPlaceholder')"
        />
      </div>

      <div class="td-input-group">
        <label>{{ $t("i18nCommon.cosinSimilarity.secondVector") }}</label>
        <TDTextarea
          v-model="secondVector"
          :placeholder="$t('i18nCommon.cosinSimilarity.vectorPlaceholder')"
        />
      </div>

      <div class="td-result-group">
        <label>{{ $t("i18nCommon.cosinSimilarity.result") }}</label>
        <div class="td-result">{{ similarity }}</div>
      </div>

      <div class="td-button-group">
        <TDButton
          @click="calculateSimilarity"
          :label="$t('i18nCommon.cosinSimilarity.calculate')"
        >
        </TDButton>
        <TDButton
          @click="applyExample"
          :label="$t('i18nCommon.example')"
          :type="$tdEnum.buttonType.secondary"
        >
        </TDButton>
      </div>
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

        // Prepare input data
        const inputData = {
          FirstVector: vector1,
          SecondVector: vector2,
        };

        // Convert to JSON
        const jsonString = JSON.stringify(inputData);

        // Get dotnet runtime
        const runtime = window.__dotnet_runtime;
        const { getAssemblyExports } = runtime;
        const exports = await getAssemblyExports("Tools.NetWrapper.dll");
        const { ToolsTensor } = exports.Tools.NetWrapper;

        // Calculate similarity
        const resultString = ToolsTensor.CosinSimilarity(jsonString);
        this.similarity = resultString;

        this.$tdToast.success(this.$t("i18nCommon.cosinSimilarity.calculated"));
      } catch (error) {
        console.error("Error calculating cosine similarity:", error);
        this.$tdToast.error(this.$t("i18nCommon.toastMessage.error"));
      }
    },
    parseVector(input) {
      try {
        // Split by commas and convert to numbers
        return input
          .split(",")
          .map((num) => num.trim())
          .filter((num) => num !== "")
          .map((num) => parseFloat(num));
      } catch {
        return null;
      }
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

<style lang="scss" scoped>
.td-tool-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.td-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.td-result-group {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.td-result {
  padding: 10px;
  background-color: var(--td-background-color);
  border: 1px solid var(--td-border-color);
  border-radius: 4px;
  min-height: 42px;
}

.td-button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>
