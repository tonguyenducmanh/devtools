<template>
  <div class="flex td-api-container">
    <!-- phần thao tác chính của tool -->
    <div class="flex flex-col td-api-testing">
      <!-- danh sách các nút ở đầu api -->
      <div class="flex td-api-header-group">
        <!-- lựa chọn chế độ api và tên request-->
        <div class="flex flex-one">
          <TDComboBox
            :width="120"
            v-model="APIConfigLayout.currentAPIMode"
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
            :placeHolder="requestNameBuild"
            :borderRadiusPosition="[
              $tdEnum.BorderRadiusPosition.TopRight,
              $tdEnum.BorderRadiusPosition.BottomRight,
            ]"
          ></TDInput>
        </div>
        <!-- nút gửi hoặc hủy request -->
        <TDButton
          v-if="isLoading"
          :noMargin="true"
          @click="handleCancelRequest"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.cancel')"
        />
        <TDButton
          v-else
          :noMargin="true"
          @click="handleSend"
          :label="$t('i18nCommon.apiTesting.send')"
        ></TDButton>
        <!-- nút tải xuống response -->
        <TDButton
          :noMargin="true"
          @click="handleDownloadReponse"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.apiTesting.downloadReponse')"
        ></TDButton>
      </div>
      <!-- hết phần danh sách nút đầu của api -->
      <!-- phần nội dung tùy thuộc vào từng loại api -->
      <!-- phần api truyền thống -->
      <template v-if="APIConfigLayout.currentAPIMode == $tdEnum.APIMode.Normal">
        <div class="td-api-content">
          <div class="flex td-api-info-btn">
            <!-- dòng header bổ trợ 1 số thông tin cho mode api thường -->
            <div class="flex flex-one">
              <!-- combo chọn method http -->
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
              <!-- nhập url endpoint api -->
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
            <!-- nút mở chế độ api import curl -->
            <TDButton
              @click="openFormImportCURL"
              :type="$tdEnum.buttonType.secondary"
              :debounceTime="100"
              :noMargin="true"
              :readOnly="isLoading"
              :label="$t('i18nCommon.apiTesting.CURL')"
            ></TDButton>
          </div>
          <!-- phần nội dung  -->
          <div
            class="flex td-api-input-area"
            :class="{ 'flex-col': APIConfigLayout.splitHorizontal }"
          >
            <div class="flex flex-col td-api-request">
              <div class="flex td-api-request-title">
                <TDSlideOption
                  v-model="APIConfigLayout.currentAPIInfoOption"
                  :options="APIInfoOptions"
                  :noMargin="true"
                  @change="updateAPIConfigLayout"
                />

                <!-- phần hiển thị loader nếu như không chọn show reponse -->
                <div
                  class="flex loader-without-response"
                  v-if="!APIConfigLayout.showReponse && isLoading"
                >
                  <div class="loader"></div>
                </div>
                <!-- phần hiển thị status code và thời gian chạy request -->
                <TDAPIResponseStatus
                  v-if="APIConfigLayout.splitHorizontal && !isLoading"
                  :statusCode="statusCode"
                  :responseTime="responseTime"
                />
              </div>
              <!-- phần cấu hình header api -->
              <TDTextarea
                v-if="
                  APIConfigLayout.currentAPIInfoOption ==
                  $tdEnum.APIInfoOption.header
                "
                :isLabelTop="true"
                v-model="headersText"
                :enableHighlight="APIConfigLayout.enableHighlight"
                language="text/plan"
                :wrapText="APIConfigLayout.wrapText"
                :placeHolder="$t('i18nCommon.apiTesting.headersPlaceholder')"
              ></TDTextarea>
              <!-- phần cấu hình body api -->
              <div
                class="td-text-area-wrap"
                v-if="
                  APIConfigLayout.currentAPIInfoOption ==
                  $tdEnum.APIInfoOption.body
                "
              >
                <TDTextarea
                  :isLabelTop="true"
                  v-model="bodyText"
                  :wrapText="APIConfigLayout.wrapText"
                  :enableHighlight="APIConfigLayout.enableHighlight"
                  language="json"
                  :placeHolder="$t('i18nCommon.apiTesting.bodyPlaceholder')"
                ></TDTextarea>
                <span
                  v-if="!APIConfigLayout.enableHighlight"
                  class="no-select td-top-right-btn"
                >
                  <div
                    class="td-icon td-json-icon"
                    @click="formatBody"
                    v-tooltip="$t('i18nCommon.apiTesting.beautify')"
                  ></div>
                </span>
              </div>
            </div>
            <!-- phần response API -->
            <div
              v-if="APIConfigLayout.showReponse"
              class="flex flex-col td-api-response"
            >
              <!-- phần hiển thị httpstatus bên trên response -->
              <TDAPIResponseStatus
                class="flex td-api-response-title"
                v-if="!APIConfigLayout.splitHorizontal"
                :statusCode="statusCode"
                :responseTime="responseTime"
              />
              <TDAPIResponse
                :isLoading="isLoading"
                :responseText="responseText"
                :APIConfigLayout="APIConfigLayout"
              />
            </div>
          </div>
        </div>
      </template>
      <!-- phần api dạng curl -->
      <template
        v-else-if="APIConfigLayout.currentAPIMode == $tdEnum.APIMode.CURL"
      >
        <div class="td-api-content">
          <div
            class="flex td-api-input-area"
            :class="{ 'flex-col': APIConfigLayout.splitHorizontal }"
          >
            <div class="flex flex-col td-api-request">
              <div class="flex td-api-request-title">
                <div class="title-request">
                  {{ $t("i18nCommon.apiTesting.CURLModeTitle") }}
                </div>
                <div
                  class="flex loader-without-response"
                  v-if="!APIConfigLayout.showReponse && isLoading"
                >
                  <div class="loader"></div>
                </div>
                <TDAPIResponseStatus
                  v-if="APIConfigLayout.splitHorizontal && !isLoading"
                  :statusCode="statusCode"
                  :responseTime="responseTime"
                />
              </div>
              <TDTextarea
                :isLabelTop="true"
                v-model="curlContent"
                :wrapText="APIConfigLayout.wrapText"
                :enableHighlight="APIConfigLayout.enableHighlight"
                language="shell"
                :placeHolder="$t('i18nCommon.apiTesting.contentCURLExecute')"
              ></TDTextarea>
            </div>
            <div
              v-if="APIConfigLayout.showReponse"
              class="flex flex-col td-api-response"
            >
              <TDAPIResponseStatus
                class="flex td-api-response-title"
                v-if="!APIConfigLayout.splitHorizontal"
                :statusCode="statusCode"
                :responseTime="responseTime"
              />
              <TDAPIResponse
                :isLoading="isLoading"
                :responseText="responseText"
                :APIConfigLayout="APIConfigLayout"
              />
            </div>
          </div>
        </div>
      </template>
      <!-- phần api promode, xử lý nhiều kịch bản bằng javascript -->
      <template
        v-else-if="APIConfigLayout.currentAPIMode == $tdEnum.APIMode.ProMode"
      >
        <div class="td-api-content">
          <div
            class="flex td-api-input-area"
            :class="{ 'flex-col': APIConfigLayout.splitHorizontal }"
          >
            <!-- phần 1 số info header promode như title và respone http -->
            <div class="flex flex-col td-api-request">
              <div class="flex td-api-request-title">
                <div class="title-request">
                  {{ $t("i18nCommon.apiTesting.proModeTitle") }}
                </div>
                <div
                  class="flex loader-without-response"
                  v-if="!APIConfigLayout.showReponse && isLoading"
                >
                  <div class="loader"></div>
                </div>
                <TDAPIResponseStatus
                  v-if="APIConfigLayout.splitHorizontal && !isLoading"
                  :statusCode="statusCode"
                  :responseTime="responseTime"
                />
              </div>
              <!-- phần nội dung code pro mode -->
              <TDTextarea
                :isLabelTop="true"
                v-model="proModeSecranioCode"
                :wrapText="APIConfigLayout.wrapText"
                :enableHighlight="APIConfigLayout.enableHighlight"
                :placeHolder="$t('i18nCommon.apiTesting.scriptExecute')"
              ></TDTextarea>
            </div>
            <div
              v-if="APIConfigLayout.showReponse"
              class="flex flex-col td-api-response"
            >
              <TDAPIResponseStatus
                class="flex td-api-response-title"
                v-if="!APIConfigLayout.splitHorizontal"
                :statusCode="statusCode"
                :responseTime="responseTime"
              />
              <TDAPIResponse
                :isLoading="isLoading"
                :responseText="responseText"
                :APIConfigLayout="APIConfigLayout"
              />
            </div>
          </div>
        </div>
      </template>
      <!-- hết phần nội dung tùy thuộc vào từng loại api -->
    </div>
    <!-- phần nội dung sidebar -->
    <TDSubSidebar ref="subSidebar" v-model="APIConfigLayout.isShowSidebar">
      <!-- slide tùy chọn như cài đặt hoặc collection -->
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
            :showIcon="true"
            v-if="sidebarOptions && sidebarOptions.length > 1"
            v-model="APIConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateAPIConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <!-- phần bộ sưu tập các request -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            APIConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Collection
          "
        >
          <template
            v-if="APIConfigLayout.currentAPIMode == $tdEnum.APIMode.ProMode"
          >
            <div
              v-if="proModeTemplate && proModeTemplate.length > 0"
              class="flex flex-col td-template-content"
            >
              <div
                v-for="(template, indexRequest) in proModeTemplate"
                :key="indexRequest"
                class="flex td-template-item"
                @click="applyRequestProMode(template)"
              >
                <span class="no-select text-nowrap">
                  <div v-tooltip="template.content">
                    {{ template.scriptName }}
                  </div>
                </span>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- phần header của bộ sưu tập request -->
            <div class="flex td-header-collection">
              <div class="td-new-collection">
                <TDInput
                  v-model="newCollectionName"
                  :noMargin="true"
                  :placeHolder="$t('i18nCommon.apiTesting.newCollectionName')"
                />
              </div>
              <div
                class="td-icon td-plus-icon"
                @click="addNewCollection"
                v-tooltip="$t('i18nCommon.apiTesting.add')"
              ></div>
            </div>
            <!-- phần danh sách các request đã lưu theo thư mục -->
            <div class="td-collection">
              <div class="td-collection-body">
                <div
                  v-for="(collection, index) in allCollection"
                  class="flex flex-col no-select td-collection-item"
                  :key="index"
                >
                  <!-- phần sửa nhanh tên thư mục request nếu đang ở chế độ edit -->
                  <div
                    v-if="collection.is_renaming"
                    class="td-collection-rename"
                  >
                    <TDInput
                      v-model="collection.temp_name"
                      :noMargin="true"
                      :placeHolder="
                        $t('i18nCommon.apiTesting.collectionRename')
                      "
                      :ref="collection.temp_name"
                      @keyup.enter="saveNewCollectionName(collection)"
                      @clickOutSide="saveNewCollectionName(collection)"
                    >
                    </TDInput>
                  </div>
                  <!-- phần tên thư mục -->
                  <div
                    v-else
                    class="flex td-collection-header"
                    @click="toggleCollection(collection)"
                  >
                    <div
                      class="flex text-nowrap-collection td-collection-header-left"
                    >
                      <TDArrow
                        :openProp="collection.openingCollection"
                        :arrowOpenDirection="$tdEnum.Direction.bottom"
                        :arrowDirection="$tdEnum.Direction.right"
                      />
                      <div class="" v-tooltip="collection.name">
                        {{ collection.name }}
                      </div>
                    </div>
                    <div class="flex td-collection-edit-btn">
                      <div
                        class="td-icon td-edit-icon"
                        v-tooltip="$t('i18nCommon.edit')"
                        @click.stop="enableRenameCollection(collection)"
                      ></div>
                      <div
                        v-tooltip="$t('i18nCommon.apiTesting.delete')"
                        class="td-icon td-close-icon"
                        @click.stop="deleteCollection(collection.collection_id)"
                      ></div>
                    </div>
                  </div>
                  <!-- danh sách các request có trong 1 thư mục, chỉ render khi đang mở thư mục -->
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
                      <span class="text-nowrap">
                        <div v-tooltip="request.requestName">
                          {{ request.requestName }}
                        </div>
                      </span>
                      <span class="text-nowrap">
                        <div
                          class="td-icon td-close-icon"
                          v-tooltip="$t('i18nCommon.apiTesting.delete')"
                          @click.stop="
                            deleteRequest(collection.collection_id, request)
                          "
                        ></div>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- phần upload hàng loạt request -->
            <div class="flex td-api-upload-collection-area">
              <!-- phần upload request từ postman -->
              <span>
                <TDUpload
                  v-tooltip="{
                    text: $t(
                      'i18nCommon.apiTesting.importCollectionPostmanTooltip'
                    ),
                    maxWidth: '500px',
                  }"
                  :label="$t('i18nCommon.apiTesting.importCollectionPostman')"
                  :accept="'.json'"
                  @change="importCollectionPostman"
                  ref="uploadAreaPostman"
                  :isShowSelect="false"
                  :multiple="true"
                />
              </span>
              <!-- phần upload request từ zip collection curl -->
              <span>
                <TDUpload
                  v-tooltip="{
                    text: $t(
                      'i18nCommon.apiTesting.importCollectionZipTooltip'
                    ),
                    maxWidth: '500px',
                  }"
                  :label="$t('i18nCommon.apiTesting.importCollectionZip')"
                  :accept="'.zip'"
                  @change="importCollectionZip"
                  ref="uploadArea"
                  :isShowSelect="false"
                  maxWidth="250px"
                />
              </span>
            </div>
            <!-- phần danh sách các nút khác ở chân sidebar -->
            <div class="flex">
              <!-- nút thêm request mới -->
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
              <!-- nút lưu request -->
              <TDButton
                v-tooltip="$t('i18nCommon.apiTesting.NeedRequestName')"
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
          </template>
        </div>
        <!-- phần sidebar nếu đang tùy chọn thiết lập api -->
        <div
          class="td-sidebar-content"
          v-show="
            APIConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.Setting
          "
        >
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="APIConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateAPIConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="APIConfigLayout.enableHighlight"
            :label="$t('i18nCommon.enableHighlight')"
            @change="updateAPIConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="APIConfigLayout.showReponse"
            :label="$t('i18nCommon.apiTesting.showReponse')"
            @change="updateAPIConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="APIConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateAPIConfigLayout"
          ></TDCheckbox>
          <template v-if="!isDesktopApp"
            ><div class="flex flex-start agent-url-label">
              <TDButton
                v-tooltip="$t('i18nCommon.apiTesting.toolTipDownloadExtension')"
                :noMargin="true"
                @click="downloadExtension"
                :type="$tdEnum.buttonType.secondary"
                :label="$t('i18nCommon.apiTesting.downloadExtension')"
              ></TDButton>
            </div>
            <div>
              <TDInput
                v-model="agentURL"
                :noMargin="true"
                :placeHolder="$t('i18nCommon.apiTesting.agentUrl')"
              />
            </div>
          </template>
        </div>
        <div
          class="td-sidebar-content"
          v-show="
            APIConfigLayout.currentSidebarOption ==
            $tdEnum.APISidebarOption.History
          "
        >
          <!-- nút lịch sử reqeust -->
          <TDHistorySidebar
            v-if="APIConfigLayout.currentAPIMode == $tdEnum.APIMode.ProMode"
            ref="historyProMode"
            :applyFunction="handleSendRequestFromHistoryProMode"
            titleKey="requestName"
            :noMargin="true"
            :positionRelative="false"
            :cacheKey="$tdEnum.cacheConfig.APIPromodeHistory"
            :historyContainerStyleEnum="
              $tdEnum.AbsolutePositionStyle.Top100Left
            "
          ></TDHistorySidebar>
          <TDHistorySidebar
            v-else
            ref="history"
            :applyFunction="handleSendRequestFromHistory"
            titleKey="requestName"
            :noMargin="true"
            :positionRelative="false"
            :cacheKey="$tdEnum.cacheConfig.APIHistory"
            :historyContainerStyleEnum="
              $tdEnum.AbsolutePositionStyle.Top100Left
            "
          ></TDHistorySidebar>
        </div>
      </template>
    </TDSubSidebar>
    <!-- hết phần nội dung sidebar -->
  </div>
</template>

<script>
import TDCURLUtil from "@/common/api/TDCURLUtil";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDArrow from "@/components/TDArrow.vue";
import JSZip from "jszip";
import TDAPIResponseStatus from "@/views/tools/APITesting/TDAPIResponseStatus.vue";
import TDHistorySidebar from "@/components/TDHistorySidebar.vue";
import TDAPIResponse from "@/views/tools/APITesting/TDAPIResponse.vue";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import TDMockAPIProMode from "@/common/mock/TDMockAPIProMode.js";
export default {
  name: "TDAPITesting",
  components: {
    TDSubSidebar,
    TDArrow,
    TDAPIResponse,
    TDAPIResponseStatus,
    TDHistorySidebar,
  },

  data() {
    return {
      apiUrl: "",
      requestName: "",
      currentRequestId: null,
      newCollectionName: "",
      agentURL: window.__env?.APITesting?.agentServer,
      allCollection: [],
      httpMethod: "GET",
      headersText: "Content-Type: application/json",
      bodyText: "",
      responseText: "",
      statusCode: null,
      responseTime: null,
      isLoading: false,
      startTime: null,
      currentRequest: null,
      APIConfigLayout: {
        showReponse: true,
        enableHighlight: true,
        wrapText: false,
        splitHorizontal: true,
        currentAPIMode: this.$tdEnum.APIMode.Normal,
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.APISidebarOption.Setting,
        currentAPIInfoOption: this.$tdEnum.APIInfoOption.body,
      },
      curlContent: "",
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
        TDMockAPIProMode[0].content,
      proModeTemplate: TDMockAPIProMode,
    };
  },
  async created() {
    let me = this;
    let allCollectionTmp = await me.$tdCache.get(
      me.$tdEnum.cacheConfig.APICollection
    );
    let tmpAPIConfigLayout = await me.$tdCache.get(
      me.$tdEnum.cacheConfig.APIConfigLayout
    );
    if (tmpAPIConfigLayout) {
      me.APIConfigLayout = Object.assign(
        me.APIConfigLayout,
        tmpAPIConfigLayout
      );
    }
    if (allCollectionTmp) {
      if (Array.isArray(allCollectionTmp)) {
        me.allCollection = allCollectionTmp;
      } else {
        me.allCollection = JSON.parse(allCollectionTmp) || [];
      }
    }
  },
  computed: {
    requestNameBuild() {
      let me = this;
      let title = me.$t("i18nCommon.apiTesting.requestName");
      if (me.APIConfigLayout.currentAPIMode == me.$tdEnum.APIMode.ProMode) {
        title = me.$t("i18nCommon.apiTesting.scriptName");
      }
      return title;
    },
    isDesktopApp() {
      return this.$tdUtility.isDesktopApp();
    },
    sidebarOptions() {
      let me = this;
      let options = [];
      options.push({
        value: this.$tdEnum.APISidebarOption.Setting,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.setting"),
        icon: "td-setting-icon",
      });
      options.push({
        value: this.$tdEnum.APISidebarOption.Collection,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.collection"),
        icon: "td-folder-icon",
      });
      options.push({
        value: this.$tdEnum.APISidebarOption.History,
        label: this.$t("i18nCommon.apiTesting.sidebarOption.history"),
        icon: "td-history-icon",
      });
      return options;
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
    async updateAPIConfigLayout() {
      let me = this;
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.APIConfigLayout,
        me.APIConfigLayout
      );
    },
    async toggleSidebar() {
      let me = this;
      me.APIConfigLayout.isShowSidebar = !me.APIConfigLayout.isShowSidebar;
      await me.updateAPIConfigLayout();
    },
    async addNewCollection() {
      let me = this;
      if (
        me.allCollection &&
        Array.isArray(me.allCollection) &&
        me.newCollectionName &&
        !me.allCollection.find((x) => x.name == me.newCollectionName)
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
      if (
        me.allCollection &&
        Array.isArray(me.allCollection) &&
        me.allCollection.length >= 0
      ) {
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
          TDDialogUtil.showPopup({
            dialogType: TDDialogEnum.TDAPISaveToCollectionPopup,
            ownerForm: this,
            props: {
              allCollection: me.allCollection,
            },
          });
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
    },
    async deleteRequest(collectionId, request) {
      let me = this;
      if (
        collectionId &&
        request &&
        me.allCollection &&
        me.allCollection.length > 0
      ) {
        let currentCollection = me.allCollection.find(
          (x) => x.collection_id == collectionId
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
    enableRenameCollection(collection) {
      let me = this;
      if (collection) {
        collection.is_renaming = true;
        collection.temp_name = collection.name;
        me.allCollection.forEach((item) => {
          if (item && item.collection_id != collection.collection_id) {
            delete item.is_renaming;
            delete item.temp_name;
          }
        });
        this.$nextTick(() => {
          if (me.$refs && me.$refs[collection.temp_name]) {
            let refs = me.$refs[collection.temp_name];
            if (refs) {
              if (Array.isArray(refs)) {
                refs[0].focus();
              } else {
                refs.focus();
              }
            }
          }
        });
      }
    },
    async saveNewCollectionName(collection) {
      let me = this;
      if (collection) {
        delete collection.is_renaming;
        if (collection.temp_name) {
          collection.name = collection.temp_name;
          delete collection.temp_name;
          await me.saveCollectionToCache();
        }
      }
    },
    async deleteCollection(collectionId) {
      let me = this;
      if (collectionId && me.allCollection && me.allCollection.length >= 0) {
        me.allCollection = me.allCollection.filter(
          (x) => x.collection_id != collectionId
        );

        await me.saveCollectionToCache();
      }
    },

    async importCollectionZip() {
      let me = this;
      if (
        me.$refs.uploadArea &&
        typeof me.$refs.uploadArea.getFileSelected == "function" &&
        typeof me.$refs.uploadArea.clearFileSelected == "function"
      ) {
        let zip = new JSZip();
        let files = me.$refs.uploadArea.getFileSelected();
        me.$refs.uploadArea.clearFileSelected();
        if (files && Array.isArray(files) && files.length > 0) {
          let zipData = await zip.loadAsync(files[0]);
          let newCollections = await me.buildCollectionsFromZip(zipData);
          await me.saveImportCollection(newCollections);
        }
      }
    },
    async saveImportCollection(newCollections) {
      let me = this;
      if (
        newCollections &&
        Array.isArray(newCollections) &&
        newCollections.length > 0
      ) {
        if (!me.allCollection || !Array.isArray(me.allCollection)) {
          me.allCollection = [];
        }
        me.allCollection = [...me.allCollection, ...newCollections];
        await me.saveCollectionToCache();
      }
    },
    async buildCollectionsFromZip(zip) {
      let me = this;
      let collections = {};

      for (let file of Object.values(zip.files)) {
        if (file.dir) continue;
        if (!file.name.endsWith(".txt")) continue;

        // bỏ root folder
        let parts = file.name.split("/").filter(Boolean);
        if (parts.length < 2) continue;

        let collectionName = parts[1]; // Shopee
        let fileName = parts.at(-1); // 01_xxx.txt
        let requestName = fileName.replace(".txt", "");

        let content = await file.async("string");

        if (!collections[collectionName]) {
          collections[collectionName] = {
            name: collectionName,
            collection_id: me.$tdUtility.newGuid(),
            openingCollection: false,
            requests: [],
          };
        }
        let curlConent = TDCURLUtil.parse(content);
        collections[collectionName].requests.push({
          requestName: requestName,
          apiUrl: curlConent.url,
          bodyText: curlConent.body
            ? JSON.stringify(JSON.parse(curlConent.body), null, 2)
            : null,
          headersText: curlConent.headersText,
          httpMethod: curlConent.method,
          requestId: me.$tdUtility.newGuid(),
        });
      }

      return Object.values(collections);
    },
    async importCollectionPostman() {
      let me = this;
      if (
        me.$refs.uploadAreaPostman &&
        typeof me.$refs.uploadAreaPostman.getFileSelected == "function" &&
        typeof me.$refs.uploadAreaPostman.clearFileSelected == "function"
      ) {
        let files = me.$refs.uploadAreaPostman.getFileSelected();
        me.$refs.uploadArea.clearFileSelected();
        if (files && Array.isArray(files) && files.length > 0) {
          let newCollections = [];
          for (let file of Object.values(files)) {
            if (!file.name.endsWith(".json")) {
              continue;
            }
            let temp = await me.buildCollectionsFromPostman(file, me);
            if (
              temp &&
              Array.isArray(temp.requests) &&
              temp.requests.length > 0
            ) {
              newCollections.push(temp);
            }
          }
          await me.saveImportCollection(newCollections);
        }
      }
    },

    async buildCollectionsFromPostman(file, me) {
      let contentTemp = await file.text();
      let content = JSON.parse(contentTemp);
      let result = null;
      if (
        content &&
        content.item &&
        content.info &&
        Array.isArray(content.item) &&
        content.item.length > 0 &&
        content.info.name
      ) {
        let tempCollection = {
          name: content.info.name,
          collection_id: me.$tdUtility.newGuid(),
          openingCollection: false,
          requests: [],
        };
        content.item.forEach((item) => {
          let bodyText = item?.request?.body?.raw;
          let headerRaw = item?.request?.header;
          let headerText = "";
          if (headerRaw && Array.isArray(headerRaw) && headerRaw.length > 0) {
            let convertHeader = [];
            headerRaw.forEach((headerItem) => {
              convertHeader.push(`${headerItem.key}:${headerItem.value}`);
            });
            if (convertHeader.length > 0) {
              headerText = convertHeader.join("\n");
            }
          }
          if (item.name && item?.request?.url?.raw) {
            tempCollection.requests.push({
              requestName: item.name,
              apiUrl: item?.request?.url?.raw,
              bodyText: bodyText
                ? JSON.stringify(JSON.parse(bodyText), null, 2)
                : null,
              headersText: headerText,
              httpMethod: item?.request?.method ?? "GET",
              requestId: me.$tdUtility.newGuid(),
            });
          }
        });
        result = tempCollection;
      }
      return result;
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
      this.setGlobalInfoBeforeRequest();
      if (me.APIConfigLayout.currentAPIMode == me.$tdEnum.APIMode.ProMode) {
        await me.handleSendRequestProMode();
      } else if (me.APIConfigLayout.currentAPIMode == me.$tdEnum.APIMode.CURL) {
        await me.handleSendRequestCURL();
      } else if (
        me.APIConfigLayout.currentAPIMode == me.$tdEnum.APIMode.Normal
      ) {
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
          api_url: this.apiUrl,
          http_method: this.httpMethod,
          headers_text: this.headersText,
          body_text: this.bodyText || null,
        };

        // gọi API
        this.currentRequest = TDCURLUtil.fetchAgent(requestData);

        let response = await this.currentRequest.promise;

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
      if (!me.apiUrl && me.curlContent) {
        me.importCURL(true);
      }
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
    applyRequestProMode(template) {
      let me = this;
      if (template && template.scriptName && template.content) {
        me.requestName = template.scriptName;
        me.proModeSecranioCode =
          me.$t("i18nCommon.apiTesting.tutorialProModeCode") + template.content;
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
    openFormImportCURL() {
      let me = this;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDAPIImportCURLPopup,
        ownerForm: this,
        props: {
          APIConfigLayout: me.APIConfigLayout,
        },
      });
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
          me.bodyText = CURLParsed.body
            ? JSON.stringify(JSON.parse(CURLParsed.body), null, 2)
            : null;
        } catch (ex) {
          console.log(ex);
          me.bodyText = CURLParsed.body;
        }
        if (me.bodyText == "null") {
          me.bodyText = null;
        }
        me.httpMethod = CURLParsed.method;
        me.headersText = CURLParsed.headersText;
        result = true;
      } else {
        if (!isSilence) {
          me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
        }
        result = false;
      }
      return result;
    },
    async handleSelectedAPIMode() {
      let me = this;
      await me.updateAPIConfigLayout();
    },
    setGlobalInfoBeforeRequest() {
      let me = this;
      window.__tdInfo = {
        agentURL: me.agentURL ?? window.__env?.APITesting?.agentServer,
      };
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
        let injectedCode = TDCURLUtil.buildInjectCode(me.proModeSecranioCode);

        // Thực thi script
        let userFn = new Function(injectedCode);
        let result = await userFn();

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
        justify-content: space-between;
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

.loader-without-response {
  margin-left: 100px;
}
.td-header-collection {
  width: 100%;
  height: 30px;
  margin: var(--padding);
  gap: var(--padding);
  .td-new-collection {
    flex: 1;
  }
  .td-plus-icon {
    cursor: pointer;
  }
}
.td-collection {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  .td-collection-body {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    .td-collection-item {
      cursor: pointer;
      justify-content: flex-start;
      gap: var(--padding);
      width: 100%;
      min-height: 40px;
      margin-bottom: var(--padding);

      .td-collection-header {
        gap: var(--padding);
        padding: var(--padding);
        height: 40px;
        justify-content: space-between;
        width: 100%;
        background-color: var(--bg-thirt-color);
        border-radius: var(--border-radius);
        .td-collection-header-left {
          gap: var(--padding);
        }
      }
      .td-collection-header:hover {
        background-color: var(--bg-layer-color);
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
.td-sidebar-content {
  flex: 1;
  width: 100%;
  min-height: 0;
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

.td-close-icon {
}
.td-close-icon:hover {
}
.text-nowrap-collection {
  max-width: 215px !important;
  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.text-nowrap {
  max-width: 250px;
  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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
body[data-theme="dark"] {
  .td-top-right-btn:hover {
    cursor: pointer;
    background-color: var(--bg-layer-color);
  }
  .td-top-right-btn {
    border: 1px solid var(--bg-main-color);
  }
  .td-top-right-btn div {
    filter: invert(100);
  }
}
.title-request {
  margin-left: var(--padding);
}
.agent-url-label {
  gap: var(--padding);
  margin-bottom: var(--padding);
}
.td-api-upload-collection-area {
  margin: var(--padding);
  gap: var(--padding);
}
.td-collection-rename {
  width: 100%;
}
.td-collection-edit-btn {
  gap: var(--padding);
}
.td-template-content {
  height: 100%;
  width: 100%;
  justify-content: flex-start;
  margin: var(--padding);
  .td-template-item {
    cursor: pointer;
    height: 40px;
    width: 100%;
    padding: var(--padding);
    border-radius: var(--border-radius);
    justify-content: flex-start;
  }
  .td-template-item:hover {
    background-color: var(--bg-layer-color);
  }
}
</style>
