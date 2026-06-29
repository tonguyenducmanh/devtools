import { pgQueries } from "@/templates/postgresqlToolQuery/templates.js";

export default {
  methods: {
    /**
     * Phân tích connection string PostgreSQL (URI hoặc DSN) thành object các trường riêng lẻ
     * @param {string} connStr - Chuỗi kết nối dạng URI (postgresql://) hoặc DSN (host=... port=...)
     * @returns {{ host: string, port: string, database: string, username: string, password: string, sslmode: string }}
     */
    parseConnectionStringToFields(connStr) {
      // Khởi tạo giá trị mặc định cho các trường
      let fields = {
        host: "",
        port: "5432",
        database: "",
        username: "",
        password: "",
        sslmode: "disable",
      };
      if (!connStr) return fields;

      try {
        if (
          connStr.startsWith("postgresql://") ||
          connStr.startsWith("postgres://")
        ) {
          // Xử lý định dạng URI: postgresql://user:pass@host:port/dbname?sslmode=xxx
          const url = new URL(connStr);
          fields.host = url.hostname || "localhost";
          fields.port = url.port || "5432";
          fields.database = url.pathname?.replace(/^\//, "") || "";
          fields.username = decodeURIComponent(url.username || "");
          fields.password = decodeURIComponent(url.password || "");
          fields.sslmode = url.searchParams.get("sslmode") || "disable";
        } else {
          // Xử lý định dạng DSN: host=xxx port=xxx user=xxx password=xxx dbname=xxx sslmode=xxx
          const parts = connStr.match(/(?:[^\s']+|'[^']*')+/g) || [];
          parts.forEach((p) => {
            const eqIdx = p.indexOf("=");
            if (eqIdx > -1) {
              const key = p.substring(0, eqIdx).trim();
              let val = p.substring(eqIdx + 1).trim();
              // Bỏ dấu nháy đơn nếu giá trị được bọc trong ''
              if (val.startsWith("'") && val.endsWith("'")) {
                val = val.substring(1, val.length - 1).replace(/\\'/g, "'");
              }
              if (key === "host") fields.host = val;
              if (key === "port") fields.port = val;
              if (key === "dbname") fields.database = val;
              if (key === "user") fields.username = val;
              if (key === "password") fields.password = val;
              if (key === "sslmode") fields.sslmode = val;
            }
          });
        }
      } catch (e) {
        console.warn("Parse connection string failed:", e);
      }

      return fields;
    },

    /**
     * Test connection to database by executing a simple query
     * @param {Object} agentAPI
     * @param {string} connectionId
     * @returns {Object} result
     */
    async testDatabaseConnection(agentAPI, connectionId) {
      if (!connectionId) {
        this.$tdToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.noConnectionString"),
        );
        return {
          success: false,
          message: this.$t("i18nCommon.postgreSQLQuery.noConnectionString"),
        };
      }

      try {
        let response = await agentAPI.executeQuery(
          connectionId,
          pgQueries.pg_test_connection,
        );
        if (response?.data?.success) {
          let msg =
            response.data.message ||
            this.$t("i18nCommon.postgreSQLQuery.connectionSuccess");
          this.$tdToast.success(
            this.$t("i18nCommon.postgreSQLQuery.connectionSuccess"),
          );
          return { success: true, message: msg };
        } else {
          let msg =
            response?.data?.message ||
            this.$t("i18nCommon.postgreSQLQuery.connectionFail");
          return { success: false, message: msg };
        }
      } catch (error) {
        return {
          success: false,
          message: error?.message || this.$t("i18nCommon.toastMessage.error"),
        };
      }
    },
  },
};
