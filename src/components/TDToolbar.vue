<template>
  <div class="td-toolbar" :class="containerClass">
    <template v-for="(group, gIdx) in resolvedGroups" :key="gIdx">
      <!-- Separator trước group (nếu có và không phải group đầu tiên) -->
      <div
        v-if="gIdx > 0 && group.showSeparator !== false"
        class="td-toolbar-sep"
      ></div>

      <!-- Group -->
      <div class="td-toolbar-group" :class="group.class">
        <template v-for="item in group.items" :key="item.key">
          <!-- Spacer -->
          <div v-if="item.type === 'spacer'" class="td-toolbar-spacer"></div>

          <!-- Custom label (ví dụ: hiển thị scale %) -->
          <span
            v-else-if="item.type === 'label'"
            class="td-toolbar-label"
            :class="item.class"
            :style="item.style"
            >{{ resolveValue(item.value) }}</span
          >

          <!-- Divider dọc nhỏ bên trong group -->
          <div
            v-else-if="item.type === 'divider'"
            class="td-toolbar-inner-sep"
          ></div>

          <!-- Dropdown button -->
          <div
            v-else-if="item.type === 'dropdown'"
            class="td-toolbar-dropdown-wrap"
          >
            <div
              class="td-toolbar-btn"
              :class="[
                item.class,
                {
                  'td-toolbar-btn-danger': item.danger,
                  'td-toolbar-btn-active': openDropdownKey === item.key,
                },
              ]"
              :style="item.style"
              @click.stop="toggleDropdown(item.key)"
              v-tooltip="resolveLabel(item)"
            >
              <span v-if="item.icon" class="td-icon" :class="item.icon"></span>
              <span v-if="item.text" class="td-toolbar-btn-text">{{
                item.text
              }}</span>
            </div>
            <div
              v-if="openDropdownKey === item.key"
              class="td-toolbar-dropdown"
              v-click-outside="() => closeDropdown()"
              :class="item.dropdownClass"
            >
              <div
                v-for="opt in resolveOptions(item.options)"
                :key="opt.value"
                class="td-toolbar-dropdown-item"
                :class="{ 'td-toolbar-dropdown-item-danger': opt.danger }"
                @click="onDropdownItemClick(item, opt)"
              >
                <span
                  v-if="opt.icon"
                  class="td-icon"
                  :class="opt.icon"
                  style="margin-right: 6px"
                ></span>
                {{ opt.label }}
              </div>
            </div>
          </div>

          <!-- Regular button -->
          <div
            v-else
            class="td-toolbar-btn"
            :class="[
              item.class,
              {
                'td-toolbar-btn-danger': item.danger,
                'td-toolbar-btn-active': isActive(item),
              },
            ]"
            :style="item.style"
            @click="onItemClick(item)"
            v-tooltip="resolveLabel(item)"
          >
            <span v-if="item.icon" class="td-icon" :class="item.icon"></span>
            <span v-if="item.text" class="td-toolbar-btn-text">{{
              item.text
            }}</span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
/**
 * TDToolbar – Generic configurable toolbar
 *
 * Props:
 *  - groups: Array<ToolbarGroup>        – Danh sách group nút
 *  - context: Object                    – Dữ liệu dynamic (vd: { scale: 108 })
 *  - containerClass: String|Object|Array – Extra class cho wrapper
 *
 * ToolbarGroup shape:
 * {
 *   key: String,
 *   showSeparator: Boolean,   // default true (hiện dải phân cách trước group)
 *   class: String,
 *   items: Array<ToolbarItem>
 * }
 *
 * ToolbarItem shape (type = 'button' | 'dropdown' | 'label' | 'spacer' | 'divider'):
 * {
 *   key: String,
 *   type: 'button' | 'dropdown' | 'label' | 'spacer' | 'divider',  // default 'button'
 *   icon: String,              // css class icon
 *   text: String,              // text bên cạnh icon
 *   tooltip: String | Function(context),  // tooltip string hoặc fn trả về string
 *   danger: Boolean,           // style nguy hiểm (đỏ khi hover)
 *   class: String,
 *   style: Object,
 *   action: Function(context, item) | String,  // fn hoặc tên event để emit
 *   active: Boolean | Function(context),       // trạng thái active
 *
 *   // Chỉ dùng cho type='label':
 *   value: String | Function(context),  // giá trị hiển thị
 *
 *   // Chỉ dùng cho type='dropdown':
 *   options: Array<{value, label, icon?, danger?}> | Function(context),
 *   dropdownClass: String,
 *   // action của dropdown nhận thêm tham số option đã chọn:
 *   // action: Function(context, item, selectedOption) | String (emit tên event với payload = selectedOption)
 * }
 */
export default {
  name: "TDToolbar",

  emits: ["action"],

  props: {
    /**
     * Mảng các group. Mỗi group có { key, showSeparator?, class?, items[] }
     */
    groups: {
      type: Array,
      default: () => [],
    },
    /**
     * Dữ liệu động được truyền vào cho các fn (vd: { scale: 108 })
     */
    context: {
      type: Object,
      default: () => ({}),
    },
    /**
     * Extra class cho container
     */
    containerClass: {
      type: [String, Object, Array],
      default: "",
    },
  },

  data() {
    return {
      openDropdownKey: null,
    };
  },

  computed: {
    resolvedGroups() {
      return this.groups.filter(
        (g) => g && Array.isArray(g.items) && g.items.length > 0,
      );
    },
  },

  methods: {
    // ─── Helpers ────────────────────────────────────────────────

    resolveLabel(item) {
      if (!item.tooltip) return undefined;
      return typeof item.tooltip === "function"
        ? item.tooltip(this.context)
        : item.tooltip;
    },

    resolveValue(value) {
      return typeof value === "function" ? value(this.context) : value;
    },

    resolveOptions(options) {
      return typeof options === "function"
        ? options(this.context)
        : options || [];
    },

    isActive(item) {
      if (item.active === undefined) return false;
      return typeof item.active === "function"
        ? item.active(this.context)
        : item.active;
    },

    // ─── Actions ────────────────────────────────────────────────

    onItemClick(item) {
      if (!item.action) return;
      if (typeof item.action === "function") {
        item.action(this.context, item);
      } else if (typeof item.action === "string") {
        // Emit tên action để parent xử lý
        this.$emit("action", { key: item.action, item, context: this.context });
      }
    },

    toggleDropdown(key) {
      this.openDropdownKey = this.openDropdownKey === key ? null : key;
    },

    closeDropdown() {
      this.openDropdownKey = null;
    },

    onDropdownItemClick(item, opt) {
      this.openDropdownKey = null;
      if (!item.action) return;
      if (typeof item.action === "function") {
        item.action(this.context, item, opt);
      } else if (typeof item.action === "string") {
        this.$emit("action", {
          key: item.action,
          item,
          option: opt,
          context: this.context,
        });
      }
    },
  },
};
</script>

<style scoped>
.td-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 var(--padding);
  background: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  flex-shrink: 0;
  flex-wrap: wrap;
  margin-bottom: var(--padding);
}

.td-toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--padding-medium);
}

.td-toolbar-sep {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 var(--padding);
  flex-shrink: 0;
}

.td-toolbar-inner-sep {
  width: 1px;
  height: 16px;
  background: var(--border-color);
  flex-shrink: 0;
}

.td-toolbar-spacer {
  flex: 1;
}

/* ─── Button ──────────────────────────────────────────────── */
.td-toolbar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  cursor: pointer;
  user-select: none;
  transition:
    background 0.12s,
    border-color 0.12s;
  border: 1px solid transparent;
}

/* Khi có text, mở rộng chiều ngang */
.td-toolbar-btn:has(.td-toolbar-btn-text) {
  width: auto;
  padding: 0 var(--padding-medium);
  gap: 4px;
}

.td-toolbar-btn:hover {
  background-color: var(--bg-layer-color);
  border-color: var(--border-color);
}

.td-toolbar-btn-danger:hover {
  background-color: rgba(220, 50, 50, 0.2);
  border-color: rgba(220, 50, 50, 0.4);
}

.td-toolbar-btn-active {
  background-color: var(--bg-layer-color);
  border-color: var(--border-color);
}

.td-toolbar-btn-text {
  font-size: var(--font-size-small);
  color: var(--text-primary-color);
  white-space: nowrap;
}

/* ─── Label ───────────────────────────────────────────────── */
.td-toolbar-label {
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
  min-width: 40px;
  text-align: center;
  user-select: none;
}

/* ─── Dropdown ────────────────────────────────────────────── */
.td-toolbar-dropdown-wrap {
  position: relative;
}

.td-toolbar-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 180px;
  background: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  padding: 4px 0;
  box-shadow: var(--box-shadow);
  z-index: 200;
}

.td-toolbar-dropdown-item {
  display: flex;
  align-items: center;
  padding: var(--padding) var(--padding-large);
  font-size: var(--font-size-medium-rare);
  color: var(--text-primary-color);
  cursor: pointer;
  transition: background 0.15s;
}

.td-toolbar-dropdown-item:hover {
  background: var(--bg-layer-color);
}

.td-toolbar-dropdown-item-danger {
  color: rgba(220, 50, 50, 0.9);
}

.td-toolbar-dropdown-item-danger:hover {
  background: rgba(220, 50, 50, 0.1);
}
</style>
