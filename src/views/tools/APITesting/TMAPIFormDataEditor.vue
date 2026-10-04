<template>
  <div class="tm-form-data">
    <div class="tm-form-data-header no-select">
      <slot name="header"></slot>
    </div>
    <div class="tm-form-data-body">
      <div class="tm-form-data-columns" v-if="formData.length > 0">
        <!-- cột key, bề rộng kéo được, 1 resizer duy nhất ở giữa 2 cột -->
        <div class="tm-form-data-key-col" :style="keySizeStyle">
          <TMInput
            v-for="(field, indexField) in formData"
            :key="'key-' + indexField"
            v-model="field.key"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.apiTesting.formDataKey')"
          />
        </div>
        <TMResizer
          direction="horizontal"
          :minSize="10"
          :maxSize="70"
          @resize="handleResizeKey"
        />
        <!-- cột value, mỗi dòng gồm value, combo kiểu field và nút xoá -->
        <div class="tm-form-data-value-col">
          <div
            v-for="(field, indexField) in formData"
            :key="'value-' + indexField"
            class="tm-form-data-row"
          >
            <TMInput
              v-if="field.type == $tmEnum.APIFormDataType.text"
              class="tm-form-data-value"
              v-model="field.value"
              :noMargin="true"
              :placeHolder="$t('i18nCommon.apiTesting.formDataValue')"
            />
            <div v-else class="tm-form-data-value tm-form-data-file">
              <span
                class="flex-one text-nowrap"
                :class="{
                  'tm-form-data-file-name-saved': !field.fileContent,
                }"
                v-tooltip="field.fileName"
                >{{
                  field.fileName || $t("i18nCommon.apiTesting.formDataFile")
                }}</span
              >
              <TMUpload
                iconClass="tm-upload-icon"
                :hideBorder="true"
                @selected="(files) => selectFile(field, files)"
                v-tooltip="$t('i18nCommon.uploadFile')"
              />
            </div>
            <TMComboBox
              class="tm-form-data-type"
              :noMargin="true"
              :width="100"
              :usingStylePercent="true"
              :isCapitalizeText="false"
              :options="formDataTypeOptions"
              :modelValue="field.type"
              @update:modelValue="(typeValue) => changeType(field, typeValue)"
            />
            <div class="tm-form-data-action">
              <TMButton
                :noMargin="true"
                :type="$tmEnum.buttonType.secondary"
                iconClass="tm-close-icon"
                @click="removeField(indexField)"
                v-tooltip="$t('i18nCommon.apiTesting.delete')"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="tm-form-data-empty" v-else>
        {{ $t("i18nCommon.apiTesting.formDataEmpty") }}
      </div>
    </div>
    <div class="tm-form-data-footer">
      <TMButton
        :noMargin="true"
        :isSmallButton="true"
        :type="$tmEnum.buttonType.secondary"
        iconClass="tm-plus-icon"
        @click="addField"
        v-tooltip="$t('i18nCommon.apiTesting.add')"
      />
      <span class="flex-one text-nowrap tm-form-data-info">{{
        formDataInfo
      }}</span>
      <TMButton
        :isSmallButton="true"
        :noMargin="true"
        :type="$tmEnum.buttonType.secondary"
        iconClass="tm-close-icon"
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
  name: "TMAPIFormDataEditor",
  data() {
    return {
      // bề rộng cột key, phần còn lại là của value, kéo cột giữa để đổi
      keySize: 40,
    };
  },
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
    // bề rộng cột key, TMInput nhận style gắn thẳng vào ô
    keySizeStyle() {
      return { width: `${this.keySize}%` };
    },
    // 2 kiểu của 1 field form data, dùng cho combo box chọn text hoặc file
    formDataTypeOptions() {
      return [
        {
          value: this.$tmEnum.APIFormDataType.text,
          label: this.$t("i18nCommon.apiTesting.formDataTypeText"),
        },
        {
          value: this.$tmEnum.APIFormDataType.file,
          label: this.$t("i18nCommon.apiTesting.formDataTypeFile"),
        },
      ];
    },
    // thống kê số field text và số field file, hiển thị ở footer panel form data
    formDataInfo() {
      let countFile = this.formData.filter(
        (item) => item.type == this.$tmEnum.APIFormDataType.file,
      ).length;
      return this.$t("i18nCommon.apiTesting.formDataInfo").format(
        this.formData.length - countFile,
        countFile,
      );
    },
  },
  methods: {
    /**
     * Kéo cột giữa để đổi bề rộng giữa key và value,
     * mọi dòng dùng chung 1 tỉ lệ nên đặt ở component
     * @param {object} sizes do TMResizer trả về
     */
    handleResizeKey(sizes) {
      this.keySize = sizes.leftSize;
    },
    /**
     * Tạo mới 1 field, mặc định là dạng text
     */
    createField(fieldData) {
      return {
        key: fieldData?.key ?? "",
        value: fieldData?.value ?? "",
        type: fieldData?.type ?? this.$tmEnum.APIFormDataType.text,
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
      if (typeValue == this.$tmEnum.APIFormDataType.file) {
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
        field.fileContent = this.$tmUtility.arrayBufferToBase64(
          await file.arrayBuffer(),
        );
      }
    },
  },
};
</script>

<style scoped lang="scss">
// giống .highlight-layer của TMTextEditor để 3 panel nhìn đồng nhất
.tm-form-data {
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

.tm-form-data:hover {
  border-color: var(--focus-color);
}

// giống .tm-monaco-header của TMTextEditor để 3 panel nhìn đồng nhất
.tm-form-data-header {
  flex-shrink: 0;
  height: 22px;
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  gap: var(--padding);
  font-size: var(--font-size-medium-rare);
  font-family: "Consolas", "Monaco", monospace;
  background-color: var(--tm-monaco-footer-bg);
  color: var(--tm-monaco-footer-fg);
  border-bottom: 1px solid
    color-mix(
      in srgb,
      var(--tm-monaco-footer-bg) 70%,
      var(--tm-monaco-footer-fg) 30%
    );
}

.tm-form-data-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--padding);
  display: flex;
  flex-direction: column;
}

// 2 cột key và value, 1 resizer duy nhất nằm giữa
.tm-form-data-columns {
  display: flex;
  gap: var(--padding-medium);
}

// cột key chiếm tỉ lệ %, các ô cao đúng bằng 1 dòng của cột value
.tm-form-data-key-col {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}

// cột value chiếm phần còn lại, chiều cao mỗi dòng khớp cột key
.tm-form-data-value-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}

.tm-form-data-row {
  display: flex;
  align-items: center;
  gap: var(--padding);
}

// phần còn lại của dòng là value, min-width 0 để input co lại đúng cột
.tm-form-data-value {
  flex: 1;
  min-width: 0;
}

// combo box kiểu field giữ nguyên bề rộng
.tm-form-data-type {
  flex: 0 0 100px;
}

// ô chọn file: dùng grid để nút upload chỉ chiếm đúng bề rộng icon,
// nếu dùng flex thì nút chiếm 100% bề ngang và che mất tên file
.tm-form-data-file {
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
.tm-form-data-file-name-saved {
  opacity: var(--placeholder-opacity);
}

.tm-form-data-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.tm-form-data-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tm-monaco-text-inactive);
  font-size: var(--font-size-medium-rare);
}

.tm-form-data-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: var(--padding-medium) var(--padding);
  // màu viền giống .tm-monaco-footer của TMTextEditor
  border-top: 1px solid
    color-mix(
      in srgb,
      var(--tm-monaco-footer-bg) 70%,
      var(--tm-monaco-footer-fg) 30%
    );
}

// số field text và file, canh phải để không dính vào nút xoá toàn bộ
.tm-form-data-info {
  text-align: right;
  font-size: var(--font-size-small);
  margin-right: var(--padding);
}
</style>
