<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="650px"
    height="605px"
    :title="$t('i18nCommon.postgreSQLQuery.databaseOps.cloneDatabase')"
  >
    <div class="flex flex-col tm-pg-clone-popup">
      <!-- Source -->
      <div class="tm-pg-clone-section-header">
        {{ $t("i18nCommon.postgreSQLQuery.databaseOps.sourceConnection") }}
      </div>
      <div class="flex connection-row">
        <TMComboBox
          v-model="srcImportType"
          :noMargin="true"
          :options="importTypeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TMInput
            v-model="srcConnStringFromApp"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.connectionStringPlaceHolder')
            "
          />
        </div>
        <TMButton
          :noMargin="true"
          iconClass="tm-send-icon"
          :readOnly="!srcConnStringFromApp"
          @click="convertSourceConnString"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.convert')"
        />
      </div>
      <div class="flex connection-row">
        <TMComboBox
          v-model="srcFields.sslmode"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TMInput
            v-model="srcFields.database"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.databaseName')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="srcFields.host"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.hostPlaceholder')"
          />
        </div>
        <div class="">
          <TMInput
            v-model="srcFields.port"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.portPlaceholder')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="srcFields.username"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.usernamePlaceholder')"
          />
        </div>
        <div class="">
          <TMInput
            v-model="srcFields.password"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.passwordPlaceholder')"
            :inputType="'password'"
          />
        </div>
      </div>

      <div class="tm-pg-clone-divider"></div>

      <!-- Target -->
      <div class="tm-pg-clone-section-header">
        {{ $t("i18nCommon.postgreSQLQuery.databaseOps.targetConnection") }}
      </div>
      <div class="flex connection-row">
        <TMComboBox
          v-model="tgtImportType"
          :noMargin="true"
          :options="importTypeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TMInput
            v-model="tgtConnStringFromApp"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.connectionStringPlaceHolder')
            "
          />
        </div>
        <TMButton
          :noMargin="true"
          iconClass="tm-send-icon"
          :readOnly="!tgtConnStringFromApp"
          @click="convertTargetConnString"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.convert')"
        />
      </div>
      <div class="flex connection-row">
        <TMComboBox
          v-model="tgtFields.sslmode"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TMInput
            v-model="tgtFields.database"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.databaseName')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="tgtFields.host"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.hostPlaceholder')"
          />
        </div>
        <div class="">
          <TMInput
            v-model="tgtFields.port"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.portPlaceholder')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="tgtFields.username"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.usernamePlaceholder')"
          />
        </div>
        <div class="">
          <TMInput
            v-model="tgtFields.password"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.passwordPlaceholder')"
            :inputType="'password'"
          />
        </div>
      </div>

      <!-- Executable Paths -->
      <div class="tm-pg-clone-section-header">
        {{ $t("i18nCommon.postgreSQLQuery.databaseOps.pgBinPath") }}
      </div>
      <TMInput
        v-model="pgBinPath"
        :noMargin="true"
        :placeHolder="pgBinPlaceholder"
      />

      <div class="flex tm-popup-actions">
        <TMButton
          :noMargin="true"
          @click="handleClone(false)"
          :readOnly="isProcessing || !isSourceValid || !isTargetValid"
          :label="isProcessing ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing') : $t('i18nCommon.postgreSQLQuery.databaseOps.cloneDatabase')"
        />
        <TMButton
          :noMargin="true"
          @click="handleClone(true)"
          :readOnly="isProcessing || !isSourceValid || !isTargetValid"
          :type="$tmEnum.buttonType.secondary"
          :label="isProcessing ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing') : $t('i18nCommon.postgreSQLQuery.databaseOps.cloneSchemaOnly')"
        />
        <TMButton
          :noMargin="true"
          @click="handleClose"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        />
      </div>
    </div>
  </TMPopup>
</template>

<script>
import TMPostgreSQLOperationPopup from "@/views/dialogs/postgresql/TMPostgreSQLOperationPopup.vue";

export default {
  name: "TMPostgreSQLClonePopup",
  extends: TMPostgreSQLOperationPopup,
  data() {
    return {
      srcImportType: this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
      srcConnStringFromApp: "",
      srcFields: {
        host: "",
        port: "5432",
        database: "",
        username: "",
        password: "",
        sslmode: "disable",
      },
      tgtImportType: this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
      tgtConnStringFromApp: "",
      tgtFields: {
        host: "",
        port: "5432",
        database: "",
        username: "",
        password: "",
        sslmode: "disable",
      },
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
  },
  methods: {
    loadCurrentConnection() {
      const conn = this.ownerForm?.allCollectionItems?.find(
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
          this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet
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
          this.$tmToast.error(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlError"),
          );
        }
      } else if (
        this.srcImportType === this.$tmEnum.PostreSQLConnectionImportType.PgxGo
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
          this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet
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
          this.$tmToast.error(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlError"),
          );
        }
      } else if (
        this.tgtImportType === this.$tmEnum.PostreSQLConnectionImportType.PgxGo
      ) {
        this.tgtFields = this.parseConnectionStringToFields(
          this.tgtConnStringFromApp,
        );
      }
    },
    async handleClone(schemaOnly = false) {
      this.isProcessing = true;
      this.saveCachedPgBinPath();
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
          { pgBinPath: this.pgBinPath, schemaOnly },
        );
        if (resp?.data?.success) {
          this.$tmToast.success(
            resp.data.message ||
              this.$t("i18nCommon.postgreSQLQuery.databaseOps.cloneSuccess"),
          );
        } else {
          this.$tmToast.error(
            resp?.data?.message || this.$t("i18nCommon.toastMessage.error"),
          );
        }
      } catch (e) {
        this.$tmToast.error(
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
.tm-pg-clone-popup {
  gap: var(--padding);
  margin: var(--padding);
}
.tm-pg-clone-section-header {
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
.tm-pg-clone-divider {
  width: 100%;
  height: 1px;
  background-color: var(--border-color);
  flex-shrink: 0;
  margin: 4px 0;
}
.tm-popup-actions {
  margin-top: 10px;
  gap: var(--padding);
}
</style>
