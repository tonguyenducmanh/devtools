<template>
  <div class="td-form-data">
    <div class="td-form-data-header no-select">
      <slot name="header"></slot>
    </div>
    <div class="td-form-data-body">
      <div
        v-for="(field, indexField) in formData"
        :key="indexField"
        class="td-form-data-row"
      >
        <TDInput
          class="td-form-data-column"
          v-model="field.key"
          :noMargin="true"
          :placeHolder="$t('i18nCommon.apiTesting.formDataKey')"
        />
        <TDInput
          v-if="field.type == $tdEnum.APIFormDataType.text"
          class="td-form-data-column"
          v-model="field.value"
          :noMargin="true"
          :placeHolder="$t('i18nCommon.apiTesting.formDataValue')"
        />
        <div v-else class="td-form-data-column td-form-data-file">
          <span
            class="flex-one text-nowrap"
            :class="{ 'td-form-data-file-name-saved': !field.fileContent }"
            v-tooltip="field.fileName"
            >{{
              field.fileName || $t("i18nCommon.apiTesting.formDataFile")
            }}</span
          >
          <TDUpload
            iconClass="td-upload-icon"
            :hideBorder="true"
            @selected="(files) => selectFile(field, files)"
            v-tooltip="$t('i18nCommon.uploadFile')"
          />
        </div>
        <TDComboBox
          class="td-form-data-column"
          :noMargin="true"
          :width="100"
          :usingStylePercent="true"
          :isCapitalizeText="false"
          :options="formDataTypeOptions"
          :modelValue="field.type"
          @update:modelValue="(typeValue) => changeType(field, typeValue)"
        />
        <div class="td-form-data-column td-form-data-action">
          <TDButton
            :noMargin="true"
            :type="$tdEnum.buttonType.secondary"
            iconClass="td-close-icon"
            @click="removeField(indexField)"
            v-tooltip="$t('i18nCommon.apiTesting.delete')"
          />
        </div>
      </div>
      <div class="td-form-data-empty" v-if="formData.length == 0">
        {{ $t("i18nCommon.apiTesting.formDataEmpty") }}
      </div>
    </div>
    <div class="td-form-data-footer">
      <TDButton
        :noMargin="true"
        :isSmallButton="true"
        :type="$tdEnum.buttonType.secondary"
        iconClass="td-plus-icon"
        @click="addField"
        v-tooltip="$t('i18nCommon.apiTesting.add')"
      />
      <span class="flex-one text-nowrap td-form-data-info">{{
        formDataInfo
      }}</span>
      <TDButton
        :isSmallButton="true"
        :noMargin="true"
        :type="$tdEnum.buttonType.secondary"
        iconClass="td-close-icon"
        :readOnly="formData.length == 0"
        @click="removeAllFields"
        v-tooltip="$t('i18nCommon.apiTesting.formDataDeleteAll')"
      />
    </div>
  </div>
</template>

<script>
/**
 * Bảng nhập các field của body dạng multipart form data,
 * dùng chung cho api testing và api mocking
 */
export default {
  name: "TDAPIFormDataEditor",
  props: {
    // danh sách field, 2 bên dùng chung cùng 1 cấu trúc field
    modelValue: {
      type: Array,
      default: () => [],
    },
    // api testing cần gửi nội dung file lên server nên phải đọc file thành base64,
    // api mocking chỉ đối chiếu theo tên file nên không đọc
    isReadFileContent: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    // danh sách field do 2 bên dùng chung, thao tác trực tiếp trên list này
    formData() {
      return this.modelValue;
    },
    // 2 kiểu của 1 field form data, dùng cho combo box chọn text hoặc file
    formDataTypeOptions() {
      return [
        {
          value: this.$tdEnum.APIFormDataType.text,
          label: this.$t("i18nCommon.apiTesting.formDataTypeText"),
        },
        {
          value: this.$tdEnum.APIFormDataType.file,
          label: this.$t("i18nCommon.apiTesting.formDataTypeFile"),
        },
      ];
    },
    // thống kê số field text và số field file, hiển thị ở footer panel form data
    formDataInfo() {
      let countFile = this.formData.filter(
        (item) => item.type == this.$tdEnum.APIFormDataType.file,
      ).length;
      return this.$t("i18nCommon.apiTesting.formDataInfo").format(
        this.formData.length - countFile,
        countFile,
      );
    },
  },
  methods: {
    /**
     * Tạo mới 1 field, mặc định là dạng text
     */
    createField(fieldData) {
      return {
        key: fieldData?.key ?? "",
        value: fieldData?.value ?? "",
        type: fieldData?.type ?? this.$tdEnum.APIFormDataType.text,
        fileName: fieldData?.fileName ?? "",
        fileContentType: fieldData?.fileContentType ?? "",
        // nội dung file dạng base64, chỉ có khi user vừa chọn file trên máy
        fileContent: fieldData?.fileContent ?? "",
      };
    },
    addField() {
      this.formData.push(this.createField(null));
    },
    removeField(indexField) {
      this.formData.splice(indexField, 1);
    },
    removeAllFields() {
      this.formData.splice(0, this.formData.length);
    },
    /**
     * Đổi kiểu field khi chọn trong combo box, text thì xoá thông tin file,
     * file thì xoá value để không lưu nhầm 2 loại dữ liệu
     */
    changeType(field, typeValue) {
      if (!field || !typeValue || field.type == typeValue) {
        return;
      }
      field.type = typeValue;
      if (typeValue == this.$tdEnum.APIFormDataType.file) {
        field.value = "";
      } else {
        field.fileName = "";
        field.fileContentType = "";
        field.fileContent = "";
      }
    },
    /**
     * User chọn file cho field dạng file
     */
    async selectFile(field, files) {
      if (!field || !files || files.length == 0) return;
      let file = files[0];
      field.fileName = file.name;
      field.fileContentType = file.type;
      if (this.isReadFileContent) {
        field.fileContent = this.$tdUtility.arrayBufferToBase64(
          await file.arrayBuffer(),
        );
      }
    },
  },
};
</script>

<style scoped lang="scss">
// giống .highlight-layer của TDTextEditor để 3 panel nhìn đồng nhất
.td-form-data {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  // phải stretch, nếu kế thừa align-items của class flex thì các phần bên
  // trong bị co theo nội dung và header bị lệch vị trí khi đổi panel
  align-items: stretch;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  overflow: hidden;
}

.td-form-data:hover {
  border-color: var(--focus-color);
}

// giống .td-monaco-header của TDTextEditor để 3 panel nhìn đồng nhất
.td-form-data-header {
  flex-shrink: 0;
  height: 22px;
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  gap: var(--padding);
  font-size: var(--font-size-medium-rare);
  font-family: "Consolas", "Monaco", monospace;
  background-color: var(--td-monaco-footer-bg);
  color: var(--td-monaco-footer-fg);
  border-bottom: 1px solid
    color-mix(
      in srgb,
      var(--td-monaco-footer-bg) 70%,
      var(--td-monaco-footer-fg) 30%
    );
}

.td-form-data-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--padding);
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}

.td-form-data-row {
  display: grid;
  // key, value, kiểu field, nút xoá
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 100px auto;
  gap: var(--padding);
  align-items: center;
}

// grid item mặc định min-width auto, thêm min-width 0 để input co lại đúng cột
.td-form-data-column {
  min-width: 0;
}

// ô chọn file: dùng grid để nút upload chỉ chiếm đúng bề rộng icon,
// nếu dùng flex thì nút chiếm 100% bề ngang và che mất tên file
.td-form-data-file {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--padding);
  height: var(--base-component-height);
  padding: 0 var(--padding-medium);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  overflow: hidden;
}

// file đã lưu trong collection chỉ còn tên, cần chọn lại file mới gửi được
.td-form-data-file-name-saved {
  opacity: var(--placeholder-opacity);
}

.td-form-data-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.td-form-data-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--td-monaco-text-inactive);
  font-size: var(--font-size-medium-rare);
}

.td-form-data-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--padding-medium) var(--padding);
  // màu viền giống .td-monaco-footer của TDTextEditor
  border-top: 1px solid
    color-mix(
      in srgb,
      var(--td-monaco-footer-bg) 70%,
      var(--td-monaco-footer-fg) 30%
    );
}

// số field text và file, canh phải để không dính vào nút xoá toàn bộ
.td-form-data-info {
  text-align: right;
  font-size: var(--font-size-small);
  margin-right: var(--padding);
}
</style>
