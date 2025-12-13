<template>
  <div class="flex flex-col container">
    <div class="paste-box">
      <TDHistory
        ref="history"
        :applyFunction="handleSendRequestFromHistory"
        titleKey="apiUrl"
        :cacheKey="$tdEnum.cacheConfig.APIHistory"
      ></TDHistory>
      <div>
        <TDInput
          v-model="apiUrl"
          :label="$t('i18nCommon.apiTesting.url')"
          :placeHolder="$t('i18nCommon.apiTesting.urlPlaceholder')"
        ></TDInput>
      </div>

      <div class="flex method-selection">
        <TDRadioGroup
          :label="$t('i18nCommon.apiTesting.method')"
          v-model="httpMethod"
          :options="methodOptions"
        />
      </div>

      <div class="flex flex-col text-area-box">
        <div class="flex text-area-request">
          <TDTextarea
            :label="$t('i18nCommon.apiTesting.headers')"
            :isLabelTop="true"
            v-model="headersText"
            :placeHolder="$t('i18nCommon.apiTesting.headersPlaceholder')"
          ></TDTextarea>

          <TDTextarea
            :label="$t('i18nCommon.apiTesting.body')"
            :isLabelTop="true"
            v-model="bodyText"
            :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
          ></TDTextarea>
        </div>
        <TDTextarea
          :label="$t('i18nCommon.apiTesting.response')"
          :isLabelTop="true"
          :modelValue="responseText"
          :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
          :readOnly="true"
        ></TDTextarea>
      </div>

      <div class="status-info" v-if="statusCode">
        <div class="status-badge" :class="statusClass">
          Status: {{ statusCode }}
        </div>
        <div class="response-time" v-if="responseTime">
          {{ responseTime }}ms
        </div>
      </div>
    </div>

    <div class="flex group-btn">
      <TDButton
        @click="handleSendRequest"
        :label="$t('i18nCommon.apiTesting.send')"
        :disabled="isLoading"
      ></TDButton>
      <TDButton
        @click="handleClear"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.apiTesting.clear')"
      ></TDButton>
      <TDButton
        @click="handleCopyResponse"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.apiTesting.copyResponse')"
      ></TDButton>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDAPITesting",
  data() {
    return {
      apiUrl: "",
      httpMethod: "GET",
      headersText: "Content-Type: application/json",
      bodyText: "",
      responseText: "",
      statusCode: null,
      responseTime: null,
      isLoading: false,
      startTime: null,
      methodOptions: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "PATCH", label: "PATCH" },
        { value: "DELETE", label: "DELETE" },
        { value: "HEAD", label: "HEAD" },
        { value: "OPTIONS", label: "OPTIONS" },
      ],
    };
  },
  computed: {
    statusClass() {
      if (!this.statusCode) return "";
      if (this.statusCode >= 200 && this.statusCode < 300) return "success";
      if (this.statusCode >= 300 && this.statusCode < 400) return "redirect";
      if (this.statusCode >= 400 && this.statusCode < 500)
        return "client-error";
      if (this.statusCode >= 500) return "server-error";
      return "";
    },
  },
  methods: {
    parseHeaders(headerString) {
      let headers = {};
      if (!headerString) return headers;

      headerString.split("\n").forEach((line) => {
        let trimmed = line.trim();
        if (trimmed) {
          let [key, ...valueParts] = trimmed.split(":");
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(":").trim();
          }
        }
      });

      return headers;
    },
    async handleSendRequest() {
      let me = this;
      if (!this.apiUrl) {
        this.$tdToast.error(null, this.$t("i18nCommon.apiTesting.urlRequired"));
        return;
      }

      this.isLoading = true;
      this.startTime = performance.now();

      try {
        let headers = this.parseHeaders(this.headersText);
        let requestData = {
          url: this.apiUrl,
          method: this.httpMethod,
          headers: headers,
        };

        if (this.bodyText) {
          requestData.body = this.bodyText;
        }

        let response;

        // Use extension if available
        if (
          window.__toolTomanh &&
          typeof window.__toolTomanh.callAPI === "function"
        ) {
          response = await window.__toolTomanh.callAPI(requestData);
        } else {
          this.$tdToast.error(
            null,
            me.$t("i18nCommon.apiTesting.extensionNotAvailable")
          );
        }

        let endTime = performance.now();
        this.responseTime = Math.round(endTime - this.startTime);
        this.statusCode = response.status;

        // Format response body
        if (typeof response.body === "object") {
          this.responseText = JSON.stringify(response.body, null, 2);
        } else if (typeof response.body === "string") {
          // Try to parse as JSON if it looks like JSON
          try {
            let parsed = JSON.parse(response.body);
            this.responseText = JSON.stringify(parsed, null, 2);
          } catch {
            this.responseText = response.body;
          }
        } else {
          this.responseText = String(response.body);
        }

        this.$tdToast.success(null, this.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        this.statusCode = null;
        this.responseText = `Error: ${error.message}`;
        this.$tdToast.error(null, `${error.message}`);
      } finally {
        this.isLoading = false;
        // Lưu text vào lịch sử nếu khác với lần lưu trước
        // so sánh input và output, nếu giống nhau thì xoá output
        let historyItem = {
          apiUrl: me.apiUrl,
          httpMethod: me.httpMethod,
          headersText: me.headersText,
          bodyText: me.bodyText,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    handleSendRequestFromHistory(item) {
      let me = this;
      if (item && item.apiUrl) {
        me.apiUrl = item.apiUrl;
        me.httpMethod = item.httpMethod;
        me.headersText = item.headersText;
        me.bodyText = item.bodyText;
        // lúc apply lịch sử mà gọi luôn hơi tốn server :v
        // await me.handleSendRequest();
      }
    },
    handleClear() {
      this.apiUrl = "";
      this.httpMethod = "GET";
      this.headersText = "Content-Type: application/json";
      this.bodyText = "";
      this.responseText = "";
      this.statusCode = null;
      this.responseTime = null;
    },
    handleCopyResponse() {
      if (this.responseText) {
        this.$tdUtility.copyToClipboard(this.responseText);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}

:deep .td-input {
  margin: unset;
}
.paste-box {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  .method-selection {
  }
  .text-area-box {
    gap: var(--padding);
    flex: 1;
    .text-area-request {
      gap: var(--padding);
      width: 100%;
      height: 100%;
    }
  }
}

.status-info {
  display: flex;
  align-items: center;
  gap: var(--padding);
  padding: var(--padding);
  background-color: var(--bg-secondary);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-weight: 600;
  color: white;
}

.status-badge.success {
  background-color: #10b981;
}

.status-badge.redirect {
  background-color: #3b82f6;
}

.status-badge.client-error {
  background-color: #f59e0b;
}

.status-badge.server-error {
  background-color: #ef4444;
}

.response-time {
  color: var(--text-secondary);
}
</style>
