<template>
  <div class="flex flex-col container">
    <div class="mb-medium td-input-source">
      <TDTextarea
        :placeHolder="$t('i18nCommon.textManipulation.inputSource')"
        v-model="inputSource"
        class="td-input-source-textbox"
      >
      </TDTextarea>
      <div class="td-row-num">
        {{ totalRow }}
      </div>
      <div class="flex td-seperate">
        <TDInput
          v-model="columnSeperator"
          :label="$t('i18nCommon.textManipulation.columnSeperator')"
          placeHolder=" "
          class="td-column-seperate"
        />
        <TDInput
          v-model="rowSeperator"
          :label="$t('i18nCommon.textManipulation.rowSeperator')"
          placeHolder=" "
          class="td-column-seperate"
        />
      </div>
    </div>

    <div class="td-input-source">
      <TDTextarea
        :placeHolder="$t('i18nCommon.textManipulation.expressionSource')"
        v-model="expressionSource"
        class="td-input-source-textbox"
      ></TDTextarea>
      <div class="flex td-seperate">
        <TDInput
          v-model="outputRowSeperator"
          :label="$t('i18nCommon.textManipulation.rowSeperator')"
          placeHolder=" "
          class="td-column-seperate"
        />
      </div>
    </div>

    <div class="flex">
      <TDButton
        @click="manipulate"
        :label="$t('i18nCommon.textManipulation.manipulate')"
      ></TDButton>
      <TDButton
        @click="handleCopyResult"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.jsonToPostgreSQL.copy')"
      ></TDButton>
      <TDButton
        @click="applyExample"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.example')"
      ></TDButton>
    </div>
    <TDTextarea
      :placeHolder="$t('i18nCommon.textManipulation.outputSource')"
      v-model="outputSource"
      :readOnly="true"
    ></TDTextarea>
  </div>
</template>

<script>
import mock from "@/common/mock/TDMockTextManipulation.js";
export default {
  name: "TDTextManipulation",
  data() {
    return {
      inputSource: "",
      expressionSource: "",
      columnSeperator: ",",
      rowSeperator: "\\n",
      outputRowSeperator: "\\n",
      breakLineDisplay: "\\n",
      breakLineDisplayActual: "\n",
      defaultRowSeperator: "\n",
      defaultColSeperator: ",",
      defaultOutputRowSeperator: "\n",
      outputSource: "",
    };
  },
  computed: {
    rowSeperatorActual() {
      let me = this;
      let result = me.rowSeperator;
      if (result == me.breakLineDisplay) {
        result = me.breakLineDisplayActual;
      }
      if (!result) {
        result = me.defaultRowSeperator;
      }
      return result;
    },
    outputRowSeperatorActual() {
      let me = this;
      let result = me.outputRowSeperator;
      if (result == me.breakLineDisplay) {
        result = me.breakLineDisplayActual;
      }
      if (!result) {
        result = me.defaultOutputRowSeperator;
      }
      return result;
    },
    colSeperatorActual() {
      let me = this;
      let result = me.columnSeperator;
      if (result == me.breakLineDisplay) {
        result = me.breakLineDisplayActual;
      }
      if (!result) {
        result = me.defaultColSeperator;
      }
      return result;
    },
    totalRow() {
      let me = this;
      let total = 0;
      let textRow = me.$t("i18nCommon.textManipulation.rowNum");
      if (me.inputSource && me.rowSeperatorActual) {
        let arr = me.inputSource.split(me.rowSeperatorActual);
        total = arr.length;
      }
      return `${textRow}: ${total}`;
    },
  },
  created() {
    let me = this;
  },
  methods: {
    beforeManipulate() {
      let me = this;
      if (!me.rowSeperator) {
        me.rowSeperator = mock.rowSeperator;
      }
      if (!me.columnSeperator) {
        me.columnSeperator = mock.columnSeperator;
      }
    },
    manipulate() {
      let me = this;
      try {
        me.beforeManipulate();
        if (me.inputSource) {
          me.outputSource = "";
          let arrInput = me.inputSource.split(me.rowSeperatorActual);
          let arrResult = [];
          if (arrInput && arrInput.length > 0) {
            arrInput.forEach((inputItem) => {
              let res = me.manipulateByRow(inputItem);
              if (res) {
                arrResult.push(res);
              }
            });
          }
          if (arrResult && arrResult.length > 0) {
            me.outputSource = arrResult.join(me.outputRowSeperatorActual);
          }
        }
        me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
    manipulateByRow(inputItem) {
      let me = this;
      let result = "";
      if (inputItem && me.expressionSource && me.colSeperatorActual) {
        let arrInput = inputItem.split(me.colSeperatorActual);
        result = me.expressionSource;
        result = me.replaceMarkText(arrInput, result);
      }
      return result;
    },
    handleCopyResult() {
      this.$tdUtility.copyToClipboard(this.outputSource);
    },
    applyExample() {
      this.inputSource = mock.inputSource;
      this.expressionSource = mock.expressionSource;
      this.columnSeperator = mock.columnSeperator;
      this.rowSeperator = mock.rowSeperator;
      this.outputRowSeperator = mock.outputRowSeperator;
      this.outputSource = "";
      this.$tdToast.success(
        this.$t("i18nCommon.toastMessage.applyMockSuccess")
      );
    },
    /**
     * Biến đổi text theo cấu hình có sẵn
     */
    replaceMarkText(arrInput, result) {
      if (arrInput && arrInput.length > 0) {
        for (let i = arrInput.length - 1; i >= 0; i--) {
          let currentText = arrInput[i];
          if (currentText) {
            // viết hoa văn bản
            let expressionUpper = `$${i}.upper`;
            let textUpper = currentText.toUpperCase();
            result = result.replaceAll(expressionUpper, textUpper);

            // viết thường văn bản
            let expressionLower = `$${i}.lower`;
            let textLower = currentText.toLowerCase();
            result = result.replaceAll(expressionLower, textLower);

            // snake case văn bản
            let expressionSnake = `$${i}.snake`;
            let textSnake = currentText.split(" ").join("_").toLowerCase();
            result = result.replaceAll(expressionSnake, textSnake);

            // trim văn bản
            let expressionTrim = `$${i}.trim`;
            let textTrim = currentText.trim();
            result = result.replaceAll(expressionTrim, textTrim);

            // thay thế $0, $1 -> $n bằng text của user
            let expressionReplace = `$${i}`;
            result = result.replaceAll(expressionReplace, currentText);
          }
        }
      }
      return result;
    },
  },
};
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
}
.td-input-source {
  position: relative;
  width: 100%;
  height: 100%;
  .td-input-source-textbox {
    position: relative;
  }
  .td-row-num {
    position: absolute;
    top: var(--padding);
    right: var(--padding);
    font-size: var(--font-size-medium);
  }
  .td-row-num:hover {
    opacity: 0.5;
  }
  .td-seperate {
    position: absolute;
    bottom: 0;
    right: 0;
    width: fit-content;
    :deep(.td-input .td-label) {
      font-size: var(--font-size-medium);
    }
    :deep(.td-input .td-label:hover) {
      opacity: 0.5;
    }
    :deep(.td-input input) {
      width: 40px;
    }
  }
}
</style>
