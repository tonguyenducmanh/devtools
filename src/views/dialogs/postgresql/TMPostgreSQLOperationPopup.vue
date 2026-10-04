<script>
import TMServerPostgreSQLAPI from "@/common/api/request/AgentAPI/TMServerPostgreSQLAPI.js";
import TMDatabaseConnectionMixin from "@/mixins/TMDatabaseConnectionMixin.js";
import TMDotNetWasmMixin from "@/mixins/TMDotNetWasmMixin.js";

export default {
  name: "TMPostgreSQLOperationPopup",
  mixins: [TMDatabaseConnectionMixin, TMDotNetWasmMixin],
  props: {
    ownerForm: { type: Object, required: true },
  },
  data() {
    return {
      isProcessing: false,
      importType: this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
      connStringFromApp: "",
      importTypeOptions: [
        {
          value: this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
          label: this.$t("i18nCommon.postgreSQLQuery.importNpgSQL"),
        },
        {
          value: this.$tmEnum.PostreSQLConnectionImportType.PgxGo,
          label: this.$t("i18nCommon.postgreSQLQuery.importPgxGo"),
        },
      ],
      sslModeOptions: [
        { value: "disable", label: "disable" },
        { value: "require", label: "require" },
        { value: "verify-ca", label: "verify-ca" },
        { value: "verify-full", label: "verify-full" },
        { value: "prefer", label: "prefer" },
        { value: "allow", label: "allow" },
      ],
      fields: {
        host: "",
        port: "5432",
        database: "",
        username: "",
        password: "",
        sslmode: "disable",
      },
      pgBinPath: "",
      agentAPI: null,
    };
  },
  mounted() {
    this.agentAPI = new TMServerPostgreSQLAPI();
    this.loadCurrentConnection();
    this.loadCachedPgBinPath();
  },
  methods: {
    show() {},
    handleClose(payload) {
      this.$emit("close", payload);
    },
    async loadCachedPgBinPath() {
      const cached = await this.$tmCache.get(
        this.$tmEnum.cacheConfig.PostgreSQLBinPath,
      );
      if (cached) {
        this.pgBinPath = cached;
        return;
      }
      this.detectPgBinPath();
    },
    async detectPgBinPath() {
      try {
        const resp = await this.agentAPI.detectBinPath();
        if (resp?.data?.success && resp.data.path) {
          this.pgBinPath = resp.data.path;
          this.saveCachedPgBinPath();
        }
      } catch {}
    },
    async saveCachedPgBinPath() {
      await this.$tmCache.set(
        this.$tmEnum.cacheConfig.PostgreSQLBinPath,
        this.pgBinPath,
      );
    },
    loadCurrentConnection() {
      const conn = this.ownerForm?.allCollectionItems?.find(
        (c) => c.id === this.ownerForm.selectedConnectionId,
      );
      if (conn?.connection_string) {
        this.fields = this.parseConnectionStringToFields(
          conn.connection_string,
        );
        this.buildNpgsqlString();
      }
    },
    buildNpgsqlString() {
      const fields = {
        host: this.fields.host,
        port: parseInt(this.fields.port) || 5432,
        user_name: this.fields.username,
        password: this.fields.password,
        database_name: this.fields.database,
      };
      if (this.dotnetInitialized && this.dotnetExports) {
        try {
          this.connStringFromApp =
            this.dotnetExports.StringifyNpgSQLConnection(
              JSON.stringify(fields),
            );
          return;
        } catch {}
      }
      this.connStringFromApp = `Host=${fields.host};Port=${fields.port};Database=${fields.database_name};Username=${fields.user_name};Password=${fields.password}`;
    },
    convertConnString() {
      if (!this.connStringFromApp.trim()) return;
      if (
        this.checkInitDotNetWasm() &&
        this.importType ===
          this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet
      ) {
        try {
          const parsed = JSON.parse(
            this.dotnetExports.ParseNpgSQLConnection(
              this.connStringFromApp.trim(),
            ),
          );
          this.fields.host = parsed.host || "";
          this.fields.port = parsed.port ? String(parsed.port) : "5432";
          this.fields.username = parsed.user_name || "";
          this.fields.password = parsed.password || "";
          this.fields.database = parsed.database_name || "";
        } catch {
          this.$tmToast.error(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlError"),
          );
        }
      } else if (
        this.importType === this.$tmEnum.PostreSQLConnectionImportType.PgxGo
      ) {
        this.fields = this.parseConnectionStringToFields(
          this.connStringFromApp,
        );
      }
    },
  },
};
</script>
