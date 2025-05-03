<template>
  <button class="td-button noselect" :disabled="readOnly">{{ label }}</button>
</template>

<script>
export default {
  name: "TDButton",
  created() {},
  mounted() {},
  methods: {},
  props: {
    readOnly: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "Button",
    },
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
.td-button {
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: 30px;
  padding: var(--padding);
  margin: var(--padding);
  background-color: var(--btn-color);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.td-button:hover {
  background-color: var(--focus-color);
  transform: scale(1.01);
}

.td-button:active {
  background-color: var(--focus-color);
  transform: scale(0.98);
}
.td-button:focus {
  border:2px solid var(--focus-color);
  box-sizing: border-box;
}
</style>
