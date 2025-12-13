<template>
  <div class="flex flex-col container">
    <div class="paste-box">
      <div class="api-section">
        <!-- URL Input -->
        <div class="form-group">
          <label>{{ $t("i18nCommon.apiTesting.url") }}</label>
          <TDInput
            v-model="apiUrl"
            :placeHolder="$t('i18nCommon.apiTesting.urlPlaceholder')"
          ></TDInput>
        </div>

        <!-- Method Selection -->
        <div class="form-group">
          <label>{{ $t("i18nCommon.apiTesting.method") }}</label>
          <TDRadioGroup
            v-model="httpMethod"
            :options="methodOptions"
          />
        </div>

        <!-- Headers Input -->
        <div class="form-group">
          <label>{{ $t("i18nCommon.apiTesting.headers") }}</label>
          <TDTextarea
            v-model="headersText"
            :placeHolder="$t('i18nCommon.apiTesting.headersPlaceholder')"
          ></TDTextarea>
        </div>

        <!-- Body Input (for POST, PUT, PATCH) -->
        <div class="form-group" v-if="['POST', 'PUT', 'PATCH'].includes(httpMethod)">
          <label>{{ $t("i18nCommon.apiTesting.body") }}</label>
          <TDTextarea
            v-model="bodyText"
            :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
          ></TDTextarea>
        </div>

        <!-- Response Output -->
        <div class="form-group">
          <label>{{ $t("i18nCommon.apiTesting.response") }}</label>
          <TDTextarea
            :modelValue="responseText"
            :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
            :disabled="true"
          ></TDTextarea>
        </div>

        <!-- Status Info -->
        <div class="status-info" v-if="statusCode">
          <div class="status-badge" :class="statusClass">
            Status: {{ statusCode }}
          </div>
          <div class="response-time" v-if="responseTime">
            {{ responseTime }}ms
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
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
      if (this.statusCode >= 400 && this.statusCode < 500) return "client-error";
      if (this.statusCode >= 500) return "server-error";
      return "";
    },
  },
  methods: {
    parseHeaders(headerString) {
      const headers = {};
      if (!headerString) return headers;
      
      headerString.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) {
          const [key, ...valueParts] = trimmed.split(":");
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(":").trim();
          }
        }
      });
      
      return headers;
    },
    async handleSendRequest() {
      if (!this.apiUrl) {
        this.$tdToast.error(null, this.$t("i18nCommon.apiTesting.urlRequired"));
        return;
      }

      this.isLoading = true;
      this.startTime = performance.now();

      try {
        const headers = this.parseHeaders(this.headersText);
        const requestData = {
          url: this.apiUrl,
          method: this.httpMethod,
          headers: headers,
        };

        if (["POST", "PUT", "PATCH"].includes(this.httpMethod) && this.bodyText) {
          requestData.body = this.bodyText;
        }

        let response;
        
        // Use extension if available
        if (window.__toolTomanh && typeof window.__toolTomanh.callAPI === "function") {
          response = await window.__toolTomanh.callAPI(requestData);
        } else {
          throw new Error("Extension not available");
        }

        const endTime = performance.now();
        this.responseTime = Math.round(endTime - this.startTime);
        this.statusCode = response.status;

        // Format response body
        if (typeof response.body === "object") {
          this.responseText = JSON.stringify(response.body, null, 2);
        } else if (typeof response.body === "string") {
          // Try to parse as JSON if it looks like JSON
          try {
            const parsed = JSON.parse(response.body);
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

<style scoped>
.container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}

.paste-box {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  padding-bottom: var(--padding);
}

.api-section {
  display: flex;
  flex-direction: column;
  gap: var(--padding);
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.group-btn {
  justify-content: flex-start;
  gap: var(--padding);
  margin-top: var(--padding);
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
