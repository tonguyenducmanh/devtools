<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="1000px"
    :title="$t('i18nCommon.APIMocking.ImportPlaceHolder')"
  >
    <div class="flex flex-col td-api-import-curl">
      <TDTextEditor
        :isLabelTop="true"
        v-model="mockContent"
        :enableHighlight="true"
        language="json"
        ref="mockContentInput"
        :placeHolder="importPlaceHolder"
      ></TDTextEditor>
      <!-- các nút dưới ô nhập -->
      <div class="flex">
        <TDButton
          @click="importMock"
          :label="$t('i18nCommon.apiTesting.importCURL')"
        ></TDButton>
        <TDButton
          @click="handleClose"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        ></TDButton>
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDServerMockAPI from "@/common/api/request/AgentAPI/TDServerMockAPI.js";

export default {
  name: "TDAPIMokingImportPopup",

  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
    currentConfigLayout: {
      type: Object,
      default: {},
    },
  },

  data() {
    return {
      mockContent: "",
      agentAPI: null,
    };
  },
  computed: {
    importPlaceHolder() {
      return `[
  {
    "request_name": "Get Users",
    "method": "GET",
    "end_point": "/api/users",
    "response_text": "{\\"data\\": []}",
    "status_code": 200
  }
]

// Hoặc nhập 1 mock object đơn lẻ:
{
  "request_name": "Get Users",
  "api_url": "https://example.com/api/users",
  "method": "GET",
  "response_text": "{\\"data\\": []}",
  "status_code": 200
}`;
    },
  },
  mounted() {
    let me = this;
    me.agentAPI = new TDServerMockAPI();
    me.$nextTick(() => {
      if (me.$refs.mockContentInput) {
        me.$refs.mockContentInput.focus();
      }
    });
  },
  methods: {
    show(param) {
      let me = this;
    },
    handleClose() {
      this.$emit("close");
    },

    /**
     * Detect input là array (bulk) hay object (single)
     * - Array: gọi batch API import hàng loạt
     * - Object đơn: fill form như cũ
     */
    async importMock() {
      let me = this;
      if (!me.mockContent) return;

      try {
        let parsed = JSON.parse(me.mockContent);

        if (Array.isArray(parsed)) {
          // ── Bulk import: gọi batch API ──
          await me.importBatchMocks(parsed);
        } else {
          // ── Single import: fill form ──
          me.importSingleMock(parsed);
        }
      } catch (e) {
        console.error("Lỗi parse JSON import mock:", e);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /**
     * Import 1 mock object đơn lẻ - fill vào form
     */
    importSingleMock(mockData) {
      let me = this;
      if (!mockData) return;

      me.ownerForm.currentMockId = null;
      me.ownerForm.requestName = mockData.request_name ?? mockData.api_url;

      // Hỗ trợ cả 2 dạng: api_url (full URL) và end_point (pathname)
      if (mockData.end_point) {
        me.ownerForm.httpMethod = mockData.method || "GET";
        me.ownerForm.apiUrl = mockData.end_point;
      } else if (mockData.api_url) {
        me.ownerForm.httpMethod = mockData.method;
        try {
          let pathname = new URL(mockData.api_url).pathname;
          me.ownerForm.apiUrl = pathname;
        } catch {
          me.ownerForm.apiUrl = mockData.api_url;
        }
      }

      me.ownerForm.headersText = mockData.headers_text || "";
      me.ownerForm.bodyText = mockData.body_text || "";
      me.ownerForm.responseText = mockData.response_text || "";
      me.ownerForm.responseHeadersText =
        mockData.response_headers_text || "";
      me.ownerForm.statusCode = mockData.status_code || null;

      me.handleClose();
    },

    /**
     * Import hàng loạt mock objects qua batch API
     */
    async importBatchMocks(mocks) {
      let me = this;

      // Normalize: convert từ nhiều format về format chuẩn của TDAPIMockItem
      let normalizedMocks = mocks.map((m) => {
        let endpoint = m.end_point || "";
        // Nếu có api_url nhưng không có end_point, extract pathname
        if (!endpoint && m.api_url) {
          try {
            endpoint = new URL(m.api_url).pathname;
          } catch {
            endpoint = m.api_url;
          }
        }

        return {
          request_name: m.request_name || "Untitled Mock",
          group_id: m.group_id || me.ownerForm.groupId || "",
          method: (m.method || "GET").toUpperCase(),
          end_point: endpoint,
          headers_text: m.headers_text || "",
          body_text: m.body_text || "",
          response_text: m.response_text || "",
          response_headers_text: m.response_headers_text || "",
          status_code: m.status_code || 200,
        };
      });

      try {
        let response = await me.agentAPI.importBatch(normalizedMocks);
        if (response && response.success && response.data?.success) {
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
          // Reload danh sách mock APIs ở owner form
          if (typeof me.ownerForm.loadAllMockAPIs === "function") {
            await me.ownerForm.loadAllMockAPIs();
          }
        }
      } catch (e) {
        console.error("Lỗi import batch mock:", e);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }

      me.handleClose();
    },
  },
};
</script>
<style scoped lang="scss">
.td-api-import-curl {
  height: 100%;
}
</style>
