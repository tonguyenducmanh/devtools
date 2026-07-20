<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="600px"
    height="410px"
    :title="$t('i18nCommon.postgreSQLQuery.databaseOps.restoreFromSql')"
  >
    <div class="flex flex-col td-pg-restore-popup">
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

      <TDUpload
        ref="upload"
        :label="$t('i18nCommon.postgreSQLQuery.databaseOps.dumpFile')"
        :labelEmpty="$t('i18nCommon.postgreSQLQuery.databaseOps.dropOrClick')"
        @selected="handleFileSelected"
      />

      <div class="td-pg-restore-section-header">
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
          @click="handleRestore"
          :readOnly="isProcessing || !isValid || !dumpFile"
          :label="
            isProcessing
              ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing')
              : $t('i18nCommon.postgreSQLQuery.databaseOps.restoreFromSql')
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
import TDPostgreSQLOperationPopup from "@/views/dialogs/postgresql/TDPostgreSQLOperationPopup.vue";

export default {
  name: "TDPostgreSQLRestorePopup",
  extends: TDPostgreSQLOperationPopup,
  data() {
    return {
      dumpFile: null,
      dumpFileName: "",
    };
  },
  computed: {
    isValid() {
      return this.fields.host && this.fields.database && this.fields.username;
    },
  },
  methods: {
    handleFileSelected(files) {
      const file = files?.[0];
      if (file) {
        this.dumpFileName = file.name;
        this.dumpFile = file;
      }
    },
    async handleRestore() {
      if (!this.dumpFile) {
        this.$tdToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.databaseOps.noDumpFile"),
        );
        return;
      }
      this.isProcessing = true;
      this.saveCachedPgBinPath();
      try {
        const resp = await this.agentAPI.restoreDatabase(
          {
            host: this.fields.host,
            port: this.fields.port,
            user: this.fields.username,
            password: this.fields.password,
            dbname: this.fields.database,
          },
          this.dumpFile,
          { pgBinPath: this.pgBinPath },
        );
        if (resp?.data?.success) {
          this.$tdToast.success(
            resp.data.message ||
              this.$t("i18nCommon.postgreSQLQuery.databaseOps.restoreSuccess"),
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
.td-pg-restore-popup {
  gap: var(--padding);
  margin: var(--padding);
}
.connection-row {
  gap: var(--padding);
  width: 100%;
  align-items: center;
  justify-content: flex-start;
}
.td-pg-restore-section-header {
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
  font-weight: 600;
  flex-shrink: 0;
}
.td-popup-actions {
  margin-top: 10px;
  gap: var(--padding);
}
</style>
