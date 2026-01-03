<template>
  <div class="flex flex-col td-sub-sidebar-wrapper">
    <!-- phần nội dung sidebar -->
    <div
      class="flex td-sub-sidebar"
      :class="{ 'td-sub-sidebar-collaspe': !modelValue }"
    >
      <!-- phần thanh border ngăn cách main area và sidebar area -->
      <div v-if="modelValue" class="divide"></div>
      <div v-if="modelValue" class="flex flex-col td-sub-sidebar-content">
        <div v-if="$slots.menu" class="td-sidebar-menu">
          <slot name="menu" />
        </div>
        <slot name="main" />
      </div>
      <TDToggleArea
        :collapsed="!modelValue"
        position="right"
        @toggle="toggleSidebar"
      />
    </div>
    <!-- hết phần nội dung sidebar -->
  </div>
</template>

<script>
import TDToggleArea from "@/components/TDToggleArea.vue";
export default {
  name: "TDSubSidebar",
  components: { TDToggleArea },
  props: {
    modelValue: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      open: false,
    };
  },
  methods: {
    async toggleSidebar() {
      let me = this;
      me.$emit("update:modelValue", !me.modelValue);
      me.$emit("toggleSidebar");
    },
  },
  computed: {},
};
</script>

<style lang="scss" scoped>
.td-sub-sidebar-wrapper {
  height: 100%;
}

.td-sub-sidebar {
  flex: 1;
  min-height: 0;
  position: relative;
  margin-left: var(--padding);
  .td-sub-sidebar-content {
    width: 300px;
    height: 100%;
    position: relative;
    padding-left: var(--padding);
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
.td-sidebar-menu {
  width: 100%;
  background-color: var(--bg-layer-color);
  border-radius: var(--border-radius);
}
</style>
