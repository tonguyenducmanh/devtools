<template>
  <div class="flex flex-col container">
    <template v-if="isImportingCURL">
      <TDTextarea
        :isLabelTop="true"
        v-model="curlContent"
        :placeHolder="$t('i18nCommon.apiTesting.contentCURL')"
      ></TDTextarea>
      <div class="flex">
        <TDButton
          @click="importCURL"
          :label="$t('i18nCommon.apiTesting.importCURL')"
          :disabled="isLoading"
        ></TDButton>
        <TDButton
          @click="cancelImportCURL"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        ></TDButton>
      </div>
    </template>
    <template v-else>
      <div class="paste-box">
        <TDHistory
          ref="history"
          :applyFunction="handleSendRequestFromHistory"
          titleKey="apiUrl"
          :cacheKey="$tdEnum.cacheConfig.APIHistory"
        ></TDHistory>
        <div class="flex">
          <TDComboBox v-model="httpMethod" :options="methodOptions" />
          <TDInput
            v-model="apiUrl"
            :placeHolder="$t('i18nCommon.apiTesting.urlPlaceholder')"
          ></TDInput>
          <TDButton
            @click="openFormImportCURL"
            :type="$tdEnum.buttonType.secondary"
            :debounceTime="100"
            :label="$t('i18nCommon.apiTesting.importCURL')"
          ></TDButton>
        </div>
        <div class="flex text-area-box">
          <div class="flex flex-col text-area-request">
            <div class="flex request-area-title">
              <TDRadioGroup
                v-model="currentAPIInfoOption"
                :options="APIInfoOptions"
              />
            </div>
            <TDTextarea
              v-if="currentAPIInfoOption == $tdEnum.APIInfoOption.header"
              :isLabelTop="true"
              v-model="headersText"
              :placeHolder="$t('i18nCommon.apiTesting.headersPlaceholder')"
            ></TDTextarea>
            <TDTextarea
              v-if="currentAPIInfoOption == $tdEnum.APIInfoOption.body"
              :isLabelTop="true"
              v-model="bodyText"
              :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
            ></TDTextarea>
          </div>
          <div class="flex flex-col text-area-response">
            <div class="flex response-area-title">
              <div>
                {{ $t("i18nCommon.apiTesting.response") }}
              </div>
              <div>
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
            <TDTextarea
              :isLabelTop="true"
              :modelValue="responseText"
              :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
              :readOnly="true"
            ></TDTextarea>
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
        <TDButton
          @click="handleCopyCurl"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.copyCURL')"
        ></TDButton>
        <TDButton
          @click="downloadExtension"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.downloadExtension')"
        ></TDButton>
      </div>
    </template>
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
      isImportingCURL: false,
      curlContent: "",
      methodOptions: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "PATCH", label: "PATCH" },
        { value: "DELETE", label: "DELETE" },
        { value: "HEAD", label: "HEAD" },
        { value: "OPTIONS", label: "OPTIONS" },
      ],
      currentAPIInfoOption: 2,
      APIInfoOptions: [
        { value: this.$tdEnum.APIInfoOption.header, label: "Header" },
        { value: this.$tdEnum.APIInfoOption.body, label: "Body" },
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
    downloadExtension() {
      let me = this;
      me.$tdUtility.goToSource("releases");
    },
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
    buildCurlFromRequest() {
      let me = this;
      let historyItem = {
        apiUrl: me.apiUrl,
        httpMethod: me.httpMethod,
        headersText: me.headersText,
        bodyText: me.bodyText,
      };
      if (!historyItem?.apiUrl) throw new Error("apiUrl is required");

      let lines = [];

      // base curl
      lines.push(`curl '${historyItem.apiUrl}'`);

      // method
      let method = (historyItem.httpMethod || "GET").toUpperCase();
      if (method !== "GET") {
        lines.push(`--request ${method}`);
      }

      // headers
      if (historyItem.headersText) {
        historyItem.headersText
          .split("\n")
          .map((h) => h.trim())
          .filter(Boolean)
          .forEach((header) => {
            lines.push(`--header '${me.escapeShell(header)}'`);
          });
      }

      // body
      if (historyItem.bodyText && historyItem.bodyText.trim() !== "") {
        lines.push(`--data '${me.escapeShell(historyItem.bodyText)}'`);
      }

      return lines.join(" \\\n");
    },
    escapeShell(value) {
      return String(value).replace(/'/g, `'\\''`);
    },

    handleClear() {
      this.apiUrl = "";
      this.httpMethod = "GET";
      this.headersText = "Content-Type: application/json";
      this.bodyText = "";
      this.responseText = "";
      this.statusCode = null;
      this.responseTime = null;
      this.curlContent = "";
    },
    handleCopyResponse() {
      if (this.responseText) {
        this.$tdUtility.copyToClipboard(this.responseText);
      }
    },
    handleCopyCurl() {
      let me = this;
      let curlBuilded = me.buildCurlFromRequest();
      if (curlBuilded) {
        me.$tdUtility.copyToClipboard(curlBuilded);
      } else {
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
    parseCurl(curlText) {
      let me = this;
      let result = {
        url: "",
        method: "GET",
        headers: {},
        body: null,
        headersText: "",
      };
      let allHeaders = [];
      // normalize
      let tokens = curlText
        .replace(/\\\n/g, " ")
        .replace(/\n/g, " ")
        .match(/'[^']*'|"[^"]*"|\S+/g);

      for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        // URL
        if (token.startsWith("http") || token.startsWith("'http")) {
          result.url = me.strip(token);
        }

        // Method
        if (token === "-X" || token === "--request") {
          result.method = me.strip(tokens[++i]).toUpperCase();
        }

        // Headers
        if (token === "-H" || token === "--header") {
          let header = me.strip(tokens[++i]);
          let [key, ...rest] = header.split(":");
          result.headers[key.trim()] = rest.join(":").trim();
          allHeaders.push(header);
        }

        // Body
        if (
          token === "--data" ||
          token === "--data-raw" ||
          token === "--data-binary" ||
          token === "-d"
        ) {
          result.body = me.strip(tokens[++i]);
          if (result.method === "GET") {
            result.method = "POST";
          }
        }
      }

      if (allHeaders && allHeaders.length > 0) {
        result.headersText = allHeaders.join("\n");
      }
      return result;
    },
    strip(str) {
      return str.replace(/^['"]|['"]$/g, "");
    },
    openFormImportCURL() {
      let me = this;
      me.isImportingCURL = true;
    },
    importCURL() {
      let me = this;
      let CURLParsed = me.parseCurl(me.curlContent);
      if (CURLParsed) {
        me.apiUrl = CURLParsed.url;
        try {
          me.bodyText = JSON.stringify(JSON.parse(CURLParsed.body), null, 2);
        } catch (ex) {
          console.log(ex);
          me.bodyText = CURLParsed.body;
        }
        if (me.bodyText == "null") {
          me.bodyText = null;
        }
        me.httpMethod = CURLParsed.method;
        me.headersText = CURLParsed.headersText;
        me.isImportingCURL = false;
        me.curlContent = "";
      } else {
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
    cancelImportCURL() {
      let me = this;
      me.isImportingCURL = false;
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
    justify-content: space-between;
    width: 100%;
  }
  .text-area-box {
    gap: var(--padding);
    flex: 1;
    .text-area-request {
      width: 100%;
      height: 100%;
      .request-area-title {
        width: 100%;
        justify-content: flex-start;
      }
    }
    .text-area-response {
      width: 100%;
      height: 100%;
      .response-area-title {
        justify-content: space-between;
        width: 100%;
        height: 40px;
      }
    }
  }
}
.group-btn {
  width: 100%;
  position: relative;
  flex-wrap: wrap;
}
.status-info {
  display: flex;
  align-items: center;
  gap: var(--padding);
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
