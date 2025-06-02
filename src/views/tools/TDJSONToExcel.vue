<template>
  <div class="container">
    <div class="title">Convert mảng JSON object sang file excel!</div>
    <div class="flex">
      <TDTextarea
        isLabelTop
        label="Nhập JSON, key level 1 sẽ dùng làm tên cột"
        placeHolder="Nhập JSON ở đây..."
        height="400px"
        width="95%"
        v-model="jsonSource"
      ></TDTextarea>
    </div>
    <div class="flex">
      <TDCheckbox v-model="isBoldColName" label="In đâm tên cột"></TDCheckbox>
      <TDCheckbox
        v-model="isFitColWidth"
        label="Độ rộng vừa với tên cột"
      ></TDCheckbox>
    </div>
    <div class="flex">
      <TDButton label="Chuyển đổi" @click="convertToExcel"></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        label="Example"
      ></TDButton>
    </div>
  </div>
</template>
<script>
import { TDJSONToExcel } from "@/common/mock/mock.js";

import * as XLSX from "xlsx";

export default {
  name: "TDJSONToExcel",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    applyMock() {
      let me = this;
      me.$tdUtility.applyMock(me, TDJSONToExcel);
    },
    /**
     * tiền xử lý dữ liệu
     */
    prepareData() {
      let me = this;
      let arrObj = [];
      let obj = me.$tdUtility.JSONParse(me.jsonSource);
      if (obj) {
        if (Array.isArray(obj)) {
          arrObj = obj;
        } else {
          arrObj = [obj];
        }
      }
      let flattenObj = me.flattenLevel1(arrObj);
      return flattenObj;
    },
    /**
     * chế lại dữ liệu để đảm bảo chỉ có key đầu tiên làm tên cột, value mà là object thì convert thành text trước khi xuất khẩu excel
     * @param jsonArray mảng object
     */
    flattenLevel1(jsonArray) {
      return jsonArray.map((row) => {
        const newRow = {};
        for (const key in row) {
          const value = row[key];
          if (typeof value === "object" && value !== null) {
            newRow[key] = JSON.stringify(value);
          } else {
            newRow[key] = value;
          }
        }
        return newRow;
      });
    },
    /**
     * cấu hình in đậm cột
     */
    configBoldColumn(worksheet, arr) {
      let me = this;
      let headerKeys = me.getHeaderKeys(arr);
      if (worksheet && headerKeys && me.isBoldColName) {
        // BOLD dòng tiêu đề (dòng đầu)
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            font: { bold: true },
          };
        }
      }
    },
    autoFitColumn(worksheet, arr) {
      let me = this;
      let headerKeys = me.getHeaderKeys(arr);
      if (worksheet && headerKeys && me.isFitColWidth) {
        // Tự động set độ rộng cột theo nội dung
        const colWidths = headerKeys.map((key) => {
          const maxLen = Math.max(
            key.length,
            ...arr.map((row) => (row[key] ? String(row[key]).length : 0))
          );
          return { wch: maxLen + 2 }; // +2 để đệm
        });
        worksheet["!cols"] = colWidths;
      }
    },
    /**
     * lấy ra danh sách tên cột
     */
    getHeaderKeys(arr) {
      let sampleObj = Array.isArray(arr) ? arr[0] : arr;
      const headerKeys = Object.keys(sampleObj || {});
      return headerKeys;
    },
    /**
     * chuyển đổi sang excel
     */
    convertToExcel() {
      let me = this;
      try {
        let arrObj = me.prepareData();
        // 1. Convert JSON to worksheet
        const worksheet = XLSX.utils.json_to_sheet(arrObj);

        // in đậm tiêu đề cột
        me.configBoldColumn(worksheet, arrObj);

        // tự động fit độ rộng cột
        me.autoFitColumn(worksheet, arrObj);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Generate binary array buffer
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

        // Create a Blob
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // Tạo URL download và tự động click
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = me.fileName;
        a.click();

        // 5. Giải phóng bộ nhớ
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error in convertToExcel:", error);
      }
    },
  },
  data() {
    return {
      jsonSource: "",
      isBoldColName: true,
      isFitColWidth: true,
      fileName: "du-lieu.xlsx",
    };
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.io-section {
  column-gap: 20px;
}
</style>
