<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="700px"
    height="340px"
    :title="
      isEditMode
        ? $t('i18nCommon.postgreSQLQuery.editConnection')
        : $t('i18nCommon.postgreSQLQuery.addConnection')
    "
  >
    <div class="flex flex-col tm-pg-connection-popup">
      <div class="flex connection-row">
        <TMComboBox
          v-model="connFields.sslmode"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.sslMode')"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
          @update:modelValue="buildConnectionString"
        />
        <div class="flex-one">
          <TMInput
            v-model="form.connection_name"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.connectionName')"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div>
          <TMComboBox
            v-model="inputType"
            v-tooltip="$t('i18nCommon.postgreSQLQuery.importType')"
            :noMargin="true"
            :options="inputTypeOptions"
            :isEditable="false"
          />
        </div>
        <div class="flex-one">
          <TMInput
            v-model="connectionStringFromAnotherApp"
            :noMargin="true"
            :placeHolder="
              $t('i18nCommon.postgreSQLQuery.connectionStringPlaceHolder')
            "
          />
        </div>
        <TMButton
          :noMargin="true"
          @click="handleConvertConnectionStringFromAnotherApp"
          :readOnly="!connectionStringFromAnotherApp"
          iconClass="tm-send-icon"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.convert')"
        />
      </div>
      <div class="flex connection-row">
        <TMComboBox
          v-model="form.group_id"
          v-tooltip="$t('i18nCommon.postgreSQLQuery.groupName')"
          :placeHolder="$t('i18nCommon.postgreSQLQuery.groupName')"
          :options="groupOptions"
          :isEditable="false"
          :noMargin="true"
        />
        <div class="flex-one">
          <TMInput
            v-model="connFields.database"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.databaseName')"
            @input="buildConnectionString"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="connFields.host"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.hostPlaceholder')"
            :noMargin="true"
            @input="buildConnectionString"
          />
        </div>
        <div class="">
          <TMInput
            v-model="connFields.port"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.portPlaceholder')"
            @input="buildConnectionString"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TMInput
            v-model="connFields.username"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.usernamePlaceholder')"
            @input="buildConnectionString"
          />
        </div>
        <div class="">
          <TMInput
            v-model="connFields.password"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.postgreSQLQuery.passwordPlaceholder')"
            :inputType="'password'"
            @input="buildConnectionString"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex tm-popup-actions">
        <TMButton
          :noMargin="true"
          @click="handleSave"
          :label="
            isEditMode
              ? $t('i18nCommon.edit')
              : $t('i18nCommon.postgreSQLQuery.addConnection')
          "
        />
        <TMButton
          :noMargin="true"
          @click="handleTestConnection"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.postgreSQLQuery.saveAndTestConnection')"
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
import TMServerPostgreSQLAPI from "@/common/api/request/AgentAPI/TMServerPostgreSQLAPI.js";
import TMDatabaseConnectionMixin from "@/mixins/TMDatabaseConnectionMixin.js";
import TMDotNetWasmMixin from "@/mixins/TMDotNetWasmMixin.js";

export default {
  name: "TMPostgreSQLConnectionPopup",
  mixins: [TMDatabaseConnectionMixin, TMDotNetWasmMixin],

  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      isEditMode: false,
      showPassword: false,
      testResult: null,

      // Điều khiển loại Input dữ liệu đầu vào
      inputType: this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
      connectionStringFromAnotherApp: "",
      inputTypeOptions: [
        {
          value: this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet,
          label: this.$t("i18nCommon.postgreSQLQuery.importNpgSQL"),
        },
        {
          value: this.$tmEnum.PostreSQLConnectionImportType.PgxGo,
          label: this.$t("i18nCommon.postgreSQLQuery.importPgxGo"),
        },
      ],

      // Form chính
      form: {
        id: null,
        connection_name: "",
        group_id: "",
        connection_string: "",
        connect_type: 0,
      },

      // Các field tách riêng để build connection string
      connFields: {
        host: "",
        port: "",
        database: "",
        username: "",
        password: "",
        sslmode: "disable",
      },

      sslModeOptions: [
        { value: "disable", label: "disable" },
        { value: "require", label: "require" },
        { value: "verify-ca", label: "verify-ca" },
        { value: "verify-full", label: "verify-full" },
        { value: "prefer", label: "prefer" },
        { value: "allow", label: "allow" },
      ],

      agentAPI: null,
    };
  },

  computed: {
    /**
     * Danh sách nhóm lấy từ cây collection của tool chủ nhật
     */
    groupOptions() {
      return this.ownerForm?.collectionGroupOptions ?? [];
    },
  },

  mounted() {
    this.agentAPI = new TMServerPostgreSQLAPI();
  },

  methods: {
    /**
     * Gọi hàm C# WASM để convert Npgsql connection string sang Object
     */
    handleConvertConnectionStringFromAnotherApp() {
      if (!this.connectionStringFromAnotherApp.trim()) {
        this.$tmToast.warning(
          this.$t("i18nCommon.postgreSQLQuery.convertConnectionStringRequired"),
        );
        return;
      }
      // convert NgSQL connect
      if (
        this.checkInitDotNetWasm() &&
        this.inputType ==
          this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet
      ) {
        try {
          // Thực hiện lệnh convert từ C#
          const jsonResult = this.dotnetExports.ParseNpgSQLConnection(
            this.connectionStringFromAnotherApp.trim(),
          );
          const parsedObj = JSON.parse(jsonResult);

          // Đổ ngược dữ liệu đã phân tích vào các trường input trên Form
          this.connFields.host = parsedObj.host || "";
          this.connFields.port = parsedObj.port ? String(parsedObj.port) : "";
          this.connFields.username = parsedObj.user_name || "";
          this.connFields.password = parsedObj.password || "";
          this.connFields.database = parsedObj.database_name || "";

          // Tái tạo lại chuỗi DSN chuẩn lưu vào form
          this.buildConnectionString();
          this.$tmToast.success(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlSuccess"),
          );
        } catch (e) {
          console.error(e);
          this.$tmToast.error(
            this.$t("i18nCommon.postgreSQLQuery.convertNpgsqlError"),
          );
        }
      } else if (
        this.inputType == this.$tmEnum.PostreSQLConnectionImportType.PgxGo
      ) {
        this.parseConnectionString(this.connectionStringFromAnotherApp);
      }
    },

    /**
     * Được gọi từ TMDialogUtil sau khi mount
     */
    show(param) {
      this.testResult = null;
      this.connectionStringFromAnotherApp = "";
      this.inputType = this.$tmEnum.PostreSQLConnectionImportType.NpgSQLDotNet;

      if (param && param.id) {
        // Edit mode: parse connection string ngược lại thành các fields
        this.isEditMode = true;
        this.form = {
          id: param.id,
          connection_name: param.connection_name ?? "",
          group_id: param.group_id ?? "",
          connection_string: param.connection_string ?? "",
          connect_type: param.connect_type ?? 0,
        };
        this.parseConnectionString(param.connection_string ?? "");
      } else {
        // Add mode
        this.isEditMode = false;
        this.form = {
          id: null,
          connection_name: param?.connection_name ?? "",
          group_id: param?.group_id ?? "",
          connection_string: "",
          connect_type: 0,
        };
        // Cho phép pre-fill connFields từ param (vd: từ tính năng list databases)
        if (param?.connFields) {
          this.connFields = { ...this.connFields, ...param.connFields };
        } else {
          this.connFields = {
            host: "localhost",
            port: "5432",
            database: "",
            username: "",
            password: "",
            sslmode: "disable",
          };
        }
        if (param?.connFields) {
          this.buildConnectionString();
        }
      }
    },

    /**
     * Build connection string (DSN format) từ các fields riêng lẻ
     */
    buildConnectionString() {
      let f = this.connFields;
      if (!f.host && !f.database) {
        this.form.connection_string = "";
        return;
      }

      // Format DSN: host=127.0.0.1 port=5432 user=myuser password='mypassword' dbname=mydb sslmode=disable
      let parts = [];
      if (f.host) parts.push(`host=${f.host}`);
      if (f.port) parts.push(`port=${f.port}`);
      if (f.database) parts.push(`dbname=${f.database}`);
      if (f.username) parts.push(`user=${f.username}`);
      if (f.password) {
        // Nếu password có dấu cách hoặc dấu nháy đơn, nên bọc trong nháy đơn
        let pwd = f.password;
        if (pwd.includes(" ") || pwd.includes("'")) {
          pwd = "'" + pwd.replace(/'/g, "\\'") + "'";
        }
        parts.push(`password=${pwd}`);
      }
      if (f.sslmode) parts.push(`sslmode=${f.sslmode}`);

      this.form.connection_string = parts.join(" ");
    },

    /**
     * Parse connection string thành các fields khi edit, dùng chung logic từ mixin
     */
    parseConnectionString(connStr) {
      if (!connStr) return;
      // Dùng method từ TMDatabaseConnectionMixin để parse
      let fields = this.parseConnectionStringToFields(connStr);
      this.connFields = {
        host: fields.host,
        port: fields.port,
        database: fields.database,
        username: fields.username,
        password: fields.password,
        sslmode: fields.sslmode,
      };
    },

    handleCopy() {
      let me = this;
      if (me.form.connection_string) {
        me.$tmUtility.copyToClipboard(me.form.connection_string);
      }
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },

    async handleTestConnection() {
      let me = this;

      if (!me.form.connection_name) {
        me.$tmToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.connectionName") +
            " " +
            me.$t("i18nCommon.toastMessage.required"),
        );
        return;
      }
      if (!me.connFields.host || !me.connFields.database) {
        me.$tmToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.hostAndDbRequired"),
        );
        return;
      }

      me.buildConnectionString();

      try {
        let response;
        if (me.isEditMode && me.form.id) {
          response = await me.agentAPI.connection.update(me.form);
        } else {
          let payload = { ...me.form };
          delete payload.id;
          response = await me.agentAPI.connection.create(payload);
          if (response?.data?.success) {
            me.form.id = response.data.data.id;
            me.isEditMode = true;
          }
        }

        if (!response?.data?.success) {
          me.$tmToast.error(
            me.isEditMode
              ? me.$t("i18nCommon.postgreSQLQuery.updateConnectionErr")
              : me.$t("i18nCommon.postgreSQLQuery.createConnectionErr"),
          );
          return;
        }
      } catch {
        me.$tmToast.error(
          me.isEditMode
            ? me.$t("i18nCommon.postgreSQLQuery.updateConnectionErr")
            : me.$t("i18nCommon.postgreSQLQuery.createConnectionErr"),
        );
        return;
      }

      me.testResult = await me.testDatabaseConnection(me.agentAPI, me.form.id);
    },

    async handleSave() {
      let me = this;

      // Validate
      if (!me.form.connection_name) {
        me.$tmToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.connectionName") +
            " " +
            me.$t("i18nCommon.toastMessage.required"),
        );
        return;
      }
      if (!me.connFields.host || !me.connFields.database) {
        me.$tmToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.hostAndDbRequired"),
        );
        return;
      }

      // Build connection string mới nhất
      me.buildConnectionString();

      try {
        let response;
        if (me.isEditMode && me.form.id) {
          response = await me.agentAPI.connection.update(me.form);
          if (response?.data?.success) {
            me.$tmToast.success(
              me.$t("i18nCommon.postgreSQLQuery.updateConnectionSuccess"),
            );
            me.handleClose({ saved: true });
          }
        } else {
          let payload = { ...me.form };
          delete payload.id;
          response = await me.agentAPI.connection.create(payload);
          if (response?.data?.success) {
            me.$tmToast.success(
              me.$t("i18nCommon.postgreSQLQuery.createConnectionSuccess"),
            );
            me.handleClose({ saved: true });
          }
        }
      } catch {
        me.$tmToast.error(
          me.isEditMode
            ? me.$t("i18nCommon.postgreSQLQuery.updateConnectionErr")
            : me.$t("i18nCommon.postgreSQLQuery.createConnectionErr"),
        );
      }
    },
  },
};
</script>

<style scoped lang="scss">
.tm-pg-connection-popup {
  gap: var(--padding);
  margin: calc(var(--padding) * 2) var(--padding);
}
.connection-row {
  gap: var(--padding);
  width: 100%;
  align-items: center;
  justify-content: flex-start;
}

/* Actions */
.tm-popup-actions {
  margin-top: 10px;
  gap: var(--padding);
}
</style>
