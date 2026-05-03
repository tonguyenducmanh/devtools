<template>
  <div class="flex flex-col td-app-data-miner-container">
    <div class="flex flex td-app-data-miner-group-btn">
      <div class="flex td-app-data-table-select">
        <!-- combo chọn loại dữ liệu -->
        <TDComboBox
          class="td-data-source-combo"
          v-model="dataSourceType"
          :placeHolder="$t('i18nCommon.AppDataMiner.selectDataSource')"
          :options="dataSourceOptions"
          :noMargin="true"
          :usingStylePercent="true"
          @selected="onDataSourceChanged"
        ></TDComboBox>
        <template v-if="isServerAgentMode">
          <div class="flex td-data-btn">
            <TDButton
              @click="queryDynamicData"
              :label="$t('i18nCommon.AppDataMiner.getData')"
              :noMargin="true"
            ></TDButton>
            <div class="flex">
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
              <div
                @click="loadAllTestingData"
                class="td-icon td-reload-icon"
                v-tooltip="$t('i18nCommon.AppDataMiner.refreshTableData')"
              ></div>
            </div>
          </div>
        </template>
        <template v-else-if="isClipboardMode">
          <div class="flex td-data-btn">
            <TDButton
              @click="loadClipboardHistory"
              :label="$t('i18nCommon.AppDataMiner.getData')"
              :noMargin="true"
            ></TDButton>
            <TDButton
              @click="deleteClipboardHistory"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.AppDataMiner.deleteClipboard')"
              :noMargin="true"
            ></TDButton>
          </div>
        </template>
      </div>
    </div>
    <div class="flex td-script-query" v-if="isServerAgentMode">
      <TDTextarea
        v-model="scriptQuery"
        :enableHighlight="true"
        language="sql"
        :wrapText="false"
        :placeHolder="$t('i18nCommon.AppDataMiner.queryAgentSQl')"
        :label="$t('i18nCommon.AppDataMiner.queryAgentSQl')"
      ></TDTextarea>
    </div>
    <div class="td-app-data-viewer">
      <TDTableViewer
        :tableData="currentTableDatas"
        :showIndex="true"
        :showFooter="true"
        :noMargin="true"
        :emptyCellText="'null'"
        :hoverable="false"
        :enableLogCopyData="false"
      >
      </TDTableViewer>
    </div>
  </div>
</template>

<script>
import TDServerAppDataMiner from "@/common/api/request/AgentAPI/TDServerAppDataMiner.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import cache from "@/common/cache/TDCache.js";

const DATA_SOURCE_TYPE = {
  Clipboard: 1,
  ServerAgent: 2,
};

export default {
  extends: TDToolBase,
  name: "TDAppDataMiner",
  components: {},
  mixins: [],

  data() {
    return {
      agentAPI: null,
      tableName: null,
      allTables: [],
      currentTableDatas: [],
      scriptQuery: null,
      dataSourceType: DATA_SOURCE_TYPE.Clipboard,
      dataSourceOptions: [
        {
          value: DATA_SOURCE_TYPE.Clipboard,
          label: this.$t("i18nCommon.AppDataMiner.dataSourceClipboard"),
        },
        {
          value: DATA_SOURCE_TYPE.ServerAgent,
          label: this.$t("i18nCommon.AppDataMiner.dataSourceServerAgent"),
        },
      ],
    };
  },
  async mounted() {
    this.agentAPI = new TDServerAppDataMiner();
    this.loadClipboardHistory();
  },
  computed: {
    isServerAgentMode() {
      return this.dataSourceType === DATA_SOURCE_TYPE.ServerAgent;
    },
    isClipboardMode() {
      return this.dataSourceType === DATA_SOURCE_TYPE.Clipboard;
    },
  },
  beforeUnmount() {},
  methods: {
    /**
     * Xử lý khi đổi loại nguồn dữ liệu
     */
    async onDataSourceChanged() {
      let me = this;
      me.currentTableDatas = [];
      me.scriptQuery = null;
      if (me.isClipboardMode) {
        await me.loadClipboardHistory();
      } else {
        await me.reloadTable();
      }
    },

    /**
     * Load lịch sử clipboard từ cache
     */
    async loadClipboardHistory() {
      let me = this;
      me.currentTableDatas = [];
      try {
        let history = await cache.get(me.$tdEnum.cacheConfig.CopyTextHistory);
        if (!history) {
          history = [];
        }
        if (typeof history === "string") {
          try {
            history = JSON.parse(history);
          } catch {
            history = [];
          }
        }
        if (Array.isArray(history)) {
          // Chuyển mảng string thành mảng object để hiển thị trong TDTableViewer
          me.currentTableDatas = history.map((text, index) => ({
            content: text,
          }));
        }
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Lỗi tải lịch sử clipboard:", error);
      }
    },
    async deleteClipboardHistory() {
      let me = this;
      await cache.remove(me.$tdEnum.cacheConfig.CopyTextHistory);
      await me.loadClipboardHistory();
    },
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
        me.scriptQuery = `select * from ${me.tableName} order by created_date desc limit 20;`;
        await me.queryDynamicData();
      }
    },

    /**
     * Query dữ liệu động (chỉ dùng cho Server Agent mode)
     */
    async queryDynamicData() {
      let me = this;
      if (me.scriptQuery) {
        me.currentTableDatas = [];
        try {
          let param = {
            query_command: me.scriptQuery,
          };
          let res = await me.agentAPI.dataMinerExecuteQuery(param);
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
  gap: var(--padding);
  .td-script-query {
    width: 100%;
    height: 200px;
  }
  .td-app-data-miner-group-btn {
    justify-content: space-between;
    width: 100%;
    gap: var(--padding);
    .td-app-data-table-select {
      justify-content: flex-start;
      width: 100%;
      gap: var(--padding);
      .td-data-source-combo {
        width: 200px;
      }
      .td-table-select-combo {
        width: 300px;
      }
      .td-data-btn {
        flex: 1;
        justify-content: space-between;
      }
    }
  }
  .td-app-data-viewer {
    flex: 1;
    width: 100%;
    min-height: 0;
    box-sizing: border-box;
  }
}
</style>
