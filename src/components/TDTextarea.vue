<template>
  <div class="td-textarea">
    <div v-if="label">{{ label }}</div>
    <textarea
      :placeholder="placeHolder"
      :value="modelValue"
      :disabled="readOnly"
      @input="changeInputValue"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop="handleDrop"
      :class="{ 'drag-over': isDragOver }"
    />
  </div>
</template>

<script>
import _ from "@/common/TDUtility.js";

export default {
  name: "TDTextarea",
  created() {},
  mounted() {},
  methods: {},
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
  },
  data() {
    return {
      value: null,
      isDragOver: false,
    };
  },
  watch: {},
  methods: {
    changeInputValue: _.debounce(function (e) {
      let me = this;
      me.$emit("update:modelValue", e.target.value);
    }, 500),

    handleDrop(event) {
      this.isDragOver = false;
      // handle drop logic here
    },
  },
};
</script>
<style lang="scss" scoped>
.td-textarea {
  display: flex;
  height: 100%;
  width: 100%;
  textarea {
    border: 2px solid var(--border-color);
    width: 100%;
    padding: var(--padding);
    border-radius: var(--border-radius);
  }

  textarea:focus {
    outline: none;
    border: 2px solid var(--focus-color);
  }

  .drop-zone {
    background-color: #eee;
    padding: 20px;
    border: 2px solid transparent;
    min-height: 100px;
    transition: background-color 0.3s, outline 0.3s;
  }

  .drag-over {
    outline: 2px dashed black;
    background-color: rgba(100, 100, 100, 0.6);
  }
}
</style>
