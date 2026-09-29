/**
 * Logic chung cho body dạng json và multipart form data,
 * dùng chung cho api testing và api mocking
 */
export default {
  data() {
    return {
      // các field của body dạng multipart form data
      formData: [],
      // 2 kiểu body của request, dùng cho combo box ở header
      bodyTypeOptions: [
        {
          value: this.$tdEnum.APIBodyType.json,
          label: this.$t("i18nCommon.apiTesting.bodyTypeJson"),
        },
        {
          value: this.$tdEnum.APIBodyType.formData,
          label: this.$t("i18nCommon.apiTesting.bodyTypeFormData"),
        },
      ],
    };
  },
  computed: {
    // kiểu body gửi lên backend, không đổi theo việc đang xem header hay body
    currentBodyType() {
      let me = this;
      return me.currentConfigLayout.currentBodyType ==
        me.$tdEnum.APIBodyType.formData
        ? me.$tdEnum.APIBodyType.formData
        : me.$tdEnum.APIBodyType.json;
    },
    // body có phải dạng multipart form data không
    isFormDataRequest() {
      let me = this;
      return me.currentBodyType == me.$tdEnum.APIBodyType.formData;
    },
    // panel request đang mở, form data là 1 biến thể của panel body
    // nên tính về body để nút "xem body" hiện đang active
    currentRequestPanelOption() {
      let me = this;
      return me.currentConfigLayout.currentAPIInfoOption ==
        me.$tdEnum.APIInfoOption.bodyFormData
        ? me.$tdEnum.APIInfoOption.body
        : me.currentConfigLayout.currentAPIInfoOption;
    },
  },
  methods: {
    /**
     * Tạo mới 1 field form data, mặc định là dạng text
     * @param {object} fieldData field đã có sẵn, null nếu tạo mới
     * @returns {object} field có đủ các thuộc tính
     */
    createFormField(fieldData) {
      let me = this;
      return {
        key: fieldData?.key ?? "",
        value: fieldData?.value ?? "",
        type: fieldData?.type ?? me.$tdEnum.APIFormDataType.text,
        fileName: fieldData?.fileName ?? "",
        fileContentType: fieldData?.fileContentType ?? "",
        // nội dung file dạng base64, chỉ có khi user vừa chọn file trên máy
        fileContent: fieldData?.fileContent ?? "",
      };
    },
    /**
     * Field form data lưu xuống database, không lưu nội dung file vì quá nặng
     * @param {Array} formDataList danh sách field, mặc định lấy danh sách đang nhập
     * @returns {Array} danh sách field đã bỏ nội dung file
     */
    buildFormDataForSave(formDataList) {
      let me = this;
      let list = formDataList ?? me.formData;
      return list.map((field) => ({
        key: field.key ?? "",
        value: field.value ?? "",
        type: field.type ?? me.$tdEnum.APIFormDataType.text,
        // postman lưu đường dẫn file ở src, curl lưu ở fileName
        fileName: field.fileName ?? field.src?.[0] ?? "",
        fileContentType: field.fileContentType ?? field.file_content_type ?? "",
      }));
    },
    /**
     * Body gửi lên khi lưu: json lưu body_text, form data lưu form_data_text
     * @returns {object} body_type, body_text, form_data_text
     */
    buildBodyDataForSave() {
      let me = this;
      return {
        body_type: me.currentBodyType,
        body_text: me.isFormDataRequest ? null : me.bodyText,
        form_data_text: me.isFormDataRequest
          ? JSON.stringify(me.buildFormDataForSave())
          : null,
      };
    },
    /**
     * Đọc lại danh sách field form data đã lưu trong database
     * @param {string} formDataText json chứa danh sách field
     * @returns {Array} danh sách field
     */
    parseFormDataFromText(formDataText) {
      let me = this;
      if (!formDataText) {
        return [];
      }
      try {
        let formData = JSON.parse(formDataText);
        if (!Array.isArray(formData)) {
          return [];
        }
        return formData.map((field) => me.createFormField(field));
      } catch (error) {
        console.error("Lỗi đọc form data:", error);
        return [];
      }
    },
  },
};
