<template>
  <div class="flex tm-code-formatter">
    <div class="flex flex-col container">
      <div class="flex input-container">
        <TMTextEditor
          :placeHolder="$t('i18nCommon.codeFormatter.inputCode')"
          :label="$t('i18nCommon.codeFormatter.inputCode')"
          v-model="inputSource"
          height="100%"
          width="50%"
          :enableHighlight="currentConfigLayout.enableHighlight"
          :language="language"
        ></TMTextEditor>
        <TMTextEditor
          :placeHolder="$t('i18nCommon.codeFormatter.outputCode')"
          :label="$t('i18nCommon.codeFormatter.outputCode')"
          v-model="outputSource"
          height="100%"
          width="50%"
          :enableHighlight="currentConfigLayout.enableHighlight"
          :language="language"
          :readOnly="true"
        ></TMTextEditor>
      </div>
      <div class="flex tool-header">
        <TMComboBox
          :width="200"
          v-model="language"
          :options="methodOptions"
          :isDropTop="true"
        />
        <div class="flex">
          <TMButton
            @click="handleFormat"
            :label="$t('i18nCommon.codeFormatter.formatCode')"
          ></TMButton>
          <TMCheckbox
            v-model="currentConfigLayout.enableHighlight"
            :label="$t('i18nCommon.enableHighlight')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMButton
            @click="applyMock"
            :type="$tmEnum.buttonType.secondary"
            :label="$t('i18nCommon.example')"
          ></TMButton>
          <TMButton
            @click="handleCopyEvent(outputSource)"
            :type="$tmEnum.buttonType.secondary"
            :label="$t('i18nCommon.codeFormatter.copyOutput')"
          ></TMButton>
        </div>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <TMCodeFormatterHelp />
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
// import sqlFormatter từ thư viện
import { format as sqlFormat } from "sql-formatter";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMCodeFormatterHelp from "@/views/helps/TMCodeFormatterHelp.vue";
export default {
  extends: TMToolBase,
  name: "TMCodeFormatter",
  components: { TMSubSidebar, TMCodeFormatterHelp },
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
        let me = this;
        if (me.language === "pgsql") {
          // Lazy-load module PostgreSQL
          const { TMMockPostgreSQLFormatter } = await import(
            /* webpackChunkName: "mock-postgresql-formatter" */
            "@/common/mock/TMMockPostgreSQLFormatter.js"
          );
          this.$tmUtility.applyMock(this, TMMockPostgreSQLFormatter);
        } else {
          // Lazy-load module MySQL
          const { TMMockMySQLFormatter } = await import(
            /* webpackChunkName: "mock-mysql-formatter" */
            "@/common/mock/TMMockMySQLFormatter.js"
          );
          this.$tmUtility.applyMock(this, TMMockMySQLFormatter);
        }
      } catch (error) {
        console.error("Load mock formatter failed:", error);
      }
    },
    getCurrentFormatSQL() {
      let me = this;
      if (me.language === "pgsql") {
        return "postgresql";
      } else if (me.language === "mysql") {
        return "mysql";
      }
      return "postgresql"; // Mặc định là postgresql nếu không có lựa chọn
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

        if (
          me.normalizeSQL(me.inputSource) != me.normalizeSQL(me.outputSource)
        ) {
          me.outputSource = null;
        }
        me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Error formatting SQL:", error);
        me.outputSource = null; // Nếu có lỗi thì xoá output
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
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
      me.$tmUtility.copyToClipboard(value);
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.CodeFormatterConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        enableHighlight: true,
      },
      inputSource: null,
      outputSource: null,
      language: "pgsql",
      methodOptions: [
        { value: "pgsql", label: "Postgres SQL" },
        { value: "mysql", label: "MySql" },
      ],
    };
  },
};
</script>
<style scoped>
.tm-code-formatter {
  width: 100%;
  height: 100%;
}
.container {
  width: 100%;
  height: 100%;
  flex: 1;
}
.input-container {
  flex: 1;
  column-gap: var(--padding);
  width: 100%;
}
.tool-header {
  width: 100%;
  position: relative;

  align-items: center;
  justify-content: center;
}
</style>
