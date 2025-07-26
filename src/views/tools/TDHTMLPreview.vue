<template>
  <div class="flex flex-col container">
    
  </div>
</template>
<script>

export default {
  name: "TDHTMLPreview",
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
  },
  data() {
    return {
    };
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>
