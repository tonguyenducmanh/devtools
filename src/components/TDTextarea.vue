<template>
  <div
    class="td-textarea"
    :class="{ 'flex-col': isLabelTop, 'td-textarea-read-only': readOnly }"
    :style="styleComputed"
  >
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ label }}
    </div>
    <textarea
      :placeholder="placeHolder"
      :value="modelValue"
      :disabled="readOnly"
      @input="changeInputValue"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :class="{ 'drag-over': isDragOver, 'fix-size': !resizeable }"
    />
  </div>
</template>

<script>
export default {
  name: "TDTextarea",
  created() {},
  mounted() {},
  methods: {},
  computed: {
    styleComputed() {
      let style = "";
      let me = this;
      if (me.width) {
        style += `width: ${me.width} !important; `;
      }
      if (me.height) {
        style += `height: ${me.height} !important; `;
      }
      return style;
    },
  },
  props: {
    placeHolder: {
      type: String,
      default: "Nhập giá trị",
    },
    modelValue: {
      type: String,
      default: null,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    width: {
      type: String,
      default: null,
    },
    height: {
      type: String,
      default: null,
    },
    isLabelTop: {
      type: Boolean,
      default: false,
    },
    resizeable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      value: null,
      isDragOver: false,
    };
  },
  watch: {},
  methods: {
    changeInputValue(e) {
      let me = this;
      me.$emit("update:modelValue", e.target.value);
    },

    handleDragOver(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = true;
    },

    handleDragLeave(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = false;
    },

    handleDrop(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = false;
      me.$emit("dropValue", e);
    },
  },
};
</script>
<style lang="scss" scoped>
.td-textarea {
  display: flex;
  height: 100%;
  width: 100%;
  .td-label {
    overflow-wrap: normal; /* Allows breaking long words */
    word-break: keep-all; /* For wider browser support */
    white-space: nowrap; /* Ensure wrapping is enabled */
    padding-right: var(--padding);
  }
  .td-label-top {
    padding-bottom: var(--padding);
  }
  textarea {
    border: 2px solid var(--border-color);
    width: 100%;
    height: 100%;
    padding: var(--padding);
    border-radius: var(--border-radius);
    background-color: var(--bg-main-color);
    color: var(--text-primary-color);
  }

  textarea:focus {
    outline: none;
    border: 2px solid var(--focus-color);
  }
  .drag-over {
    outline: 2px dashed black;
    background-color: rgba(100, 100, 100, 0.6);
  }
  .fix-size {
    resize: none;
  }
}
.td-textarea-read-only textarea {
  background-color: var(--bg-sub-color);
}
</style>
