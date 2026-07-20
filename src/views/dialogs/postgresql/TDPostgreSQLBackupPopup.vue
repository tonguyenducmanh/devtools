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
          @click="handleBackup(false)"
          :readOnly="isProcessing || !isValid"
          :label="isProcessing ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing') : $t('i18nCommon.postgreSQLQuery.databaseOps.backupToSql')"
        />
        <TDButton
          :noMargin="true"
          @click="handleBackup(true)"
          :readOnly="isProcessing || !isValid"
          :type="$tdEnum.buttonType.secondary"
          :label="isProcessing ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing') : $t('i18nCommon.postgreSQLQuery.databaseOps.backupSchemaOnly')"
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
import TDPostgreSQLOperationPopup from "@/views/dialogs/postgresql/TDPostgreSQLOperationPopup.vue";

export default {
  name: "TDPostgreSQLBackupPopup",
  extends: TDPostgreSQLOperationPopup,
  computed: {
    isValid() {
      return this.fields.host && this.fields.database && this.fields.username;
    },
  },
  methods: {
    async handleBackup(schemaOnly = false) {
      this.isProcessing = true;
      this.saveCachedPgBinPath();
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
          schemaOnly,
        );
        if (
          resp?.success &&
          typeof resp.data === "string" &&
          resp.data.length > 0
        ) {
          const d = new Date();
          const ts = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}_${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}_${String(d.getMinutes()).padStart(2, "0")}_${String(d.getSeconds()).padStart(2, "0")}`;
          const suffix = schemaOnly ? "_schema" : "";
          const fileName = this.$tdUtility.createFileDownloadName(
            `${this.fields.database}${suffix}_${ts}`,
            { ext: "sql" },
          );
          this.$tdUtility.createDownloadFileFromBuffer(resp.data, "text/sql;charset=utf-8", fileName);
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
