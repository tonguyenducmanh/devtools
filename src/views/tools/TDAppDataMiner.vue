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
          :isCapitalizeText="false"
          @selected="showDataByTable"
        ></TDComboBox>
        <TDButton
          @click="reloadTable"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.AppDataMiner.refreshTableData')"
          :noMargin="true"
        ></TDButton>
      </div>
    </div>
    <div class="td-app-data-viewer">
      <TDTableViewer
        :tableData="currentTableDatas"
        :showIndex="true"
        :showFooter="true"
        :noMargin="true"
        :emptyCellText="'null'"
        :hoverable="false"
      >
      </TDTableViewer>
    </div>
  </div>
</template>

<script>
import TDServerAppDataMiner from "@/common/api/request/AgentAPI/TDServerAppDataMiner.js";

export default {
  name: "TDAppDataMiner",
  components: {},
  mixins: [],

  data() {
    return {
      agentAPI: null,
      tableName: null,
      allTables: [],
      currentTableDatas: [],
    };
  },
  async mounted() {
    this.agentAPI = new TDServerAppDataMiner();
    await this.reloadTable();
  },
  computed: {},
  beforeUnmount() {},
  methods: {
    async reloadTable() {
      let me = this;
      me.allTables = [];
      try {
        let res = await me.agentAPI.getAllTable();
        if (
          res &&
          res.success &&
          res.data &&
          Array.isArray(res.data.data) &&
          res.data.data.length > 0
        ) {
          res.data.data.forEach((currentTable) => {
            me.allTables.push({
              value: currentTable,
              label: currentTable,
            });
          });
        }
      } catch (error) {
        console.error("Lỗi tải table APIs:", error);
        me.$tdUtility.showErrorNotFoundAgentServer();
      }
    },
    async showDataByTable() {
      let me = this;
      if (me.tableName) {
        me.currentTableDatas = [];
        try {
          let res = await me.agentAPI.getAllDataByTableName(me.tableName);
          if (
            res &&
            res.success &&
            res.data &&
            Array.isArray(res.data.data) &&
            res.data.data.length > 0
          ) {
            me.currentTableDatas = res.data.data;
          }
        } catch (error) {
          console.error("Lỗi tải table APIs:", error);
          me.$tdUtility.showErrorNotFoundAgentServer();
        }
      }
    },
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
    width: 100%;
    min-height: 0;
    box-sizing: border-box;
    margin-top: var(--padding);
  }
}
</style>
