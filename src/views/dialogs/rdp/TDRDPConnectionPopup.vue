<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    :showFullScreenHeaderIcon="false"
    :resizable="false"
    width="480px"
    height="auto"
    :title="
      isEditMode
        ? $t('i18nCommon.remoteDesktop.editConnection')
        : $t('i18nCommon.remoteDesktop.addConnection')
    "
    @close="handleClose"
  >
    <div class="flex flex-col td-rdp-connection-popup">
      <TDInput
        v-model="form.connection_name"
        :noMargin="true"
        :placeHolder="$t('i18nCommon.remoteDesktop.connectionNamePlaceholder')"
      />

      <div class="flex td-rdp-connection-row">
        <TDComboBox
          v-model="form.group_id"
          :noMargin="true"
          :isEditable="false"
          :placeHolder="$t('i18nCommon.collection.groupName')"
          :options="groupOptions"
          :noSetBorderRadius="false"
        />
        <TDInput
          v-model="form.host"
          :noMargin="true"
          :placeHolder="$t('i18nCommon.remoteDesktop.hostPlaceholder')"
          @keyup.enter="handleSave"
        />
      </div>

      <TDInput
        v-model="form.username"
        :noMargin="true"
        :placeHolder="$t('i18nCommon.remoteDesktop.usernamePlaceholder')"
      />

      <TDInput
        v-model="form.password"
        :noMargin="true"
        :inputType="'password'"
        :placeHolder="$t('i18nCommon.remoteDesktop.passwordPlaceholder')"
        @keyup.enter="handleSave"
      />

      <div class="flex td-rdp-connection-actions">
        <TDButton
          :noMargin="true"
          :label="
            isEditMode
              ? $t('i18nCommon.edit')
              : $t('i18nCommon.remoteDesktop.addConnection')
          "
          @click="handleSave"
        />
        <TDButton
          :noMargin="true"
          :label="$t('i18nCommon.toastMessage.cancel')"
          :type="$tdEnum.buttonType.secondary"
          @click="handleClose"
        />
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDPopup from "@/components/TDPopup.vue";
import TDServerRDPAPI from "@/common/api/request/AgentAPI/TDServerRDPAPI.js";

/**
 * TDRDPConnectionPopup - popup thêm / sửa RDP connection.
 *
 * Trước đây form nhập nằm nhúng thẳng trong sidebar của tool RDP, chiếm chỗ và
 * không nhất quán với các tool khác (postgresql đã dùng popup).
 * Nay chuyển sang popup cho đồng nhất với pattern master-detail.
 */
export default {
  name: "TDRDPConnectionPopup",
  components: {
    TDPopup,
  },

  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
  },
  emits: ["close"],

  data() {
    return {
      isEditMode: false,
      form: {
        id: null,
        connection_name: "",
        group_id: "",
        host: "",
        username: "",
        password: "",
      },
      agentAPI: null,
    };
  },

  computed: {
    /**
     * Option nhóm lấy từ cây collection của tool chủ nhật
     */
    groupOptions() {
      return this.ownerForm?.collectionGroupOptions ?? [];
    },
  },

  mounted() {
    this.agentAPI = new TDServerRDPAPI();
  },

  methods: {
    /**
     * Được gọi từ TDDialogUtil ngay sau khi mount
     * @param {Object} param
     *        - connection: object cần sửa, bỏ trống nếu tạo mới
     *        - group_id: group được chọn sẵn (khi bấm "+" trên 1 group)
     */
    show(param = {}) {
      let connection = param?.connection;
      this.isEditMode = !!connection?.id;

      this.form = {
        id: connection?.id ?? null,
        connection_name: connection?.connection_name ?? "",
        group_id: connection?.group_id ?? param?.group_id ?? "",
        host: connection?.host ?? "",
        username: connection?.username ?? "",
        password: connection?.password ?? "",
      };
    },

    async handleSave() {
      let me = this;

      if (!me.form.connection_name.trim()) {
        me.$tdToast.warning(
          me.$t("i18nCommon.remoteDesktop.connectionNameRequired"),
        );
        return;
      }
      if (!me.form.host.trim()) {
        me.$tdToast.warning(me.$t("i18nCommon.remoteDesktop.hostRequired"));
        return;
      }

      try {
        let response;
        if (me.isEditMode && me.form.id) {
          response = await me.agentAPI.rdpConnection.update(me.form);
          if (response?.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            me.handleClose({ saved: true });
          }
        } else {
          let payload = { ...me.form };
          delete payload.id;
          response = await me.agentAPI.rdpConnection.create(payload);
          if (response?.data?.success) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
            me.handleClose({ saved: true, id: response.data?.data?.id });
          }
        }
      } catch (error) {
        console.error("Lỗi lưu RDP connection:", error);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    handleClose(payload) {
      this.$emit("close", payload);
    },
  },
};
</script>

<style scoped lang="scss">
.td-rdp-connection-popup {
  gap: var(--padding);
  padding: var(--padding);

  .td-rdp-connection-row {
    gap: var(--padding);
    width: 100%;
  }

  .td-rdp-connection-actions {
    gap: var(--padding);
    margin-top: var(--padding);
    justify-content: flex-end;
  }
}
</style>
