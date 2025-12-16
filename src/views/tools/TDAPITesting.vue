<template>
  <div class="flex flex-col container">
    <div class="flex td-api-header-group">
      <TDComboBox
        :width="120"
        v-model="currentAPIMode"
        :options="APIModeOptions"
        :noMargin="true"
        :readOnly="isLoading"
        @selected="handleSelectedAPIMode"
      />
      <TDInput
        v-model="requestName"
        :noMargin="true"
        :placeHolder="$t('i18nCommon.apiTesting.requestName')"
      ></TDInput>
      <TDHistory
        v-if="currentAPIMode == $tdEnum.APIMode.ProMode"
        ref="historyProMode"
        :applyFunction="handleSendRequestFromHistoryProMode"
        titleKey="requestName"
        :noMargin="true"
        :positionRelative="false"
        :cacheKey="$tdEnum.cacheConfig.APIPromodeHistory"
        :historyContainerStyleEnum="$tdEnum.AbsolutePositionStyle.Top100Left"
      ></TDHistory>
      <TDHistory
        v-else
        ref="history"
        :applyFunction="handleSendRequestFromHistory"
        titleKey="requestName"
        :noMargin="true"
        :positionRelative="false"
        :cacheKey="$tdEnum.cacheConfig.APIHistory"
        :historyContainerStyleEnum="$tdEnum.AbsolutePositionStyle.Top100Left"
      ></TDHistory>
      <TDButton
        @click="downloadExtension"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.apiTesting.downloadExtension')"
      ></TDButton>
    </div>
    <template v-if="currentAPIMode == $tdEnum.APIMode.Normal">
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
          ></TDButton>
          <TDButton
            @click="cancelImportCURL"
            :type="$tdEnum.buttonType.secondary"
            :label="$t('i18nCommon.apiTesting.cancel')"
          ></TDButton>
        </div>
      </template>
      <template v-else>
        <div class="td-api-content">
          <div class="flex td-api-info-btn">
            <TDComboBox
              v-model="httpMethod"
              :options="methodOptions"
              :noMargin="true"
            />
            <TDInput
              v-model="apiUrl"
              :placeHolder="$t('i18nCommon.apiTesting.urlPlaceholder')"
              :noMargin="true"
            ></TDInput>
            <TDButton
              @click="openFormImportCURL"
              :type="$tdEnum.buttonType.secondary"
              :debounceTime="100"
              :noMargin="true"
              :readOnly="isLoading"
              :label="$t('i18nCommon.apiTesting.importCURL')"
            ></TDButton>
          </div>
          <div class="flex td-api-input-area">
            <div class="flex flex-col td-api-request">
              <div class="flex td-api-request-title">
                <TDRadioGroup
                  v-model="currentAPIInfoOption"
                  :options="APIInfoOptions"
                  :noMargin="true"
                />
                <TDCheckbox
                  v-model="wrapText"
                  :label="$t('i18nCommon.apiTesting.wrapText')"
                ></TDCheckbox>
                <TDCheckbox
                  v-if="!showReponse"
                  v-model="showReponse"
                  :label="$t('i18nCommon.apiTesting.showReponse')"
                ></TDCheckbox>
                <div
                  class="flex loader-without-response"
                  v-if="!showReponse && isLoading"
                >
                  <div class="loader"></div>
                  <TDButton
                    class="btn-cancel-without-response"
                    @click="handleCancelRequest"
                    :label="$t('i18nCommon.apiTesting.cancel')"
                  />
                </div>
                <div v-if="!showReponse && !isLoading">
                  <div class="status-info" v-if="statusCode">
                    <div class="status-badge" :class="statusClass">
                      {{ statusText }}
                    </div>
                    <div class="response-time" v-if="responseTime">
                      {{ responseTime }}ms
                    </div>
                  </div>
                </div>
              </div>
              <TDTextarea
                v-if="currentAPIInfoOption == $tdEnum.APIInfoOption.header"
                :isLabelTop="true"
                v-model="headersText"
                :wrapText="wrapText"
                :placeHolder="$t('i18nCommon.apiTesting.headersPlaceholder')"
              ></TDTextarea>
              <TDTextarea
                v-if="currentAPIInfoOption == $tdEnum.APIInfoOption.body"
                :isLabelTop="true"
                v-model="bodyText"
                :wrapText="wrapText"
                :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
              ></TDTextarea>
            </div>
            <div v-if="showReponse" class="flex flex-col td-api-response">
              <div class="flex td-api-response-title">
                <TDCheckbox
                  v-model="showReponse"
                  :label="$t('i18nCommon.apiTesting.showReponse')"
                ></TDCheckbox>
                <div>
                  <div class="status-info" v-if="statusCode">
                    <div class="status-badge" :class="statusClass">
                      {{ statusText }}
                    </div>
                    <div class="response-time" v-if="responseTime">
                      {{ responseTime }}ms
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col response-loading" v-if="isLoading">
                <TDButton
                  v-if="isLoading"
                  @click="handleCancelRequest"
                  :label="$t('i18nCommon.apiTesting.cancel')"
                />
                <div class="loader"></div>
              </div>
              <TDTextarea
                v-else
                :isLabelTop="true"
                :modelValue="responseText"
                :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
                :readOnly="true"
                :wrapText="wrapText"
              ></TDTextarea>
            </div>
          </div>
        </div>

        <div class="flex td-api-group-btn">
          <TDButton
            @click="handleSendRequest"
            :label="$t('i18nCommon.apiTesting.send')"
            :readOnly="isLoading"
          ></TDButton>
          <TDButton
            @click="handleClear"
            :type="$tdEnum.buttonType.secondary"
            :label="$t('i18nCommon.apiTesting.clear')"
          ></TDButton>
          <div>
            <TDButton
              v-if="showReponse"
              @click="handleCopyResponse"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.apiTesting.copyResponse')"
            ></TDButton>
            <TDButton
              v-else
              @click="handleDownloadReponse"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.apiTesting.downloadReponse')"
            ></TDButton>
          </div>
          <TDButton
            @click="handleCopyCurl"
            :type="$tdEnum.buttonType.secondary"
            :label="$t('i18nCommon.apiTesting.copyCURL')"
          ></TDButton>
        </div>
      </template>
    </template>
    <template v-else-if="currentAPIMode == $tdEnum.APIMode.CURL">
      <div class="td-api-content">
        <div class="flex td-api-input-area">
          <div class="flex flex-col td-api-request">
            <div class="flex td-api-request-title">
              <TDCheckbox
                v-model="wrapText"
                :label="$t('i18nCommon.apiTesting.wrapText')"
              ></TDCheckbox>
              <TDCheckbox
                v-if="!showReponse"
                v-model="showReponse"
                :label="$t('i18nCommon.apiTesting.showReponse')"
              ></TDCheckbox>
              <div
                class="flex loader-without-response"
                v-if="!showReponse && isLoading"
              >
                <div class="loader"></div>
                <TDButton
                  class="btn-cancel-without-response"
                  @click="handleCancelRequest"
                  :label="$t('i18nCommon.apiTesting.cancel')"
                />
              </div>
              <div v-if="!showReponse && !isLoading">
                <div class="status-info" v-if="statusCode">
                  <div class="status-badge" :class="statusClass">
                    {{ statusText }}
                  </div>
                  <div class="response-time" v-if="responseTime">
                    {{ responseTime }}ms
                  </div>
                </div>
              </div>
            </div>
            <TDTextarea
              :isLabelTop="true"
              v-model="curlContent"
              :wrapText="wrapText"
              :placeHolder="$t('i18nCommon.apiTesting.contentCURLExecute')"
            ></TDTextarea>
          </div>
          <div v-if="showReponse" class="flex flex-col td-api-response">
            <div class="flex td-api-response-title">
              <TDCheckbox
                v-model="showReponse"
                :label="$t('i18nCommon.apiTesting.showReponse')"
              ></TDCheckbox>
              <div>
                <div class="status-info" v-if="statusCode">
                  <div class="status-badge" :class="statusClass">
                    {{ statusText }}
                  </div>
                  <div class="response-time" v-if="responseTime">
                    {{ responseTime }}ms
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col response-loading" v-if="isLoading">
              <TDButton
                v-if="isLoading"
                @click="handleCancelRequest"
                :label="$t('i18nCommon.apiTesting.cancel')"
              />
              <div class="loader"></div>
            </div>
            <TDTextarea
              v-else
              :isLabelTop="true"
              :modelValue="responseText"
              :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
              :readOnly="true"
              :wrapText="wrapText"
            ></TDTextarea>
          </div>
        </div>
      </div>
      <div class="flex td-api-group-btn">
        <TDButton
          @click="handleSendRequestCURL"
          :label="$t('i18nCommon.apiTesting.send')"
          :readOnly="isLoading"
        ></TDButton>
        <div>
          <TDButton
            v-if="showReponse"
            @click="handleCopyResponse"
            :type="$tdEnum.buttonType.secondary"
            :label="$t('i18nCommon.apiTesting.copyResponse')"
          ></TDButton>
          <TDButton
            v-else
            @click="handleDownloadReponse"
            :type="$tdEnum.buttonType.secondary"
            :label="$t('i18nCommon.apiTesting.downloadReponse')"
          ></TDButton>
        </div>
      </div>
    </template>
    <template v-else-if="currentAPIMode == $tdEnum.APIMode.ProMode">
      <div class="td-api-content">
        <div class="flex td-api-input-area">
          <div class="flex flex-col td-api-request">
            <div class="flex td-api-request-title">
              <div>
                {{ $t("i18nCommon.apiTesting.proModeTitle") }}
              </div>
              <TDCheckbox
                v-if="!showReponse"
                v-model="showReponse"
                :label="$t('i18nCommon.apiTesting.showReponse')"
              ></TDCheckbox>
              <div
                class="flex loader-without-response"
                v-if="!showReponse && isLoading"
              >
                <div class="loader"></div>
                <TDButton
                  class="btn-cancel-without-response"
                  :label="$t('i18nCommon.apiTesting.cancel')"
                />
              </div>
              <div v-if="!showReponse && !isLoading">
                <div class="status-info" v-if="statusCode">
                  <div class="status-badge" :class="statusClass">
                    {{ statusText }}
                  </div>
                  <div class="response-time" v-if="responseTime">
                    {{ responseTime }}ms
                  </div>
                </div>
              </div>
            </div>
            <TDTextarea
              :isLabelTop="true"
              v-model="proModeSecranioCode"
              :wrapText="wrapText"
              :placeHolder="$t('i18nCommon.apiTesting.scriptExecute')"
            ></TDTextarea>
          </div>
          <div v-if="showReponse" class="flex flex-col td-api-response">
            <div class="flex td-api-response-title">
              <TDCheckbox
                v-model="showReponse"
                :label="$t('i18nCommon.apiTesting.showReponse')"
              ></TDCheckbox>
              <div>
                <div class="status-info" v-if="statusCode">
                  <div class="status-badge" :class="statusClass">
                    {{ statusText }}
                  </div>
                  <div class="response-time" v-if="responseTime">
                    {{ responseTime }}ms
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col response-loading" v-if="isLoading">
              <TDButton
                v-if="isLoading"
                :label="$t('i18nCommon.apiTesting.cancel')"
              />
              <div class="loader"></div>
            </div>
            <TDTextarea
              v-else
              :isLabelTop="true"
              :modelValue="responseText"
              :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
              :readOnly="true"
              :wrapText="wrapText"
            ></TDTextarea>
          </div>
        </div>
      </div>
      <div class="flex td-api-group-btn">
        <TDButton
          @click="handleSendRequestProMode"
          :label="$t('i18nCommon.apiTesting.send')"
          :readOnly="isLoading"
        ></TDButton>
        <div>
          <TDButton
            v-if="showReponse"
            :type="$tdEnum.buttonType.secondary"
            @click="handleCopyResponse"
            :label="$t('i18nCommon.apiTesting.copyResponse')"
          ></TDButton>
          <TDButton
            v-else
            :type="$tdEnum.buttonType.secondary"
            @click="handleDownloadReponse"
            :label="$t('i18nCommon.apiTesting.downloadReponse')"
          ></TDButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import TDCURLUtil from "@/common/api/TDCURLUtil";
export default {
  name: "TDAPITesting",
  data() {
    return {
      apiUrl: "",
      requestName: "",
      httpMethod: "GET",
      headersText: "Content-Type: application/json",
      bodyText: "",
      responseText: "",
      statusCode: null,
      responseTime: null,
      isLoading: false,
      startTime: null,
      isImportingCURL: false,
      currentAPIMode: this.$tdEnum.APIMode.Normal,
      currentRequest: null,
      wrapText: false,
      showReponse: true,
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
      APIModeOptions: [
        { value: this.$tdEnum.APIMode.Normal, label: "Normal" },
        { value: this.$tdEnum.APIMode.CURL, label: "CURL" },
        { value: this.$tdEnum.APIMode.ProMode, label: "Pro Mode" },
      ],
      proModeSecranioCode:
        this.$t("i18nCommon.apiTesting.tutorialProModeCode") +
        TDCURLUtil.sampleCURLScript(),
    };
  },
  async created() {
    let me = this;
    let oldAPIMode = await me.$tdCache.get(me.$tdEnum.cacheConfig.APIMode);
    if (oldAPIMode) {
      let oldData = JSON.parse(oldAPIMode);
      if (oldData) {
        me.currentAPIMode = oldData.mode;
      }
    }
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
    statusText() {
      const code = Number(this.statusCode);
      if (!code) return "";

      // mapping chi tiết
      const exactMap = {
        200: "OK",
        201: "Created",
        202: "Accepted",
        204: "No Content",
        301: "Moved Permanently",
        302: "Found",
        304: "Not Modified",
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        408: "Request Timeout",
        409: "Conflict",
        429: "Too Many Requests",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
      };

      // ưu tiên exact
      if (exactMap[code]) {
        return `${code} ${exactMap[code]}`;
      }

      // fallback theo nhóm HTTP
      const group = Math.floor(code / 100);
      const groupMap = {
        1: "Informational",
        2: "Success",
        3: "Redirection",
        4: "Client Error",
        5: "Server Error",
      };

      return groupMap[group]
        ? `${code} ${groupMap[group]}`
        : `${code} Unknown Status`;
    },
  },
  beforeUnmount() {
    // rời khỏi tool này phải hủy request
    if (this.currentRequest && this.currentRequest.cancel) {
      this.currentRequest.cancel();
    }
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
    async handleSendRequestCURL() {
      let me = this;
      let parseCURLSuccess = me.importCURL(true);
      if (parseCURLSuccess) {
        await me.handleSendRequest();
      } else {
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
    async handleSendRequest() {
      let me = this;

      if (!this.apiUrl) {
        this.$tdToast.error(null, this.$t("i18nCommon.apiTesting.urlRequired"));
        return;
      }

      this.isLoading = true;
      this.startTime = performance.now();
      this.responseText = "";
      this.statusCode = null;

      try {
        // let headers = this.parseHeaders(this.headersText);

        let requestData = {
          apiUrl: this.apiUrl,
          httpMethod: this.httpMethod,
          headersText: this.headersText,
          bodyText: this.bodyText || null,
        };

        // gọi API
        this.currentRequest = TDCURLUtil.fetchAgent(requestData);

        const response = await this.currentRequest.promise;

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
        if (error.message === "Request cancelled by user") {
          this.responseText = this.$t("i18nCommon.apiTesting.requestCanceled");
          this.$tdToast.success(
            null,
            this.$t("i18nCommon.apiTesting.requestCanceled")
          );
        } else {
          this.responseText = `Error: ${error.message}`;
          this.$tdToast.error(null, error.message);
        }
      } finally {
        this.isLoading = false;
        this.currentRequest = null;
        // setTimeout(() => {
        //   this.isLoading = false;
        // }, 2000); // 2000 milliseconds = 2 seconds

        let historyItem = {
          apiUrl: me.apiUrl,
          httpMethod: me.httpMethod,
          headersText: me.headersText,
          bodyText: me.bodyText,
          requestName: me.requestName || me.apiUrl,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    handleCancelRequest() {
      if (
        this.currentRequest &&
        typeof this.currentRequest.cancel === "function"
      ) {
        this.currentRequest.cancel();
      }

      this.isLoading = false;
      this.currentRequest = null;
    },
    handleSendRequestFromHistory(item) {
      let me = this;
      if (item && item.apiUrl) {
        me.apiUrl = item.apiUrl;
        me.httpMethod = item.httpMethod;
        me.headersText = item.headersText;
        me.bodyText = item.bodyText;
        me.requestName = item.requestName;
        // build luôn CURL
        me.curlContent = TDCURLUtil.stringify(me.getRequestObj());
        // lúc apply lịch sử mà gọi luôn hơi tốn server :v
        // await me.handleSendRequest();
      }
    },
    getRequestObj() {
      let me = this;
      return {
        apiUrl: me.apiUrl,
        httpMethod: me.httpMethod,
        headersText: me.headersText,
        bodyText: me.bodyText,
      };
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
    handleDownloadReponse() {
      let me = this;
      if (me.responseText) {
        let encoder = new TextEncoder();
        let buffer = encoder.encode(me.responseText); // Uint8Array
        let fileName = me.$tdUtility.createFileDownloadName(me.requestName, {
          ext: ".txt",
        });
        me.$tdUtility.createDownloadFileFromBuffer(
          buffer,
          "text/plain;charset=utf-8",
          fileName
        );
      }
    },
    handleCopyCurl() {
      let me = this;
      let curlBuilded = TDCURLUtil.stringify(me.getRequestObj());
      if (curlBuilded) {
        me.$tdUtility.copyToClipboard(curlBuilded);
      } else {
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
    openFormImportCURL() {
      let me = this;
      me.isImportingCURL = true;
    },
    importCURL(isSilence = false) {
      let me = this;
      let CURLParsed = TDCURLUtil.parse(me.curlContent);
      let result = false;
      if (CURLParsed) {
        me.apiUrl = CURLParsed.url;
        if (!isSilence) {
          me.requestName = CURLParsed.url;
        }
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
        result = true;
      } else {
        if (!isSilence) {
          me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
        }
        result = false;
      }
      return result;
    },
    cancelImportCURL() {
      let me = this;
      me.isImportingCURL = false;
    },
    async handleSelectedAPIMode() {
      let me = this;
      let historyAPIMode = {
        mode: me.currentAPIMode,
      };
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.APIMode,
        JSON.stringify(historyAPIMode)
      );
    },
    async handleSendRequestProMode() {
      let me = this;

      if (!me.proModeSecranioCode) {
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
        return;
      }

      me.isLoading = true;
      me.responseText = "";
      me.statusCode = null;
      me.responseTime = null;
      me.startTime = performance.now();

      try {
        const injectedCode = TDCURLUtil.buildInjectCode(me.proModeSecranioCode);

        // Thực thi script
        const result = await eval(injectedCode);

        let endTime = performance.now();
        me.responseTime = Math.round(endTime - me.startTime);
        me.statusCode = 200;

        // format output
        if (typeof result === "object") {
          me.responseText = JSON.stringify(result, null, 2);
        } else if (typeof result === "string") {
          try {
            me.responseText = JSON.stringify(JSON.parse(result), null, 2);
          } catch {
            me.responseText = result;
          }
        } else if (typeof result !== "undefined") {
          me.responseText = String(result);
        } else {
          me.responseText = "// Script executed successfully (no return)";
        }

        me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        me.responseText = `ProMode Error: ${error.message}`;
        me.$tdToast.error(null, error.message);
      } finally {
        me.isLoading = false;
        if (me.proModeSecranioCode) {
          let shortCode = me.proModeSecranioCode.slice(0, 100);
          let historyItem = {
            requestName: me.requestName || shortCode,
            proModeSecranioCode: me.proModeSecranioCode,
          };
          await me.$refs.historyProMode.saveToHistory(historyItem);
        }
      }
    },
    handleSendRequestFromHistoryProMode(item) {
      let me = this;
      if (item && item.proModeSecranioCode) {
        me.proModeSecranioCode = item.proModeSecranioCode;
        me.requestName = item.requestName;
      }
      // không gọi api ngay mà để user gọi
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

.td-api-content {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  .method-selection {
    justify-content: space-between;
    width: 100%;
  }
  .td-api-input-area {
    gap: var(--padding);
    flex: 1;
    .td-api-request {
      width: 100%;
      height: 100%;
      .td-api-request-title {
        width: 100%;
        justify-content: flex-start;
        height: 40px;
        align-items: center;
      }
    }
    .td-api-response {
      width: 100%;
      height: 100%;
      .td-api-response-title {
        justify-content: space-between;
        width: 100%;
        height: 40px;
      }
    }
  }
}
.td-api-group-btn {
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
.td-api-header-group {
  gap: var(--padding);
  align-items: center;
  justify-content: center;
  margin-bottom: var(--padding);
  position: relative;
  width: 100%;
}
.td-api-info-btn {
  gap: var(--padding);
}
.response-loading {
  width: 100%;
  height: 100%;
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
}
.loader-without-response {
  margin-left: 100px;
}
.btn-cancel-without-response {
  margin-left: 100px;
}
</style>
