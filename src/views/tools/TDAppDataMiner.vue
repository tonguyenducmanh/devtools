<template>
  <div class="flex flex-col td-app-data-miner-container">
    <div class="flex td-app-data-miner-header">
      <div class="flex td-app-data-table-select">
        <TDComboBox
          class="td-table-select-combo"
          v-model="tableName"
          :placeHolder="$t('i18nCommon.AppDataMiner.selectTable')"
          :options="allTables"
          :noMargin="true"
          :usingStylePercent="true"
        ></TDComboBox>
        <TDButton
          @click="reloadTable"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.AppDataMiner.refreshTableData')"
          :noMargin="true"
        ></TDButton>
      </div>
      <TDButton
        :noMargin="true"
        @click="showDataByTable"
        :label="$t('i18nCommon.AppDataMiner.showDataByTable')"
      />
    </div>
    <div class="td-app-data-viewer">
      
    </div>
  </div>
</template>

<script>
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

export default {
  name: "TDAppDataMiner",
  components: {},
  mixins: [],

  data() {
    return {
      agentAPI: null,
      tableName: null,
      allTables: [],
    };
  },
  async mounted() {
    this.agentAPI = new TDAgentAPI();
  },
  computed: {},
  beforeUnmount() {},
  methods: {
    async reloadTable() {},
    async showDataByTable() {},
  },
};
</script>

<style scoped lang="scss">
.td-app-data-miner-container {
  width: 100%;
  height: 100%;
  .td-app-data-miner-header {
    justify-content: flex-start;
    width: 100%;
    gap: var(--padding);
    .td-app-data-table-select {
      justify-content: flex-start;
      gap: var(--padding);
      .td-table-select-combo {
        width: 300px;
      }
    }
  }
  .td-app-data-viewer {
    flex: 1;
  }
}
</style>
