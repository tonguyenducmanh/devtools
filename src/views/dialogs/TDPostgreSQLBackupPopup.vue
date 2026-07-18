<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="600px"
    height="365px"
    :title="$t('i18nCommon.postgreSQLQuery.databaseOps.backupToSql')"
  >
    <div class="flex flex-col td-pg-backup-popup">
      <div class="flex connection-row">
        <TDComboBox
          v-model="importType"
          :noMargin="true"
          :options="importTypeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TDInput
            v-model="connStringFromApp"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.connectionStringPlaceHolder')
            "
          />
        </div>
        <TDButton
          :noMargin="true"
          iconClass="td-send-icon"
          :readOnly="!connStringFromApp"
          @click="convertConnString"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.convert')"
        />
      </div>
      <div class="flex connection-row">
        <TDComboBox
          v-model="fields.sslmode"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TDInput
            v-model="fields.database"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.databaseName')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="fields.host"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.hostPlaceholder')"
          />
        </div>
        <div class="">
          <TDInput
            v-model="fields.port"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.portPlaceholder')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="fields.username"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.usernamePlaceholder')"
          />
        </div>
        <div class="">
          <TDInput
            v-model="fields.password"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.passwordPlaceholder')"
            :inputType="'password'"
          />
        </div>
      </div>

      <div class="td-pg-backup-section-header">
        {{ $t("i18nCommon.postgreSQLQuery.databaseOps.pgBinPath") }}
      </div>
      <TDInput
        v-model="pgBinPath"
        :noMargin="true"
        :placeHolder="pgBinPlaceholder"
      />

      <div class="flex td-popup-actions">
        <TDButton
          :noMargin="true"
          @click="handleBackup"
          :readOnly="isProcessing || !isValid"
          :label="
            isProcessing
              ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing')
              : $t('i18nCommon.postgreSQLQuery.databaseOps.backupToSql')
          "
        />
        <TDButton
          :noMargin="true"
          @click="handleClose"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        />
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDServerPostgreSQLAPI from "@/common/api/request/AgentAPI/TDServerPostgreSQLAPI.js";
import TDDatabaseConnectionMixin from "@/mixins/TDDatabaseConnectionMixin.js";
import TDDotNetWasmMixin from "@/mixins/TDDotNetWasmMixin.js";

export default {
  name: "TDPostgreSQLBackupPopup",
  mixins: [TDDatabaseConnectionMixin, TDDotNetWasmMixin],
  props: {
    ownerForm: { type: Object, required: true },
  },
  data() {
    return {
      isProcessing: false,
      importType: this.$tdEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
      connStringFromApp: "",
      importTypeOptions: [
        {
          value: this.$tdEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
          label: this.$t("i18nCommon.postgreSQLQuery.importNpgSQL"),
        },
        {
          value: this.$tdEnum.PostreSQLConnectionImportType.PgxGo,
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
  computed: {
    isValid() {
      return this.fields.host && this.fields.database && this.fields.username;
    },
    pgBinPlaceholder() {
      const os = this.$tdUtility.getOS();
      if (os === "mac") return "/Library/PostgreSQL/16/bin";
      if (os === "linux") return "/usr/lib/postgresql/16/bin";
      return "C:\\Program Files\\PostgreSQL\\16\\bin";
    },
  },
  mounted() {
    this.agentAPI = new TDServerPostgreSQLAPI();
    this.loadCurrentConnection();
  },
  methods: {
    show() {},
    handleClose(payload) {
      this.$emit("close", payload);
    },
    loadCurrentConnection() {
      const conn = this.ownerForm?.allConnections?.find(
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
          this.connStringFromApp = this.dotnetExports.StringifyNpgSQLConnection(
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
          this.$tdEnum.PostreSQLConnectionImportType.NpgSQLDotNet
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
          this.$tdToast.error(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlError"),
          );
        }
      } else if (
        this.importType === this.$tdEnum.PostreSQLConnectionImportType.PgxGo
      ) {
        this.fields = this.parseConnectionStringToFields(
          this.connStringFromApp,
        );
      }
    },
    async handleBackup() {
      this.isProcessing = true;
      try {
        const resp = await this.agentAPI.backupDatabase(
          {
            host: this.fields.host,
            port: this.fields.port,
            user: this.fields.username,
            password: this.fields.password,
            dbname: this.fields.database,
          },
          this.pgBinPath,
        );
        if (
          resp?.success &&
          typeof resp.data === "string" &&
          resp.data.length > 0
        ) {
          const blob = new Blob([resp.data], {
            type: "text/sql;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const d = new Date();
          const ts = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}_${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}_${String(d.getMinutes()).padStart(2, "0")}_${String(d.getSeconds()).padStart(2, "0")}`;
          a.download = `${this.fields.database}_${ts}.sql`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.$tdToast.success(
            this.$t("i18nCommon.postgreSQLQuery.databaseOps.backupSuccess"),
          );
        } else {
          this.$tdToast.error(
            (typeof resp.data === "object" && resp.data?.message) ||
              this.$t("i18nCommon.toastMessage.error"),
          );
        }
      } catch (e) {
        this.$tdToast.error(
          e?.message || this.$t("i18nCommon.toastMessage.error"),
        );
      } finally {
        this.isProcessing = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.td-pg-backup-popup {
  gap: var(--padding);
  margin: var(--padding);
}
.td-pg-backup-section-header {
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
  font-weight: 600;
  flex-shrink: 0;
}
.connection-row {
  gap: var(--padding);
  width: 100%;
  align-items: center;
  justify-content: flex-start;
}
.td-popup-actions {
  margin-top: 10px;
  gap: var(--padding);
}
</style>
