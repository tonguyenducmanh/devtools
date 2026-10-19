<template>
  <div class="flex container">
    <div class="flex flex-col main-area">
      <!-- khu vực nhập JSON: editor hoặc upload file (kéo được để đổi tỉ lệ) -->
      <div class="input-area" :style="inputSectionStyle">
        <template v-if="!currentConfigLayout.enableFileUpload">
          <TMTextEditor
            isLabelTop
            :label="$t('i18nCommon.jsonToExcel.inputLabel')"
            :placeHolder="$t('i18nCommon.jsonToExcel.inputPlaceholder')"
            :wrapText="currentConfigLayout.wrapText"
            :enableHighlight="true"
            language="json"
            height="100%"
            width="100%"
            v-model="jsonSource"
          ></TMTextEditor>
        </template>

        <!-- Upload file JSON -->
        <template v-else>
          <div class="upload-container">
            <TMUpload
              :label="$t('i18nCommon.jsonToPostgreSQL.uploadLabel')"
              :accept="'.json'"
              @selected="handleFileUpload"
            ></TMUpload>
          </div>
        </template>
      </div>

      <!-- thanh kéo resize + vùng kết quả: chỉ hiện khi bật tuỳ chọn xem bảng -->
<template v-if="currentConfigLayout.showTable">
        <TMResizer direction="vertical" @resize="handleResize"></TMResizer>

        <!-- khu vực kết quả: bảng render của JSON -->
        <div class="result-area">
          <div v-if="isWorking" class="flex result-loading">
            <TMLoading />
          </div>

          <div v-else-if="showTableResult" class="result-table">
            <TMTableViewer
              :tableData="tableRows"
              :columns="tableColumnDefs"
              :noMargin="true"
              :stickyHeader="true"
              :showIndex="true"
              :showFooter="true"
              :usingFooterHelp="true"
              maxHeight="100%"
            ></TMTableViewer>
          </div>

          <!-- báo lỗi parse JSON -->
          <div v-else-if="parseError" class="result-error">
            {{ parseError }}
          </div>

          <!-- màn hình chờ: chưa có bảng nào để hiển thị -->
          <div v-else class="result-empty">
            <TMDynamicBackgroundEffect />
            <span>{{ $t("i18nCommon.jsonToExcel.emptyTable") }}</span>
          </div>
        </div>
      </template>

      <!-- toolbar: chuyển đổi / copy cho Excel / tải file / ví dụ -->
      <div class="flex">
        <TMButton
          :label="$t('i18nCommon.jsonToExcel.convert')"
          :disabled="!hasJsonSource"
          @click="handleConvert"
        ></TMButton>
        <TMButton
          @click="handleCopyForExcel"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToExcel.copyForExcel')"
          :disabled="!hasTableData"
          v-tooltip="$t('i18nCommon.jsonToExcel.copyForExcelDesc')"
        ></TMButton>
        <TMButton
          @click="() => downloadExcelFile(false)"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToExcel.downloadExcel')"
          :disabled="!hasTableData"
        ></TMButton>
        <TMButton
          @click="applyMock"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToExcel.example')"
        ></TMButton>
      </div>
    </div>

    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          ></TMSlideOption>
        </div>
      </template>
      <template v-slot:main>
        <!-- tab Help: hướng dẫn sử dụng -->
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Help
          "
        >
          <TMJSONToExcelHelp />
        </div>

        <!-- tab History: danh sách JSON đã chuyển đổi -->
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            titleKey="jsonSource"
            :noMargin="true"
            :cacheKey="$tmEnum.cacheConfig.JSONToExcelHistory"
          ></TMHistorySidebar>
        </div>

        <!-- tab Setting: cách hiển thị kết quả + tuỳ chọn file excel -->
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Setting
          "
        >
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableFileUpload"
            :label="$t('i18nCommon.jsonToPostgreSQL.useFileUpload')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.showTable"
            :label="$t('i18nCommon.jsonToExcel.showTable')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.isBoldColName"
            :label="$t('i18nCommon.jsonToExcel.boldColumns')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.isFitColWidth"
            :label="$t('i18nCommon.jsonToExcel.fitColumns')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.isFreezeFirstRow"
            :label="$t('i18nCommon.jsonToExcel.freezeRow')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import ExcelJS from "exceljs";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMJSONToExcelHelp from "@/views/helps/TMJSONToExcelHelp.vue";
import TMDynamicBackgroundEffect from "@/views/backgroundEffect/TMDynamicBackgroundEffect.vue";
import { writeExcelToClipboard } from "@/common/TMExcelClipboardUtil.js";

export default {
  extends: TMToolBase,
  name: "TMJSONToExcel",
  components: {
    TMSubSidebar,
    TMHistorySidebar,
    TMJSONToExcelHelp,
    TMDynamicBackgroundEffect,
  },

  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Help,
        label: this.$t("i18nCommon.sidebarOption.help"),
        icon: "tm-help-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.History,
        label: this.$t("i18nCommon.history.title"),
        icon: "tm-history-icon",
      });
      return options;
    },
    hasJsonSource() {
      return !!this.jsonSource?.trim();
    },
    hasTableData() {
      return this.tableRows.length > 0;
    },
    /**
     * Chỉ hiển thị bảng khi bật tuỳ chọn xem bảng và đã có dữ liệu
     */
    showTableResult() {
      return this.currentConfigLayout.showTable && this.hasTableData;
    },
    /**
     * Cấu hình cột cho TMTableViewer, hỗ trợ sort
     */
    tableColumnDefs() {
      return this.tableColumns.map((key) => ({
        key,
        label: key,
        sortable: true,
        autoWidth: true,
      }));
    },
    /**
     * Input chiếm đúng % kéo được, phần còn lại là vùng kết quả.
     * Tắt tuỳ chọn xem bảng thì không có vùng kết quả, editor chiếm hết chỗ.
     */
    inputSectionStyle() {
      return this.currentConfigLayout.showTable
        ? { flex: `0 0 ${this.inputSectionSize}%` }
        : { flex: "1" };
    },
  },

  methods: {
    /**
     * Xoá các key option đã đổi tên ở những lần trước (outputMode, outputAsFile)
     * cho khỏi nằm rác trong config đã cache.
     */
    mounted() {
      let me = this;
      let hasOldKey =
        "outputMode" in me.currentConfigLayout ||
        "outputAsFile" in me.currentConfigLayout;
      if (hasOldKey) {
        delete me.currentConfigLayout.outputMode;
        delete me.currentConfigLayout.outputAsFile;
        me.updateConfigLayout();
      }
    },

    async applyMock() {
      const { TMMockJSONToExcel } = await import(
        /* webpackChunkName: "mock-json-to-excel" */
        "@/common/mock/TMMockJSONToExcel.js"
      );
      this.$tmUtility.applyMock(this, TMMockJSONToExcel);
    },

    /* ================= RESIZE ================= */
    handleResize(sizes) {
      this.inputSectionSize = sizes.leftSize;
    },

    /* ================= FILE UPLOAD ================= */
    async handleFileUpload(files) {
      let me = this;
      try {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.name.endsWith(".json")) {
          me.$tmToast.error(
            me.$t("i18nCommon.jsonToExcel.onlyJsonSupported"),
          );
          return;
        }

        me.jsonSource = await file.text();
        await me.handleConvert();
      } catch (error) {
        console.error("File upload error:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /* ================= DATA PREPARE ================= */
    /**
     * Chuyển JSON thành mảng object phẳng 1 cấp (object/array con thành chuỗi JSON)
     * @returns {Array<Object>} các dòng dữ liệu, hoặc [] nếu JSON không hợp lệ
     */
    prepareData() {
      let me = this;
      let obj = null;
      try {
        obj = JSON.parse(me.jsonSource);
      } catch (error) {
        me.parseError = me.$t("i18nCommon.jsonToExcel.invalidJson");
        return [];
      }

      // JSON gốc rỗng hoặc null → không có gì để hiển thị
      if (obj === null || obj === undefined || obj === "") {
        return [];
      }

      let arrObj = Array.isArray(obj) ? obj : [obj];
      return me.flattenLevel1(arrObj);
    },

    /**
     * Làm phẳng 1 cấp: value là object/array thì stringify.
     * Phần tử nguyên thuỷ (vd: [1, 2, "a"]) gom vào 1 cột tên cố định.
     */
    flattenLevel1(jsonArray) {
      let me = this;
      let valueKey = me.$t("i18nCommon.jsonToExcel.valueColumnName");

      return jsonArray.map((row) => {
        // Không phải object (số, chuỗi, boolean, null) → bọc vào 1 cột
        if (row === null || typeof row !== "object") {
          return { [valueKey]: row };
        }

        let newRow = {};
        for (const key in row) {
          const value = row[key];
          newRow[key] =
            value !== null && typeof value === "object"
              ? JSON.stringify(value)
              : value;
        }
        return newRow;
      });
    },

    /**
     * Gom key của TẤT CẢ các dòng (không chỉ dòng đầu) để không mất cột
     * khi các object trong mảng JSON không cùng tập key.
     * @returns {string[]}
     */
    collectColumnKeys(rows) {
      let keys = [];
      let seen = new Set();
      rows.forEach((row) => {
        Object.keys(row || {}).forEach((key) => {
          if (!seen.has(key)) {
            seen.add(key);
            keys.push(key);
          }
        });
      });
      return keys;
    },

    /**
     * Bổ sung key còn thiếu của từng dòng (thành null) để mọi dòng có
     * đủ cột, tránh lệch cột khi render bảng.
     */
    fillMissingKeys(rows, keys) {
      return rows.map((row) => {
        let filled = {};
        keys.forEach((key) => {
          filled[key] = row?.[key] ?? null;
        });
        return filled;
      });
    },

    /* ================= EXCEL CONFIG ================= */
    getConfigWorkSheet() {
      return this.currentConfigLayout.isFreezeFirstRow
        ? { views: [{ state: "frozen", ySplit: 1 }] }
        : null;
    },

    /**
     * Đo độ rộng cột theo nội dung (chỉ dùng khi bật tuỳ chọn fit column)
     */
    calcColumnWidth(field) {
      let maxLen = String(field).length;
      this.tableRows.forEach((row) => {
        const value = row?.[field];
        maxLen = Math.max(maxLen, value == null ? 0 : String(value).length);
      });
      return Math.min(maxLen + 2, 120);
    },

    /* ================= CONVERT ================= */
    /**
     * Hàm chính: tuỳ chế độ đầu ra sẽ render bảng hoặc tải file .xlsx
     */
    async handleConvert() {
      let me = this;
      me.parseError = "";

      const rows = me.prepareData();
      if (!rows || rows.length === 0) {
        // Không có dữ liệu thì xoá bảng cũ để không hiển thị sai
        me.tableRows = [];
        me.tableColumns = [];
        if (!me.parseError) {
          me.$tmToast.warning(me.$t("i18nCommon.jsonToExcel.noRowToConvert"));
        }
        return;
      }

      let keys = me.collectColumnKeys(rows);
      me.tableColumns = keys;
      me.tableRows = me.fillMissingKeys(rows, keys);

      await me.saveToHistory();
      me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
    },

    /**
     * Copy toàn bộ bảng đang hiển thị ra clipboard theo định dạng Excel,
     * dán thẳng vào Excel/Google Sheets/WPS là ra bảng.
     */
    async handleCopyForExcel() {
      let me = this;
      if (!me.hasTableData) {
        me.$tmToast.warning(me.$t("i18nCommon.jsonToExcel.noRowToConvert"));
        return;
      }

      let headers = me.tableColumns.slice();
      let matrix = me.tableRows.map((row) =>
        headers.map((key) => row?.[key]),
      );

      let copied = await writeExcelToClipboard(headers, matrix, {
        boldHeader: me.currentConfigLayout.isBoldColName,
      });

      if (copied) {
        me.$tmToast.success(me.$t("i18nCommon.jsonToExcel.copiedForExcel"));
      } else {
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.cannotCopy"));
      }
    },

    /**
     * Tải bảng hiện tại xuống file .xlsx
     * @param {boolean} [silent=true] true thì không bắn toast thành công
     * (trường hợp handleConvert đã bắn toast rồi)
     */
    async downloadExcelFile(silent = true) {
      let me = this;
      if (!me.hasTableData) {
        me.$tmToast.warning(me.$t("i18nCommon.jsonToExcel.noRowToConvert"));
        return;
      }

      me.isWorking = true;
      try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(
          "Sheet1",
          me.getConfigWorkSheet(),
        );

        // Header
        const headerRow = worksheet.addRow(me.tableColumns);
        if (me.currentConfigLayout.isBoldColName) {
          headerRow.eachCell((cell) => (cell.font = { bold: true }));
        }

        // Data: mọi row đã có đủ key nên lấy theo đúng thứ tự cột
        me.tableRows.forEach((row) => {
          worksheet.addRow(me.tableColumns.map((key) => row?.[key]));
        });

        // Tự động chỉnh độ rộng cột.
        // Dùng getColumn().width chứ không gán worksheet.columns để không
        // đụng vào định nghĩa cột/header đã add ở trên.
        if (me.currentConfigLayout.isFitColWidth) {
          worksheet.columns.forEach((col, index) => {
            col.width = me.calcColumnWidth(me.tableColumns[index] ?? "");
          });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        me.$tmUtility.createDownloadFileFromBuffer(
          buffer,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          me.$tmUtility.createFileDownloadName("json-to-excel", {
            ext: ".xlsx",
          }),
        );

        if (!silent) {
          me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
        }
      } catch (error) {
        console.error("Convert excel error:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      } finally {
        me.isWorking = false;
      }
    },

    /**
     * Lưu input JSON hiện tại vào lịch sử
     */
    async saveToHistory() {
      let me = this;
      if (me.$refs.history && me.jsonSource) {
        let historyItem = {
          jsonSource: me.jsonSource,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },

    /**
     * Áp dụng input từ lịch sử (chỉ set input, không tự tải file)
     * @param {Object} item - Item lịch sử
     */
    handleApplyHistory(item) {
      let me = this;
      if (item && item.jsonSource) {
        me.jsonSource = item.jsonSource;
        me.currentConfigLayout.enableFileUpload = false;
        me.updateConfigLayout();
      }
    },
  },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.JSONToExcelConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        enableFileUpload: false,
        wrapText: true,
        isBoldColName: true,
        isFitColWidth: true,
        isFreezeFirstRow: true,
        // Bật thì hiển thị bảng kết quả, tắt thì editor chiếm hết chiều cao
        showTable: true,
      },
      jsonSource: "",
      // Bảng đã parse, nguồn dữ liệu cho render + copy + tải file
      tableRows: [],
      tableColumns: [],
      parseError: "",
      isWorking: false,
      // Tỉ lệ % chiều cao vùng nhập, phần còn lại là vùng kết quả
      inputSectionSize: 40,
    };
  },
};
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
}

.main-area {
  flex: 1;
  min-width: 0;
  height: 100%;
}

// min-height: 0 để con (Monaco / bảng) co lại đúng thay vì tràn ra ngoài
.input-area {
  min-height: 0;
  width: 100%;
}

.result-area {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.upload-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-loading {
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-layer-color);
  border-radius: var(--border-radius);
}

.result-table {
  height: 100%;
  width: 100%;
}

.result-error {
  display: flex;
  align-items: flex-start;
  gap: var(--padding);
  padding: var(--padding);
  color: var(--text-error-color);
  background-color: var(--bg-thirt-color);
  border-radius: var(--border-radius);
  word-break: break-all;
  flex: 1;
}

.result-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--padding);
  color: var(--text-secondary-color);
  position: relative;

  // canvas của background effect có z-index 0, chữ phải nằm trên
  span {
    z-index: 1;
  }
}

.tm-sidebar-content {
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  overflow: auto;
}

.tm-sidebar-menu {
  width: 100%;
}
</style>