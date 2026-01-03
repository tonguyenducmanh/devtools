<template>
  <div class="flex flex-col td-history-wrapper">
    <div
      v-if="historyItems && historyItems.length > 0"
      class="flex flex-col td-history-container"
      :style="styleHistoryContainer"
    >
      <div class="flex flex-col td-history">
        <template v-for="(item, index) in historyItems">
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
    <TDButton
      @click="clearAllHistory"
      :type="$tdEnum.buttonType.secondary"
      :label="$t('i18nCommon.deleteAll')"
    ></TDButton>
  </div>
</template>

<script>
import TDHistory from "./TDHistory.vue";
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
    return {};
  },
  computed: {},
  methods: {},
};
</script>
<style lang="scss" scoped>
.td-history-wrapper {
  height: 100%;
  margin: var(--padding);
}
.td-history-container {
  min-height: 0;
  flex: 1;
  overflow-x: auto;
  justify-content: flex-start;
  width: 100%;
  .td-history {
    .td-history-item {
      cursor: pointer;
      height: 40px;
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
.text-nowrap {
  max-width: 230px;
  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
