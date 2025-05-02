<template>
  <div class="container flex flex-col">
    <div class="title">
      💖 Mapping JSON object A to JSON object B with recusive key value mapping!
    </div>
    <div class="td-mapping-container">
      <div class="flex td-mapping-group">
        <TDTextarea
          placeHolder="Object need mapping value"
          v-model="originalObjectText"
          height="300px"
          width="500px"
        ></TDTextarea>
        <TDTextarea
          placeHolder="Object copy value"
          v-model="targetObjectText"
          height="300px"
          width="500px"
        ></TDTextarea>
      </div>
      <div class="flex td-mapping-group">
        <TDTextarea
          placeHolder="Result after mapping"
          v-model="replacedObjectText"
          height="300px"
          :readOnly="true"
          width="500px"
        ></TDTextarea>
        <TDTextarea
          placeHolder="Key value mapping error"
          v-model="errorListText"
          height="300px"
          :readOnly="true"
          width="500px"
        ></TDTextarea>
      </div>
      <div class="flex">
        <TDButton @click="mappingNow" label="Mapping now"></TDButton>
        <TDButton @click="formatResult" label="Format result"></TDButton>
        <TDButton
          @click="haddleCopyEvent(replacedObjectText)"
          label="Copy result"
        ></TDButton>
        <TDButton
          @click="haddleCopyEvent(errorListText)"
          label="Copy error"
        ></TDButton>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  name: "TDMappingJSON",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  data() {
    return {
      // danh sách lỗi
      errorList: {},
      errorListText: null,
      // object json input cần copy value
      originalObject: {},
      originalObjectText: null,
      // object json input cần paste value
      targetObject: {},
      targetObjectText: null,
      // object json tùy chỉnh
      customObject: {},
      customObjectText: null,
      // object json output sau khi copy
      replacedObject: {},
      replacedObjectText: null,
    };
  },
  methods: {
    haddleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
    },
    // region xử lý file
    mappingNow() {
      let me = this;
      //reset error
      me.errorList = {};
      me.prepareData();
      if (me.originalObject && me.targetObject && me.customObject) {
        // thay thế các value của object B bằng value của object A
        let replaceLanguageText = me.doMappingKeyValuePairRecusive(
          me.originalObject,
          me.targetObject,
          me.customObject
        );

        me.replacedObject = replaceLanguageText;

        // hiển thị cho user xem
        me.replacedObjectText = JSON.stringify(me.replacedObject);
        me.errorListText = JSON.stringify(me.errorList);
      }
    },
    formatResult() {
      let me = this;
      me.replacedObjectText = JSON.stringify(me.replacedObject, null, " ");
      me.errorListText = JSON.stringify(me.errorList, null, " ");
    },
    /**
     * chuẩn bị dữ liệu
     */
    prepareData() {
      let me = this;
      // lấy ra các object đầu vào
      me.originalObject = me.parseJSONNotSafeObject(me.originalObjectText);
      me.targetObject = me.parseJSONNotSafeObject(me.targetObjectText);
      me.customObject = me.parseJSONNotSafeObject(me.customObjectText);
    },

    /**
     *
     * @param value dữ liệu sẽ parse sang object
     */
    parseJSONNotSafeObject(value) {
      let result = {};
      if (value && typeof value == "string") {
        try {
          result = JSON.parse(value);
        } catch (error) {
          console.log("Không thể JSON parse, bắt đầu thử cách khác" + error);
          let tempScript = `result = ${value}`;
          eval(tempScript);
        }
      }
      return result;
    },

    /**
     * Thực hiện mapping key value đệ quy
     */
    doMappingKeyValuePairRecusive(originalObject, targetObject, customObject) {
      let me = this;
      let result = originalObject;

      for (const key in result) {
        if (Object.hasOwnProperty.call(result, key)) {
          const element = result[key];

          if (typeof element == "string") {
            //bo sung check neu trung value thi cung them vao error list
            me.checkValueIsSameByKey(originalObject, targetObject, key);

            if (
              targetObject &&
              targetObject.hasOwnProperty(key) &&
              targetObject[key]
            ) {
              result[key] = targetObject[key];
            } else if (
              customObject &&
              customObject.hasOwnProperty(key) &&
              customObject[key]
            ) {
              result[key] = customObject[key];
            } else {
              // thêm vào mảng lỗi để user biết là không mapping được
              me.errorList[key] = result[key];
            }
          }
          // nếu key hiện tại có value là object thì gọi đệ quy
          if (typeof element == "object") {
            let targetLang = null;
            if (
              targetObject &&
              targetObject.hasOwnProperty(key) &&
              targetObject[key]
            ) {
              targetLang = targetObject[key];
            }
            result[key] = me.doMappingKeyValuePairRecusive(
              result[key],
              targetLang,
              customObject
            );
          }
        }
      }
      return result;
    },

    /**
     * bo sung check neu trung value thi cung them vao error list
     */
    checkValueIsSameByKey(originalObject, targetObject, key) {
      let me = this;
      if (
        key &&
        originalObject &&
        originalObject.hasOwnProperty(key) &&
        targetObject &&
        targetObject.hasOwnProperty(key) &&
        originalObject[key] == targetObject[key]
      ) {
        me.errorList[key] = originalObject[key];
      }
    },
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;
  min-height: 100vh;
  box-shadow: none;
}
.td-mapping-group {
  column-gap: var(--padding-large);
  margin-bottom: var(--padding-large);
}
</style>
