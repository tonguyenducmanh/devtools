<template>
  <div class="flex flex-col td-history-wrapper">
    <div
      v-if="historyItems && historyItems.length > 0"
      class="flex flex-col td-history-filter"
    >
      <div class="flex td-history-filter-header">
        <TDButton
          :noMargin="true"
          :type="$tdEnum.buttonType.secondary"
          :readOnly="!canAddKeyword"
          :label="$t('i18nCommon.history.filterAdd')"
          @click="addKeyword"
        ></TDButton>
        <TDComboBox
          class="flex-one"
          v-model="searchOperator"
          :options="operatorOptions"
          :width="100"
          :usingStylePercent="true"
          :noMargin="true"
        />
      </div>
      <div
        class="flex td-history-filter-row"
        v-for="(keyword, index) in keywords"
        :key="index"
      >
        <div class="td-history-filter-input">
          <TDInput
            v-model="keyword.value"
            :placeHolder="$t('i18nCommon.history.filterPlaceholder')"
            :noMargin="true"
          />
        </div>
        <div
          v-if="keywords.length > 1"
          class="td-icon td-close-icon"
          v-tooltip="$t('i18nCommon.apiTesting.delete')"
          @click="removeKeyword(index)"
        ></div>
      </div>
    </div>

    <div
      v-if="filteredHistoryItems && filteredHistoryItems.length > 0"
      class="flex flex-col td-history-container"
      :style="styleHistoryContainer"
    >
      <div class="flex flex-col td-history">
        <template v-for="(item, index) in filteredHistoryItems">
          <div
            class="flex td-history-item"
            @click="applyHistoryText(item.historyId)"
          >
            <div class="text-nowrap">
              <span
                class="text-nowrap"
                :style="{ 'max-width': maxWidthHistory }"
                v-tooltip="item.textContent"
                >{{ item.textContent }}</span
              >
            </div>

            <div
              class="td-icon td-close-icon"
              v-tooltip="$t('i18nCommon.apiTesting.delete')"
              @click.stop.prevent="deleteHistoryItem(item.historyId)"
            ></div>
          </div>
        </template>
      </div>
    </div>
    <div v-else class="td-history-empty">
      <span>{{
        historyItems && historyItems.length > 0
          ? $t("i18nCommon.history.filterEmptyResult")
          : $t("i18nCommon.history.emptyMessage")
      }}</span>
    </div>
    <TDButton
      v-if="historyItems && historyItems.length > 0"
      @click="clearAllHistory"
      :type="$tdEnum.buttonType.secondary"
      :label="deleteAllLabel"
    ></TDButton>
  </div>
</template>

<script>
import TDHistory from "./TDHistory.vue";

const OPERATOR = {
  AND: "AND",
  OR: "OR",
};

export default {
  extends: TDHistory,
  name: "TDHistorySidebar",
  created() {
    let me = this;
    me.isHistoryVisible = true; // luôn hiện
  },
  mounted() {
    let me = this;
    me.prepareData();
  },
  methods: {},
  props: {
    maxWidthHistory: {
      type: String,
      default: "215px",
    },
  },
  data() {
    return {
      keywords: [{ value: "" }],
      searchOperator: OPERATOR.AND,
    };
  },
  computed: {
    operatorOptions() {
      return [
        {
          value: OPERATOR.AND,
          label: this.$t("i18nCommon.history.filterAnd"),
        },
        { value: OPERATOR.OR, label: this.$t("i18nCommon.history.filterOr") },
      ];
    },
    filteredHistoryItems() {
      let me = this;
      let terms = me.getValidKeywords();
      if (!terms || terms.length === 0) {
        return me.historyItems;
      }
      return (me.historyItems || []).filter((item) => {
        let text = me.getItemSearchText(item);
        if (me.searchOperator === OPERATOR.OR) {
          return terms.some((term) => me.isMatchText(text, term));
        }
        return terms.every((term) => me.isMatchText(text, term));
      });
    },
    canAddKeyword() {
      let me = this;
      let last = (me.keywords || [])[me.keywords.length - 1];
      return !!(last && last.value && last.value.trim().length > 0);
    },
    deleteAllLabel() {
      let me = this;
      let total = me.historyItems?.length || 0;
      if (total > 0) {
        return me.$t("i18nCommon.history.deleteAllWithCount").format(total);
      }
      return me.$t("i18nCommon.deleteAll");
    },
  },
  methods: {
    addKeyword() {
      let me = this;
      me.keywords.push({ value: "" });
    },
    removeKeyword(index) {
      let me = this;
      me.keywords.splice(index, 1);
    },
    getValidKeywords() {
      let me = this;
      return (me.keywords || [])
        .map((k) => (k.value || "").trim())
        .filter((t) => t.length > 0);
    },
    isMatchText(text, keyword) {
      if (!text || !keyword) return false;
      return text.toLowerCase().includes(keyword.toLowerCase());
    },
    getItemSearchText(item) {
      let me = this;
      let text = (item && item.textContent) || "";
      if (item && item.source) {
        let sourceText =
          typeof item.source === "string"
            ? item.source
            : JSON.stringify(item.source);
        text += "\n" + sourceText;
      }
      return text;
    },
  },
};
</script>
<style lang="scss" scoped>
.td-history-wrapper {
  min-height: 0;
  width: 100%;
  height: 100%;
  margin-top: var(--padding);
}
.td-history-filter {
  width: 100%;
  gap: var(--padding);
  padding-bottom: var(--padding);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--padding);
  flex-shrink: 0;
  .td-history-filter-header {
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: var(--padding);
  }
  .td-history-filter-row {
    align-items: center;
    gap: var(--padding);
    width: 100%;
    .td-history-filter-input {
      flex: 1;
      min-width: 0;
    }
    .td-close-icon {
      cursor: pointer;
      flex-shrink: 0;
    }
  }
}
.td-history-container {
  position: relative;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  justify-content: flex-start;
  width: 100%;
  .td-history {
    width: 100%;
    .td-history-item {
      cursor: pointer;
      height: 30px;
      width: 100%;
      padding: var(--padding);
      border-radius: var(--border-radius);
      justify-content: space-between;
    }
    .td-history-item:hover {
      background-color: var(--bg-layer-color);
    }
  }
}
.td-close-icon {
  cursor: pointer;
}
.td-history-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.text-nowrap {
  max-width: 230px;
  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
