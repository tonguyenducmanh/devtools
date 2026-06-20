import pgQueries from "@/views/tools/PostgreSQLQuery/templates.js";

export default {
  methods: {
    /**
     * Test connection to database by executing a simple query
     * @param {Object} agentAPI
     * @param {string} connectionId
     * @returns {Object} result
     */
    async testDatabaseConnection(agentAPI, connectionId) {
      if (!connectionId) {
        this.$tdToast.warning(this.$t("i18nCommon.postgreSQLQuery.noConnectionString"));
        return { success: false, message: this.$t("i18nCommon.postgreSQLQuery.noConnectionString") };
      }

      try {
        let response = await agentAPI.executeQuery(connectionId, pgQueries.pg_test_connection);
        if (response?.data?.success) {
          let msg = response.data.message || this.$t("i18nCommon.postgreSQLQuery.connectionSuccess");
          this.$tdToast.success(this.$t("i18nCommon.postgreSQLQuery.connectionSuccess"));
          return { success: true, message: msg };
        } else {
          let msg = response?.data?.message || this.$t("i18nCommon.postgreSQLQuery.connectionFail");
          return { success: false, message: msg };
        }
      } catch (error) {
        return {
          success: false,
          message: error?.message || this.$t("i18nCommon.toastMessage.error"),
        };
      }
    }
  }
};
