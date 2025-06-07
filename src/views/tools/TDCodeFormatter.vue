<template>
  <div class="container">
    <div class="title">Code formatter tool</div>
    <TDRadioGroup
      v-model="currentFormatType"
      label="Type of code"
      :options="formatType"
    />
    <div class="flex input-container">
      <TDTextarea
        placeHolder="input code"
        v-model="inputSource"
        height="100%"
        width="50%"
      ></TDTextarea>
      <TDTextarea
        placeHolder="output code"
        v-model="outputSource"
        height="100%"
        width="50%"
      ></TDTextarea>
    </div>
    <div class="flex">
      <TDButton @click="handleFormat" label="format"></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        label="Example"
      ></TDButton>
      <TDButton
        @click="handleCopyEvent(outputSource)"
        :type="$tdEnum.buttonType.secondary"
        label="Copy output"
      ></TDButton>
    </div>
  </div>
</template>
<script>
// import sqlFormatter từ thư viện
import { format as sqlFormat } from "sql-formatter";
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDCodeFormatter",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    async applyMock() {
      try {
        if (this.currentFormatType === tdEnum.typeOfCode.postgresql) {
          // Lazy-load module PostgreSQL
          const { TDMockPostgreSQLFormatter } = await import(
            /* webpackChunkName: "mock-postgresql-formatter" */
            "@/common/mock/TDMockPostgreSQLFormatter.js"
          );
          this.$tdUtility.applyMock(this, TDMockPostgreSQLFormatter);
        } else {
          // Lazy-load module MySQL
          const { TDMockMySQLFormatter } = await import(
            /* webpackChunkName: "mock-mysql-formatter" */
            "@/common/mock/TDMockMySQLFormatter.js"
          );
          this.$tdUtility.applyMock(this, TDMockMySQLFormatter);
        }
      } catch (error) {
        console.error("Load mock formatter failed:", error);
      }
    },
    getCurrentFormatSQL() {
      let me = this;
      if (me.currentFormatType === tdEnum.typeOfCode.postgresql) {
        return "postgresql";
      } else if (me.currentFormatType === tdEnum.typeOfCode.mysql) {
        return "mysql";
      }
      return "postgresql"; // Mặc định là postgresql nếu không có lựa chọn
    },
    handleFormat() {
      let me = this;
      try {
        if (me.inputSource) {
          me.outputSource = sqlFormat(me.inputSource, {
            language: me.getCurrentFormatSQL(),
            indent: "\t", // Dùng tab để thụt lề
            uppercase: true, // In hoa từ khoá
          });
        } else {
          me.outputSource = null;
        }
        // so sánh input và output, nếu giống nhau thì xoá output
        if (
          me.normalizeSQL(me.inputSource) != me.normalizeSQL(me.outputSource)
        ) {
          me.outputSource = null;
        }
      } catch (error) {
        console.error("Error formatting SQL:", error);
        me.outputSource = null; // Nếu có lỗi thì xoá output
      }
    },
    /**
     * @param sql chuỗi SQL cần chuẩn hoá
     * @returns chuỗi SQL đã được chuẩn hoá, loại bỏ khoảng trắng và chuyển về chữ thường
     */
    normalizeSQL(sql) {
      return sql
        .replace(/\s+/g, "") // Đổi nhiều khoảng trắng/dòng trắng thành 1 space
        .trim()
        .toLowerCase(); // Đổi về chữ thường cho dễ so sánh
    },
    handleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
    },
  },
  data() {
    return {
      inputSource: null,
      outputSource: null,
      currentFormatType: tdEnum.typeOfCode.postgresql,
      formatType: [
        { value: tdEnum.typeOfCode.postgresql, label: "PostgreSQL" },
        { value: tdEnum.typeOfCode.mysql, label: "MySQL" },
      ],
    };
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;
  min-height: 100vh;
  box-shadow: none;
}
.input-container {
  column-gap: var(--padding);
  height: 80%;
}
</style>
