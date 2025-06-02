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
    convertToExcel() {
      let me = this;
      try {
        let arrObj = me.prepareData();
        // 1. Convert JSON to worksheet
        const worksheet = XLSX.utils.json_to_sheet(arrObj);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // 2. Generate binary array buffer
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

        // 3. Create a Blob
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // 4. Tạo URL download và tự động click
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "du-lieu.xlsx";
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
