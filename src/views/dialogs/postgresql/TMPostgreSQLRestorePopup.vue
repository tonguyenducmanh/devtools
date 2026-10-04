<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="600px"
    height="410px"
    :title="$t('i18nCommon.postgreSQLQuery.databaseOps.restoreFromSql')"
  >
    <div class="flex flex-col tm-pg-restore-popup">
      <div class="flex connection-row">
        <TMComboBox
          v-model="importType"
          :noMargin="true"
          :options="importTypeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TMInput
            v-model="connStringFromApp"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.connectionStringPlaceHolder')
            "
          />
        </div>
        <TMButton
          :noMargin="true"
          iconClass="tm-send-icon"
          :readOnly="!connStringFromApp"
          @click="convertConnString"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.convert')"
        />
      </div>
      <div class="flex connection-row">
        <TMComboBox
          v-model="fields.sslmode"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
        />
        <div class="flex-one">
          <TMInput
            v-model="fields.database"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.databaseName')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="fields.host"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.hostPlaceholder')"
          />
        </div>
        <div class="">
          <TMInput
            v-model="fields.port"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.portPlaceholder')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="fields.username"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.usernamePlaceholder')"
          />
        </div>
        <div class="">
          <TMInput
            v-model="fields.password"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.passwordPlaceholder')"
            :inputType="'password'"
          />
        </div>
      </div>

      <TMUpload
        ref="upload"
        :label="$t('i18nCommon.postgreSQLQuery.databaseOps.dumpFile')"
        :labelEmpty="$t('i18nCommon.postgreSQLQuery.databaseOps.dropOrClick')"
        @selected="handleFileSelected"
      />

      <div class="tm-pg-restore-section-header">
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
          @click="handleRestore"
          :readOnly="isProcessing || !isValid || !dumpFile"
          :label="
            isProcessing
              ? $t('i18nCommon.postgreSQLQuery.databaseOps.processing')
              : $t('i18nCommon.postgreSQLQuery.databaseOps.restoreFromSql')
          "
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
  name: "TMPostgreSQLRestorePopup",
  extends: TMPostgreSQLOperationPopup,
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
        this.$tmToast.warning(
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
          this.$tmToast.success(
            resp.data.message ||
              this.$t("i18nCommon.postgreSQLQuery.databaseOps.restoreSuccess"),
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
.tm-pg-restore-popup {
  gap: var(--padding);
  margin: var(--padding);
}
.connection-row {
  gap: var(--padding);
  width: 100%;
  align-items: center;
  justify-content: flex-start;
}
.tm-pg-restore-section-header {
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
  font-weight: 600;
  flex-shrink: 0;
}
.tm-popup-actions {
  margin-top: 10px;
  gap: var(--padding);
}
</style>
