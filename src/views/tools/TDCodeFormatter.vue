<template>
  <div class="flex flex-col container">
    <div class="title">{{ $t("i18nCommon.codeFormatter.title") }}</div>
    <div class="flex history-wrapper">
      <TDHistory
        ref="history"
        class="history-container"
        titleKey="inputSource"
        :applyFunction="handleFormatFromHistory"
        :cacheKey="$tdEnum.cacheConfig.CodeFormatterHistory"
      ></TDHistory>
    </div>
    <TDRadioGroup
      v-model="currentFormatType"
      :label="$t('i18nCommon.codeFormatter.typeOfCode')"
      :options="formatType"
    />
    <div class="flex input-container">
      <TDTextarea
        :placeHolder="$t('i18nCommon.codeFormatter.inputCode')"
        v-model="inputSource"
        height="100%"
        width="50%"
      ></TDTextarea>
      <TDTextarea
        :placeHolder="$t('i18nCommon.codeFormatter.outputCode')"
        v-model="outputSource"
        height="100%"
        width="50%"
      ></TDTextarea>
    </div>
    <div class="flex">
      <TDButton
        @click="handleFormat"
        :label="$t('i18nCommon.codeFormatter.formatCode')"
      ></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.example')"
      ></TDButton>
      <TDButton
        @click="handleCopyEvent(outputSource)"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.codeFormatter.copyOutput')"
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
    async handleFormatFromHistory(item) {
      let me = this;
      if (item && item.inputSource) {
        me.inputSource = item.inputSource;
        me.currentFormatType =
          item.currentFormatType || tdEnum.typeOfCode.postgresql;
        await me.handleFormat();
      }
    },
    async handleFormat() {
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
        let historyItem = {
          inputSource: me.inputSource,
          currentFormatType: me.currentFormatType,
        };
        await me.$refs.history.saveToHistory(historyItem);
        if (
          me.normalizeSQL(me.inputSource) != me.normalizeSQL(me.outputSource)
        ) {
          me.outputSource = null;
        }
        me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Error formatting SQL:", error);
        me.outputSource = null; // Nếu có lỗi thì xoá output
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
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
}
.input-container {
  flex: 1;
  column-gap: var(--padding);
  width: 95%;
}
.history-wrapper {
  width: 95%;
}
.history-container {
  width: 100%;
}
</style>
