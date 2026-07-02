<template>
  <div class="flex td-vector-mock-generator">
    <div class="flex flex-col container">
      <div class="flex io-section">
        <TDTextEditor
          isLabelTop
          :label="$t('i18nCommon.vectorMockGenerator.textInput')"
          :placeholder="$t('i18nCommon.vectorMockGenerator.textPlaceholder')"
          v-model="textInput"
          language="plaintext"
          :enableHighlight="true"
        ></TDTextEditor>

        <TDTextEditor
          isLabelTop
          :label="$t('i18nCommon.vectorMockGenerator.vectorResult')"
          :placeholder="$t('i18nCommon.vectorMockGenerator.vectorPlaceholder')"
          v-model="vectorResult"
          language="json"
          :enableHighlight="true"
          readOnly
        ></TDTextEditor>
      </div>

      <div class="flex bottom-section">
        <TDInput
          :label="$t('i18nCommon.vectorMockGenerator.dimensions')"
          v-model="dimensions"
          inputType="number"
          noMargin
        ></TDInput>
        <TDInput
          :label="$t('i18nCommon.vectorMockGenerator.nGram')"
          v-model="nGram"
          inputType="number"
          noMargin
        ></TDInput>
        <span class="spacer"></span>
        <TDButton
          @click="generateVector"
          :label="$t('i18nCommon.vectorMockGenerator.generateVector')"
        ></TDButton>
        <TDButton
          @click="copyVector"
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
        <TDVectorMockGeneratorHelp />
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDVectorMockGeneratorHelp from "@/views/helps/TDVectorMockGeneratorHelp.vue";

export default {
  extends: TDToolBase,
  name: "TDVectorMockGenerator",
  components: { TDSubSidebar, TDVectorMockGeneratorHelp },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.VectorMockGeneratorConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
      },
      dimensions: 128,
      nGram: 3,
      textInput: "",
      vectorResult: "",
    };
  },
  methods: {
    getNGrams(text, n) {
      const normalized = text.toLowerCase().trim();
      if (!normalized) return [];
      if (normalized.length <= n) return [normalized];
      const grams = [];
      for (let i = 0; i <= normalized.length - n; i++) {
        grams.push(normalized.substring(i, i + n));
      }
      return grams;
    },

    getDeterministicBytes(str, neededLength) {
      const bytes = [];
      for (let seed = 0; bytes.length < neededLength; seed++) {
        let h1 = 0xdeadbeef + seed;
        let h2 = 0x41c6ce57 + seed;
        for (let i = 0; i < str.length; i++) {
          const ch = str.charCodeAt(i);
          h1 = Math.imul(h1 ^ ch, 2654435761);
          h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 3266489907);
        h1 ^= Math.imul(h1 ^ (h1 >>> 13), 2246822507);
        h2 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489907);
        for (let i = 0; i < 4 && bytes.length < neededLength; i++) {
          bytes.push((h1 >>> (i * 8)) & 0xff);
        }
        for (let i = 0; i < 4 && bytes.length < neededLength; i++) {
          bytes.push((h2 >>> (i * 8)) & 0xff);
        }
      }
      return bytes;
    },

    getEmbedding(text) {
      if (!text || !text.trim()) {
        return new Array(this.dimensions).fill(0);
      }

      const grams = this.getNGrams(text, this.nGram);
      if (!grams.length) {
        return new Array(this.dimensions).fill(0);
      }

      const vector = new Array(this.dimensions).fill(0);

      for (const gram of grams) {
        const hashBytes = this.getDeterministicBytes(gram, this.dimensions);
        for (let i = 0; i < this.dimensions; i++) {
          vector[i] += (hashBytes[i % hashBytes.length] / 127.5) - 1.0;
        }
      }

      let norm = 0;
      for (let i = 0; i < this.dimensions; i++) {
        norm += vector[i] * vector[i];
      }
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < this.dimensions; i++) {
          vector[i] /= norm;
        }
      }

      for (let i = 0; i < this.dimensions; i++) {
        if (vector[i] === 0) {
          const eps = this.getDeterministicBytes("fixzero" + i, 1)[0];
          vector[i] = ((eps / 255) * 2 - 1) * 1e-10;
        }
      }

      return vector;
    },

    async generateVector() {
      try {
        const vector = this.getEmbedding(this.textInput);
        this.vectorResult = JSON.stringify(vector, null, 2);
        this.$tdToast.success(
          this.$t("i18nCommon.vectorMockGenerator.generated"),
        );
      } catch (e) {
        console.error("Error generating embedding:", e);
        this.$tdToast.error(this.$t("i18nCommon.toastMessage.error"));
      }
    },

    copyVector() {
      this.$tdUtility.copyToClipboard(this.vectorResult);
    },

    applyExample() {
      this.dimensions = 128;
      this.nGram = 3;
      this.textInput = "Thu tiền bán hàng cho tô mạnh";
      this.vectorResult = "";
      this.$tdToast.success(
        this.$t("i18nCommon.toastMessage.applyMockSuccess"),
      );
    },
  },
};
</script>

<style scoped>
.td-vector-mock-generator {
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

.bottom-section {
  width: 100%;
  align-items: flex-end;
}

.spacer {
  flex: 1;
}

.flex {
  display: flex;
  gap: var(--padding);
}

.flex-col {
  flex-direction: column;
}
</style>
