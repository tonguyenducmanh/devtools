<template>
  <div class="flex td-api-container">
    <div class="flex flex-col td-api-testing">
      <div class="flex td-api-header-group">
        <div class="flex flex-one">
          <TDComboBox
            :width="120"
            v-model="currentAPIMode"
            :options="APIModeOptions"
            :noMargin="true"
            :readOnly="isLoading"
            @selected="handleSelectedAPIMode"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopLeft,
              $tdEnum.BorderRadiusPosition.BottomLeft,
            ]"
          />
          <TDInput
            v-model="requestName"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.apiTesting.requestName')"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopRight,
              $tdEnum.BorderRadiusPosition.BottomRight,
            ]"
          ></TDInput>
        </div>

        <TDButton
          v-if="isLoading"
          :noMargin="true"
          @click="handleCancelRequest"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        />
        <TDButton
          :noMargin="true"
          @click="handleSend"
          :label="$t('i18nCommon.apiTesting.send')"
          v-else
        ></TDButton>
        <TDButton
          :noMargin="true"
          v-if="!showReponse"
          @click="handleDownloadReponse"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.downloadReponse')"
        ></TDButton>
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
        <TDTooltip
          class="no-select td-top-right-btn"
          :title="$t('i18nCommon.apiTesting.toolTipDownloadExtension')"
        >
          <TDButton
            :noMargin="true"
            v-if="!isElectronApp"
            @click="downloadExtension"
            :type="$tdEnum.buttonType.secondary"
            :label="$t('i18nCommon.apiTesting.downloadExtension')"
          ></TDButton>
        </TDTooltip>
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
            <TDButton
              @click="handleCopyCurl"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.apiTesting.copyCURL')"
            ></TDButton>
          </div>
        </template>
        <template v-else>
          <div class="td-api-content">
            <div class="flex td-api-info-btn">
              <div class="flex flex-one">
                <TDComboBox
                  :width="120"
                  v-model="httpMethod"
                  :options="methodOptions"
                  :customStyle="customStyleComboMethodAPI"
                  :noMargin="true"
                  :borderRadiusPosition="[
                    $tdEnum.BorderRadiusPosition.TopLeft,
                    $tdEnum.BorderRadiusPosition.BottomLeft,
                  ]"
                />
                <TDInput
                  v-model="apiUrl"
                  :placeHolder="$t('i18nCommon.apiTesting.urlPlaceholder')"
                  :noMargin="true"
                  :borderRadiusPosition="[
                    $tdEnum.BorderRadiusPosition.TopRight,
                    $tdEnum.BorderRadiusPosition.BottomRight,
                  ]"
                ></TDInput>
              </div>
              <TDButton
                @click="openFormImportCURL"
                :type="$tdEnum.buttonType.secondary"
                :debounceTime="100"
                :noMargin="true"
                :readOnly="isLoading"
                :label="$t('i18nCommon.apiTesting.CURL')"
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
                <div
                  class="td-text-area-wrap"
                  v-if="currentAPIInfoOption == $tdEnum.APIInfoOption.body"
                >
                  <TDTextarea
                    :isLabelTop="true"
                    v-model="bodyText"
                    :wrapText="wrapText"
                    :enableHighlight="enableHighlight"
                    language="json"
                    :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
                  ></TDTextarea>
                  <TDTooltip
                    class="no-select td-top-right-btn"
                    :title="$t('i18nCommon.apiTesting.beautify')"
                  >
                    <div class="td-icon td-json-icon" @click="formatBody"></div>
                  </TDTooltip>
                </div>
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
                  <div class="loader"></div>
                </div>
                <div v-else class="td-text-area-wrap">
                  <TDTextarea
                    :isLabelTop="true"
                    :modelValue="responseText"
                    :enableHighlight="enableHighlight"
                    language="json"
                    :placeHolder="
                      $t('i18nCommon.apiTesting.responsePlaceholder')
                    "
                    :readOnly="true"
                    :wrapText="wrapText"
                  ></TDTextarea>
                  <TDTooltip
                    class="no-select td-top-right-btn"
                    :title="$t('i18nCommon.apiTesting.copyResponse')"
                  >
                    <div
                      class="td-icon td-copy-icon"
                      @click="handleCopyResponse"
                    ></div>
                  </TDTooltip>
                </div>
              </div>
            </div>
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
                :enableHighlight="enableHighlight"
                language="language-bash"
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
                <div class="loader"></div>
              </div>
              <div v-else class="td-text-area-wrap">
                <TDTextarea
                  :isLabelTop="true"
                  :modelValue="responseText"
                  :enableHighlight="enableHighlight"
                  language="json"
                  :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
                  :readOnly="true"
                  :wrapText="wrapText"
                ></TDTextarea>
                <TDTooltip
                  class="no-select td-top-right-btn"
                  :title="$t('i18nCommon.apiTesting.copyResponse')"
                >
                  <div
                    class="td-icon td-copy-icon"
                    @click="handleCopyResponse"
                  ></div>
                </TDTooltip>
              </div>
            </div>
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
                :enableHighlight="enableHighlight"
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
              <div v-else class="td-text-area-wrap">
                <TDTextarea
                  :isLabelTop="true"
                  :modelValue="responseText"
                  :enableHighlight="enableHighlight"
                  language="json"
                  :placeHolder="$t('i18nCommon.apiTesting.responsePlaceholder')"
                  :readOnly="true"
                  :wrapText="wrapText"
                ></TDTextarea>
                <TDTooltip
                  class="no-select td-top-right-btn"
                  :title="$t('i18nCommon.apiTesting.copyResponse')"
                >
                  <div
                    class="td-icon td-copy-icon"
                    @click="handleCopyResponse"
                  ></div>
                </TDTooltip>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div
      v-if="currentAPIMode != $tdEnum.APIMode.ProMode"
      class="flex td-sub-sidebar"
      :class="{ 'td-sub-sidebar-collaspe': !isShowSidebar }"
    >
      <div v-if="isShowSidebar" class="divide"></div>
      <div v-if="isShowSidebar" class="flex flex-col td-sub-sidebar-content">
        <div class="flex td-header-collection">
          <div class="td-new-collection">
            <TDInput
              v-model="newCollectionName"
              :noMargin="true"
              :placeHolder="$t('i18nCommon.apiTesting.newCollectionName')"
            />
          </div>
          <TDTooltip
            class="text-nowrap"
            :title="$t('i18nCommon.apiTesting.add')"
          >
            <div class="td-icon td-plus-icon" @click="addNewCollection"></div>
          </TDTooltip>
        </div>
        <div class="td-collection">
          <div class="td-collection-body">
            <div
              v-for="(collection, index) in allCollection"
              class="flex flex-col no-select td-collection-item"
              :key="index"
            >
              <div
                class="flex td-collection-header"
                @click="toggleCollection(collection)"
              >
                <div class="flex td-collection-header-left">
                  <TDArrow
                    :openProp="collection.openingCollection"
                    :arrowOpenDirection="$tdEnum.Direction.bottom"
                    :arrowDirection="$tdEnum.Direction.right"
                  />
                  <TDTooltip
                    class="text-nowrap text-nowrap-collection"
                    :title="collection.name"
                  >
                    <div>
                      {{ collection.name }}
                    </div>
                  </TDTooltip>
                </div>
                <TDTooltip
                  class="text-nowrap"
                  :title="$t('i18nCommon.apiTesting.delete')"
                >
                  <div
                    class="td-icon td-close-icon"
                    @click.stop="deleteCollection(collection.name)"
                  ></div>
                </TDTooltip>
              </div>
              <div
                v-if="
                  collection.openingCollection &&
                  collection.requests &&
                  collection.requests.length > 0
                "
                class="flex flex-col td-collection-content"
              >
                <div
                  v-for="(request, indexRequest) in collection.requests"
                  :key="indexRequest"
                  class="flex td-collection-request-item"
                  :class="{
                    'td-collection-request-item-selected':
                      request && currentRequestId == request.requestId,
                  }"
                  @click="applyRequest(request)"
                >
                  <TDTooltip class="text-nowrap" :title="request.requestName">
                    <div>
                      {{ request.requestName }}
                    </div>
                  </TDTooltip>

                  <TDTooltip
                    class="text-nowrap"
                    :title="$t('i18nCommon.apiTesting.delete')"
                  >
                    <div
                      class="td-icon td-close-icon"
                      @click.stop="deleteRequest(collection.name, request)"
                    ></div>
                  </TDTooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex">
          <TDButton
            :readOnly="isLoading"
            @click="createNewRequest"
            :type="$tdEnum.buttonType.secondary"
            :noMargin="true"
            :label="$t('i18nCommon.apiTesting.createNewRequest')"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopLeft,
              $tdEnum.BorderRadiusPosition.BottomLeft,
            ]"
          ></TDButton>
          <TDButton
            :readOnly="isLoading || !requestName"
            @click="saveRequest"
            :type="$tdEnum.buttonType.secondary"
            :noMargin="true"
            :label="$t('i18nCommon.apiTesting.save')"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopRight,
              $tdEnum.BorderRadiusPosition.BottomRight,
            ]"
          ></TDButton>
        </div>
      </div>
      <TDToggleArea
        :collapsed="!isShowSidebar"
        position="right"
        @toggle="toggleSidebar"
      />
    </div>
    <div
      v-if="isSaveRequestToCollectionModelOpen"
      class="td-api-request-save-collection"
    >
      <div class="td-search-modal" @click.stop>
        <div class="td-search-input-container">
          <div class="td-icon td-search-icon"></div>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="$t('i18nCommon.search.placeholder')"
            class="td-search-input"
          />
          <button class="td-search-close" @click="closeSearchModal">
            <div class="td-icon td-close-icon"></div>
          </button>
        </div>

        <div class="td-search-results" v-if="filteredCollection.length > 0">
          <div class="td-search-section">
            <div
              v-for="(collection, index) in filteredCollection"
              :key="collection.name"
              class="td-search-item"
              @click="saveToCollection(collection)"
            >
              <div class="td-search-item-content">
                <div class="td-search-item-title">
                  {{ collection.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TDCURLUtil from "@/common/api/TDCURLUtil";
import TDToggleArea from "@/components/TDToggleArea.vue";
import TDArrow from "@/components/TDArrow.vue";

export default {
  name: "TDAPITesting",
  components: { TDToggleArea, TDArrow },

  data() {
    return {
      enableHighlight: true,
      isShowSidebar: true,
      apiUrl: "",
      requestName: "",
      currentRequestId: null,
      newCollectionName: "",
      allCollection: [],
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
      isSaveRequestToCollectionModelOpen: false,
      searchQuery: "",
      methodOptions: [
        { value: "GET", label: "GET", customStyle: { color: "#5EA572" } },
        { value: "POST", label: "POST", customStyle: { color: "#AE7D0D" } },
        { value: "PUT", label: "PUT", customStyle: { color: "#3676C7" } },
        { value: "PATCH", label: "PATCH", customStyle: { color: "#825DAC" } },
        { value: "DELETE", label: "DELETE", customStyle: { color: "#A64C43" } },
        { value: "HEAD", label: "HEAD", customStyle: { color: "#459B60" } },
        {
          value: "OPTIONS",
          label: "OPTIONS",
          customStyle: { color: "#C25E95" },
        },
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
    let toggleSidebarState = await me.$tdCache.get(
      me.$tdEnum.cacheConfig.IsShowSubSidebarAPITesting
    );
    if (toggleSidebarState) {
      me.isShowSidebar = toggleSidebarState.value;
    }
    let allCollectionTmp = await me.$tdCache.get(
      me.$tdEnum.cacheConfig.APICollection
    );
    if (allCollectionTmp) {
      me.allCollection = JSON.parse(allCollectionTmp) || [];
    }
  },
  computed: {
    isElectronApp() {
      return this.$tdUtility.isElectronApp();
    },
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
      // nếu đang hiển thị thanh bên phải, thì không cho show đủ status do thiếu diện tích
      // sau nghĩ ra thiết kế khác thì để full
      if (this.isShowSidebar && this.showReponse) {
        return code;
      }
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
    filteredCollection() {
      let me = this;
      if (!this.searchQuery) return me.allCollection;
      const query = this.searchQuery.normalizeText();

      return me.allCollection
        .filter((collection) => {
          const collectionName = collection.name.normalizeText();

          return collectionName.includes(query);
        })
        .slice(0, 8); // Giới hạn 8 kết quả
    },
    customStyleComboMethodAPI() {
      let me = this;
      let style = me.methodOptions.find((x) => x.value == me.httpMethod);
      if (style) {
        return style.customStyle;
      } else {
        return null;
      }
    },
  },
  beforeUnmount() {
    // rời khỏi tool này phải hủy request
    if (this.currentRequest && this.currentRequest.cancel) {
      this.currentRequest.cancel();
    }
  },
  methods: {
    async toggleSidebar() {
      let me = this;
      me.isShowSidebar = !me.isShowSidebar;
      await me.$tdCache.set(me.$tdEnum.cacheConfig.IsShowSubSidebarAPITesting, {
        value: me.isShowSidebar,
      });
    },
    async addNewCollection() {
      let me = this;
      if (
        me.allCollection &&
        Array.isArray(me.allCollection) &&
        me.newCollectionName
      ) {
        let collectionId = me.$tdUtility.newGuid();
        let blankCollection = {
          name: me.newCollectionName,
          requests: [],
          collection_id: collectionId,
          openingCollection: false,
        };
        me.allCollection.push(blankCollection);
        await me.saveCollectionToCache();
        // xóa tên tạm đi
        me.newCollectionName = "";
      }
    },
    async saveCollectionToCache() {
      let me = this;
      if (me.allCollection && me.allCollection.length > 0) {
        await me.$tdCache.set(
          me.$tdEnum.cacheConfig.APICollection,
          JSON.stringify(me.allCollection)
        );
      }
    },
    async toggleCollection(collection) {
      let me = this;
      if (collection) {
        collection.openingCollection = !collection.openingCollection;
        await me.saveCollectionToCache();
      }
    },
    applyRequest(request) {
      let me = this;
      me.handleSendRequestFromHistory(request);
      me.currentRequestId = request.requestId;
    },
    async saveRequest() {
      let me = this;
      if (me.requestName && me.allCollection && me.allCollection.length > 0) {
        // nếu đã tồn tại request thì lưu luôn
        if (me.currentRequestId) {
          let historyItem = me.buildHistoryItemForSave();
          let success = false;
          me.allCollection.forEach((collection) => {
            if (
              collection &&
              collection.requests &&
              collection.requests.length > 0
            ) {
              for (let request of collection.requests) {
                if (request && request.requestId == me.currentRequestId) {
                  Object.assign(request, historyItem);
                  this.$tdToast.success(
                    null,
                    this.$t("i18nCommon.toastMessage.success")
                  );
                  success = true;
                  break;
                }
              }
            }
          });
          if (success) {
            await me.saveCollectionToCache();
          }
        } else {
          // nếu không tồn tại request thì show popup tạo mới
          me.isSaveRequestToCollectionModelOpen = true;
        }
      }
    },
    async saveToCollection(collection) {
      let me = this;
      let historyItem = me.buildHistoryItemForSave();
      let newRequestId = me.$tdUtility.newGuid();
      if (collection && historyItem) {
        if (!collection.requests) {
          collection.requests = [];
        }
        historyItem.requestId = newRequestId;
        collection.requests.push(historyItem);
        await me.saveCollectionToCache();
        me.currentRequestId = newRequestId;
        this.$tdToast.success(null, this.$t("i18nCommon.toastMessage.success"));
      }
      this.closeSearchModal();
    },
    async deleteRequest(collectionName, request) {
      let me = this;
      if (
        collectionName &&
        request &&
        me.allCollection &&
        me.allCollection.length > 0
      ) {
        let currentCollection = me.allCollection.find(
          (x) => x.name == collectionName
        );
        if (
          currentCollection &&
          currentCollection.requests &&
          currentCollection.requests.length > 0
        ) {
          currentCollection.requests = currentCollection.requests.filter(
            (x) => x.requestId != request.requestId
          );
          await me.saveCollectionToCache();
        }
      }
    },
    async deleteCollection(collectionName) {
      let me = this;
      if (collectionName && me.allCollection && me.allCollection.length > 0) {
        me.allCollection = me.allCollection.filter(
          (x) => x.name != collectionName
        );

        await me.saveCollectionToCache();
      }
    },
    closeSearchModal() {
      this.isSaveRequestToCollectionModelOpen = false;
      this.searchQuery = "";
    },
    createNewRequest() {
      let me = this;
      me.requestName = "";
      me.currentRequestId = null;
      me.apiUrl = null;
      me.httpMethod = "GET";
      me.headersText = "Content-Type: application/json";
      me.bodyText = "";
      me.responseText = "";
      me.statusCode = null;
      me.responseTime = null;
      me.isLoading = false;
      me.startTime = null;
      me.isImportingCURL = false;
      me.currentRequest = null;
      me.curlContent = "";
    },
    downloadExtension() {
      let me = this;
      me.$tdUtility.goToSource("releases");
    },
    formatBody() {
      let me = this;
      if (me.bodyText) {
        me.bodyText = JSON.stringify(JSON.parse(me.bodyText), null, 2);
      }
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
    /**
     * Hàm wrap tất cả các thể loại gửi request
     */
    async handleSend() {
      let me = this;
      if (me.currentAPIMode == me.$tdEnum.APIMode.ProMode) {
        await me.handleSendRequestProMode();
      } else if (me.currentAPIMode == me.$tdEnum.APIMode.CURL) {
        await me.handleSendRequestCURL();
      } else if (me.currentAPIMode == me.$tdEnum.APIMode.Normal) {
        await me.handleSendRequest();
      }
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

        let historyItem = me.buildHistoryItemForSave();
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    buildHistoryItemForSave() {
      let me = this;
      let historyItem = {
        apiUrl: me.apiUrl,
        httpMethod: me.httpMethod,
        headersText: me.headersText,
        bodyText: me.bodyText,
        requestName: me.requestName || me.apiUrl,
      };
      return historyItem;
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
        me.currentRequestId = null;
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
        let result = await eval(injectedCode);

        let endTime = performance.now();
        me.responseTime = Math.round(endTime - me.startTime);
        // luồng promode có thể gọi nhiều api, check lỗi thì check console
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
@use "@/styles/icon.scss";

.td-api-container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}
.td-api-testing {
  width: 100%;
  height: 100%;
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
  border-radius: var(--border-radius);
}
.loader-without-response {
  margin-left: 100px;
}
.td-sub-sidebar {
  height: 100%;
  position: relative;
  margin-left: var(--padding);
  .td-sub-sidebar-content {
    width: 300px;
    height: 100%;
    position: relative;
    padding-left: var(--padding);
    .td-header-collection {
      width: 100%;
      height: 30px;
      margin: var(--padding);
      gap: var(--padding);
      .td-new-collection {
        flex: 1;
      }
      .td-plus-icon {
        filter: grayscale(100);
        cursor: pointer;
      }
      .td-plus-icon:hover {
        filter: unset;
        background-color: var(--bg-layer-color);
      }
    }
    .td-collection {
      height: calc(100% - 60px);
      width: 100%;
      overflow: auto;
      position: relative;
      .td-collection-body {
        position: relative;
        overflow: auto;
        .td-collection-item {
          cursor: pointer;
          justify-content: flex-start;
          gap: var(--padding);
          width: 100%;
          min-height: 40px;
          .td-collection-header {
            gap: var(--padding);
            padding: var(--padding);
            height: 40px;
            justify-content: space-between;
            width: 100%;
            .td-collection-header-left {
              gap: var(--padding);
            }
          }
          .td-collection-header:hover {
            background-color: var(--bg-layer-color);
            border-radius: var(--border-radius);
          }
          .td-collection-content {
            justify-content: flex-start;
            width: 100%;
            .td-collection-request-item {
              height: 40px;
              justify-content: space-between;
              width: 100%;
              padding: var(--padding);
              border-radius: var(--border-radius);
            }
            .td-collection-request-item:hover {
              background-color: var(--bg-layer-color);
            }
            .td-collection-request-item-selected {
              background-color: var(--bg-layer-color);
              font-weight: 600;
            }
          }
        }
      }
    }
  }
  .divide {
    width: var(--padding);
    height: 100%;
    background-color: var(--bg-layer-color);
    border-radius: var(--border-radius);
  }
}
.td-sub-sidebar-collaspe {
  margin-left: unset;
}
.td-api-request-save-collection {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
}
.td-search-box {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--bg-thirt-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border: 1px solid var(--focus-color);
  }

  .td-search-placeholder {
    flex: 1;
    font-size: 14px;
  }

  .td-search-shortcut {
    display: flex;
    gap: 2px;
    span {
      padding: 4px 6px;
      background-color: var(--bg-layer-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-color-secondary);
    }
  }
}

.td-search-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
}

.td-search-modal {
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  background-color: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: calc(var(--border-radius) * 1.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .td-search-input-container {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    .td-search-icon {
      margin-right: var(--padding);
    }
    .td-search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-color);

      &::placeholder {
        color: var(--text-color-secondary);
      }
    }

    .td-search-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.6;
      transition: all 0.2s ease;

      &:hover {
        opacity: 1;
        background-color: var(--bg-layer-color);
      }
    }
  }

  .td-search-results {
    max-height: 400px;
    overflow-y: auto;

    .td-search-section {
      padding: 8px 0;

      .td-search-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover,
        &.td-search-item-active {
          background-color: var(--bg-layer-color);
        }

        .td-icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          opacity: 0.8;
        }

        .td-search-item-content {
          flex: 1;

          .td-search-item-title {
            font-weight: 500;
            color: var(--text-color);
            margin-bottom: 2px;
          }

          .td-search-item-description {
            font-size: 12px;
            color: var(--text-color-secondary);
          }
        }

        .td-search-item-shortcut {
          span {
            padding: 2px 6px;
            background-color: var(--bg-layer-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            color: var(--text-color-secondary);
          }
        }
      }
    }
  }

  .td-search-empty,
  .td-search-help {
    padding: 40px 16px;
    text-align: center;
    .td-search-empty-text,
    .td-search-help-text {
      color: var(--text-color-secondary);
      font-size: 14px;
    }
  }
}
.td-close-icon {
  filter: grayscale(100);
}
.td-close-icon:hover {
  filter: unset;
}
.text-nowrap-collection {
  max-width: 225px !important;
}
.text-nowrap {
  max-width: 250px;
}
.td-text-area-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  .td-top-right-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    border: 1px solid var(--bg-layer-color);
    padding: var(--padding);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    background-color: rgba(255, 255, 255, 0.206);
  }
  .td-top-right-btn:hover {
    cursor: pointer;
    background-color: var(--bg-main-color);
    color: var(--focus-color);
  }
}
</style>
