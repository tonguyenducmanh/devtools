<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="700px"
    :title="
      isEditMode
        ? $t('i18nCommon.postgreSQLQuery.editConnection')
        : $t('i18nCommon.postgreSQLQuery.addConnection')
    "
  >
    <div class="flex flex-col td-pg-connection-popup">
      <div class="flex connection-row">
        <div>
          <TDInput
            v-model="form.connection_name"
            :noMargin="true"
            :label="$t('i18nCommon.postgreSQLQuery.connectionName')"
            :placeHolder="'My PostgreSQL DB'"
          />
        </div>
        <TDComboBox
          v-model="connFields.sslmode"
          label="SSL Mode"
          :noMargin="true"
          :options="sslModeOptions"
          :isEditable="false"
          @update:modelValue="buildConnectionString"
        />
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="connFields.host"
            :label="'Host'"
            :noMargin="true"
            :placeHolder="'localhost'"
            @input="buildConnectionString"
          />
        </div>
        <div class="">
          <TDInput
            v-model="connFields.port"
            :label="'Port'"
            :noMargin="true"
            :placeHolder="'5432'"
            @input="buildConnectionString"
          />
        </div>
      </div>
      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="connFields.username"
            :label="'Username'"
            :noMargin="true"
            :placeHolder="'postgres'"
            @input="buildConnectionString"
          />
        </div>
        <div class="">
          <TDInput
            v-model="connFields.password"
            :label="'Password'"
            :noMargin="true"
            :placeHolder="'••••••••'"
            :inputType="'password'"
            @input="buildConnectionString"
          />
        </div>
      </div>

      <div class="flex connection-row">
        <div class="flex-one">
          <TDInput
            v-model="connFields.database"
            :label="'Database'"
            :noMargin="true"
            :placeHolder="'postgres'"
            @input="buildConnectionString"
          />
        </div>
        <TDComboBox
          v-model="form.group_id"
          :label="$t('i18nCommon.postgreSQLQuery.groupName')"
          :placeHolder="$t('i18nCommon.postgreSQLQuery.groupName')"
          :options="groupOptions"
          :isEditable="false"
          :noMargin="true"
        />
      </div>
      <div class="flex connection-row">
        {{ $t("i18nCommon.postgreSQLQuery.connectionAddInfo") }}
      </div>
      <!-- Action buttons -->
      <div class="flex td-popup-actions">
        <TDButton
          :noMargin="true"
          @click="handleTestConnection"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.testConnection')"
        />
        <TDButton
          :noMargin="true"
          @click="handleSave"
          :label="
            isEditMode
              ? $t('i18nCommon.edit')
              : $t('i18nCommon.postgreSQLQuery.addConnection')
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

export default {
  name: "TDPostgreSQLConnectionPopup",

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
        host: "localhost",
        port: "5432",
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
    groupOptions() {
      let ownerGroups = this.ownerForm?.allGroups ?? [];
      return ownerGroups.map((g) => ({ value: g.id, label: g.name }));
    },
  },

  mounted() {
    this.agentAPI = new TDServerPostgreSQLAPI();
  },

  methods: {
    /**
     * Được gọi từ TDDialogUtil sau khi mount
     */
    show(param) {
      this.testResult = null;
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
          connection_name: "",
          group_id: param?.group_id ?? "",
          connection_string: "",
          connect_type: 0,
        };
        this.connFields = {
          host: "localhost",
          port: "5432",
          database: "",
          username: "",
          password: "",
          sslmode: "disable",
        };
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
     * Parse connection string thành các fields khi edit
     */
    parseConnectionString(connStr) {
      if (!connStr) return;
      this.connFields = {
        host: "localhost",
        port: "5432",
        database: "",
        username: "",
        password: "",
        sslmode: "disable",
      };

      try {
        if (
          connStr.startsWith("postgresql://") ||
          connStr.startsWith("postgres://")
        ) {
          // Parse URI format (tương thích ngược nếu người dùng đã lưu bằng URI format trước đây)
          const url = new URL(connStr);
          this.connFields.host = url.hostname || "localhost";
          this.connFields.port = url.port || "5432";
          this.connFields.database = url.pathname?.replace(/^\//, "") || "";
          this.connFields.username = decodeURIComponent(url.username || "");
          this.connFields.password = decodeURIComponent(url.password || "");
          this.connFields.sslmode =
            url.searchParams.get("sslmode") || "disable";
        } else {
          // Parse DSN format
          const parts = connStr.match(/(?:[^\s']+|'[^']*')+/g);
          if (parts) {
            parts.forEach((p) => {
              const eqIdx = p.indexOf("=");
              if (eqIdx > -1) {
                const key = p.substring(0, eqIdx).trim();
                let val = p.substring(eqIdx + 1).trim();
                // Bỏ nháy đơn nếu có
                if (val.startsWith("'") && val.endsWith("'")) {
                  val = val.substring(1, val.length - 1).replace(/\\'/g, "'");
                }
                if (key === "host") this.connFields.host = val;
                if (key === "port") this.connFields.port = val;
                if (key === "dbname") this.connFields.database = val;
                if (key === "user") this.connFields.username = val;
                if (key === "password") this.connFields.password = val;
                if (key === "sslmode") this.connFields.sslmode = val;
              }
            });
          }
        }
      } catch (e) {
        console.warn("Parse connection string failed:", e);
      }
    },

    handleCopy() {
      let me = this;
      if (me.form.connection_string) {
        me.$tdUtility.copyToClipboard(me.form.connection_string);
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      }
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },

    async handleTestConnection() {
      let me = this;
      me.buildConnectionString();
      if (!me.form.connection_string) {
        me.$tdToast.warning("Chưa có chuỗi kết nối để test.");
        return;
      }

      me.testResult = null;
      try {
        let response = await me.agentAPI.testConnection(
          me.form.connection_string,
        );
        if (response?.data?.success) {
          me.testResult = {
            success: true,
            message: response.data.message || "Kết nối thành công",
          };
          me.$tdToast.success("Kết nối thành công");
        } else {
          me.testResult = {
            success: false,
            message: response?.data?.message || "Kết nối thất bại",
          };
        }
      } catch (error) {
        me.testResult = {
          success: false,
          message: error?.message || "Đã có lỗi xảy ra",
        };
      }
    },

    async handleSave() {
      let me = this;

      // Validate
      if (!me.form.connection_name) {
        me.$tdToast.warning(
          me.$t("i18nCommon.postgreSQLQuery.connectionName") +
            " " +
            me.$t("i18nCommon.toastMessage.required"),
        );
        return;
      }
      if (!me.connFields.host || !me.connFields.database) {
        me.$tdToast.warning("Host và Database là bắt buộc");
        return;
      }

      // Build connection string mới nhất
      me.buildConnectionString();

      try {
        let response;
        if (me.isEditMode && me.form.id) {
          response = await me.agentAPI.connection.update(me.form);
          if (response?.data?.success) {
            me.$tdToast.success(
              me.$t("i18nCommon.postgreSQLQuery.updateConnectionSuccess"),
            );
            me.handleClose({ saved: true });
          }
        } else {
          let payload = { ...me.form };
          delete payload.id;
          response = await me.agentAPI.connection.create(payload);
          if (response?.data?.success) {
            me.$tdToast.success(
              me.$t("i18nCommon.postgreSQLQuery.createConnectionSuccess"),
            );
            me.handleClose({ saved: true });
          }
        }
      } catch {
        me.$tdToast.error(
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
.td-pg-connection-popup {
  gap: var(--padding);
  margin: calc(var(--padding) * 2) var(--padding);
}
.connection-row {
  gap: var(--padding);
  width: 100%;
  align-items: center;
  justify-content: flex-start;
}
/* Test result */
.td-pg-test-result {
  display: flex;
  align-items: center;
  gap: var(--padding);
  padding: 8px var(--padding);
  border-radius: var(--border-radius);
  font-size: var(--font-size-small);
}

.td-pg-test-ok {
  background-color: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.td-pg-test-err {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Actions */
.td-popup-actions {
  margin-top: 30px;
  gap: var(--padding);
}
</style>
