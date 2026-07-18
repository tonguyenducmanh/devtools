<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="650px"
    height="605px"
    :title="$t('i18nCommon.postgreSQLQuery.databaseOps.cloneDatabase')"
  >
    <div class="flex flex-col td-pg-clone-popup">
      <!-- Source -->
      <div class="td-pg-clone-section-header">
        {{ $t("i18nCommon.postgreSQLQuery.databaseOps.sourceConnection") }}
      </div>
      <div class="flex connection-row">
        <TDComboBox
          v-model="srcImportType"
          :noMargin="true"
          :options="importTypeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TDInput
            v-model="srcConnStringFromApp"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.connectionStringPlaceHolder')
            "
          />
        </div>
        <TDButton
          :noMargin="true"
          iconClass="td-send-icon"
          :readOnly="!srcConnStringFromApp"
          @click="convertSourceConnString"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.convert')"
        />
      </div>
      <div class="flex connection-row">
        <TDComboBox
          v-model="srcFields.sslmode"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TDInput
            v-model="srcFields.database"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.databaseName')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="srcFields.host"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.hostPlaceholder')"
          />
        </div>
        <div class="">
          <TDInput
            v-model="srcFields.port"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.portPlaceholder')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="srcFields.username"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.usernamePlaceholder')"
          />
        </div>
        <div class="">
          <TDInput
            v-model="srcFields.password"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.passwordPlaceholder')"
            :inputType="'password'"
          />
        </div>
      </div>

      <div class="td-pg-clone-divider"></div>

      <!-- Target -->
      <div class="td-pg-clone-section-header">
        {{ $t("i18nCommon.postgreSQLQuery.databaseOps.targetConnection") }}
      </div>
      <div class="flex connection-row">
        <TDComboBox
          v-model="tgtImportType"
          :noMargin="true"
          :options="importTypeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TDInput
            v-model="tgtConnStringFromApp"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.connectionStringPlaceHolder')
            "
          />
        </div>
        <TDButton
          :noMargin="true"
          iconClass="td-send-icon"
          :readOnly="!tgtConnStringFromApp"
          @click="convertTargetConnString"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.convert')"
        />
      </div>
      <div class="flex connection-row">
        <TDComboBox
          v-model="tgtFields.sslmode"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TDInput
            v-model="tgtFields.database"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.databaseName')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="tgtFields.host"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.hostPlaceholder')"
          />
        </div>
        <div class="">
          <TDInput
            v-model="tgtFields.port"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.portPlaceholder')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="tgtFields.username"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.usernamePlaceholder')"
          />
        </div>
        <div class="">
          <TDInput
            v-model="tgtFields.password"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.passwordPlaceholder')"
            :inputType="'password'"
          />
        </div>
      </div>

      <!-- Executable Paths -->
      <div class="td-pg-clone-section-header">
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
          @click="handleClone"
          :readOnly="isProcessing || !isSourceValid || !isTargetValid"
          :label="
            isProcessing
              ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing')
              : $t('i18nCommon.postgreSQLQuery.databaseOps.cloneDatabase')
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
  name: "TDPostgreSQLClonePopup",
  mixins: [TDDatabaseConnectionMixin, TDDotNetWasmMixin],
  props: {
    ownerForm: { type: Object, required: true },
  },
  data() {
    return {
      isProcessing: false,
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
      srcImportType: this.$tdEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
      srcConnStringFromApp: "",
      srcFields: {
        host: "",
        port: "5432",
        database: "",
        username: "",
        password: "",
        sslmode: "disable",
      },
      tgtImportType: this.$tdEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
      tgtConnStringFromApp: "",
      tgtFields: {
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
    isSourceValid() {
      return (
        this.srcFields.host &&
        this.srcFields.database &&
        this.srcFields.username
      );
    },
    isTargetValid() {
      return (
        this.tgtFields.host &&
        this.tgtFields.database &&
        this.tgtFields.username
      );
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
        this.srcFields = this.parseConnectionStringToFields(
          conn.connection_string,
        );
        this.buildNpgsqlString();
      }
    },
    buildNpgsqlString() {
      const fields = {
        host: this.srcFields.host,
        port: parseInt(this.srcFields.port) || 5432,
        user_name: this.srcFields.username,
        password: this.srcFields.password,
        database_name: this.srcFields.database,
      };
      if (this.dotnetInitialized && this.dotnetExports) {
        try {
          this.srcConnStringFromApp =
            this.dotnetExports.StringifyNpgSQLConnection(
              JSON.stringify(fields),
            );
          return;
        } catch {}
      }
      this.srcConnStringFromApp = `Host=${fields.host};Port=${fields.port};Database=${fields.database_name};Username=${fields.user_name};Password=${fields.password}`;
    },
    convertSourceConnString() {
      if (!this.srcConnStringFromApp.trim()) return;
      if (
        this.checkInitDotNetWasm() &&
        this.srcImportType ===
          this.$tdEnum.PostreSQLConnectionImportType.NpgSQLDotNet
      ) {
        try {
          const p = JSON.parse(
            this.dotnetExports.ParseNpgSQLConnection(
              this.srcConnStringFromApp.trim(),
            ),
          );
          this.srcFields = {
            host: p.host || "",
            port: p.port ? String(p.port) : "5432",
            username: p.user_name || "",
            password: p.password || "",
            database: p.database_name || "",
            sslmode: this.srcFields.sslmode,
          };
        } catch {
          this.$tdToast.error(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlError"),
          );
        }
      } else if (
        this.srcImportType === this.$tdEnum.PostreSQLConnectionImportType.PgxGo
      ) {
        this.srcFields = this.parseConnectionStringToFields(
          this.srcConnStringFromApp,
        );
      }
    },
    convertTargetConnString() {
      if (!this.tgtConnStringFromApp.trim()) return;
      if (
        this.checkInitDotNetWasm() &&
        this.tgtImportType ===
          this.$tdEnum.PostreSQLConnectionImportType.NpgSQLDotNet
      ) {
        try {
          const p = JSON.parse(
            this.dotnetExports.ParseNpgSQLConnection(
              this.tgtConnStringFromApp.trim(),
            ),
          );
          this.tgtFields = {
            host: p.host || "",
            port: p.port ? String(p.port) : "5432",
            username: p.user_name || "",
            password: p.password || "",
            database: p.database_name || "",
            sslmode: this.tgtFields.sslmode,
          };
        } catch {
          this.$tdToast.error(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlError"),
          );
        }
      } else if (
        this.tgtImportType === this.$tdEnum.PostreSQLConnectionImportType.PgxGo
      ) {
        this.tgtFields = this.parseConnectionStringToFields(
          this.tgtConnStringFromApp,
        );
      }
    },
    async handleClone() {
      this.isProcessing = true;
      try {
        const resp = await this.agentAPI.cloneDatabase(
          {
            host: this.srcFields.host,
            port: this.srcFields.port,
            user: this.srcFields.username,
            password: this.srcFields.password,
            dbname: this.srcFields.database,
          },
          {
            host: this.tgtFields.host,
            port: this.tgtFields.port,
            user: this.tgtFields.username,
            password: this.tgtFields.password,
            dbname: this.tgtFields.database,
          },
          { pgBinPath: this.pgBinPath },
        );
        if (resp?.data?.success) {
          this.$tdToast.success(
            resp.data.message ||
              this.$t("i18nCommon.postgreSQLQuery.databaseOps.cloneSuccess"),
          );
        } else {
          this.$tdToast.error(
            resp?.data?.message || this.$t("i18nCommon.toastMessage.error"),
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
.td-pg-clone-popup {
  gap: var(--padding);
  margin: var(--padding);
}
.td-pg-clone-section-header {
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
.td-pg-clone-divider {
  width: 100%;
  height: 1px;
  background-color: var(--border-color);
  flex-shrink: 0;
  margin: 4px 0;
}
.td-popup-actions {
  margin-top: 10px;
  gap: var(--padding);
}
</style>
