<template>
  <div
    class="td-table-viewer"
    :class="{
      'td-table-viewer-no-margin': noMargin,
      'td-table-viewer-striped': striped,
      'td-table-viewer-bordered': bordered,
      'td-table-viewer-hoverable': hoverable,
    }"
  >
    <div v-if="label" class="td-table-label">
      {{ label.capitalize() }}
    </div>

    <div class="td-table-container" :style="containerStyle">
      <div class="td-table-wrapper" ref="tableWrapper">
        <table class="td-table">
          <!-- Header -->
          <thead
            class="td-table-header"
            :class="{ 'td-table-header-sticky': stickyHeader }"
          >
            <tr>
              <!-- Selection Column -->
              <th
                v-if="selectable"
                class="td-table-cell td-table-cell-checkbox"
              >
                <label class="td-table-checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="td-table-checkbox"
                  />
                  <span class="td-checkbox-custom">
                    <span
                      v-if="isAllSelected"
                      class="td-checkbox-active"
                    ></span>
                  </span>
                </label>
              </th>

              <!-- Index Column -->
              <th v-if="showIndex" class="td-table-cell td-table-cell-index">
                {{ indexLabel }}
              </th>

              <!-- Data Columns -->
              <th
                v-for="(column, index) in computedColumns"
                :key="`header-${index}`"
                class="td-table-cell td-table-cell-header"
                :class="getColumnClass(column)"
                :style="getColumnStyle(column)"
                @click="handleHeaderClick(column)"
              >
                <div class="td-table-header-content">
                  <span>{{ column.label || column.key }}</span>
                  <span v-if="column.sortable" class="td-table-sort-icon">
                    <span
                      v-if="
                        sortColumn === column.key && sortDirection === 'asc'
                      "
                      >▲</span
                    >
                    <span
                      v-else-if="
                        sortColumn === column.key && sortDirection === 'desc'
                      "
                      >▼</span
                    >
                    <span v-else class="td-table-sort-icon-inactive">⬍</span>
                  </span>
                </div>
              </th>

              <!-- Actions Column -->
              <th v-if="hasActions" class="td-table-cell td-table-cell-actions">
                {{ actionsLabel }}
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody class="td-table-body">
            <tr
              v-for="(row, rowIndex) in processedData"
              :key="`row-${rowIndex}`"
              class="td-table-row"
              :class="{ 'td-table-row-selected': isRowSelected(row) }"
              @click="handleRowClick(row, rowIndex)"
            >
              <!-- Selection Column -->
              <td
                v-if="selectable"
                class="td-table-cell td-table-cell-checkbox"
              >
                <label class="td-table-checkbox-label" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isRowSelected(row)"
                    @change="toggleRowSelection(row)"
                    class="td-table-checkbox"
                  />
                  <span class="td-checkbox-custom">
                    <span
                      v-if="isRowSelected(row)"
                      class="td-checkbox-active"
                    ></span>
                  </span>
                </label>
              </td>

              <!-- Index Column -->
              <td v-if="showIndex" class="td-table-cell td-table-cell-index">
                {{ rowIndex + 1 }}
              </td>

              <!-- Data Columns -->
              <td
                v-for="(column, colIndex) in computedColumns"
                :key="`cell-${rowIndex}-${colIndex}`"
                class="td-table-cell"
                :class="getColumnClass(column)"
                :style="getColumnStyle(column)"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :column="column"
                  :value="getCellValue(row, column.key)"
                  :rowIndex="rowIndex"
                >
                  {{ formatCellValue(row, column) }}
                </slot>
              </td>

              <!-- Actions Column -->
              <td v-if="hasActions" class="td-table-cell td-table-cell-actions">
                <slot name="actions" :row="row" :rowIndex="rowIndex">
                  <div class="td-table-actions">
                    <button
                      v-for="(action, actionIndex) in actions"
                      :key="`action-${actionIndex}`"
                      @click.stop="handleAction(action, row, rowIndex)"
                      class="td-table-action-button"
                      :class="action.class"
                    >
                      {{ action.label }}
                    </button>
                  </div>
                </slot>
              </td>
            </tr>

            <!-- Empty State -->
            <tr
              v-if="!processedData || processedData.length === 0"
              class="td-table-row-empty"
            >
              <td
                :colspan="totalColumns"
                class="td-table-cell td-table-cell-empty"
              >
                <slot name="empty">
                  {{ emptyText }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer Info -->
    <div v-if="showFooter" class="td-table-footer">
      <div class="td-table-info">
        <slot
          name="footer"
          :selectedRows="selectedRows"
          :totalRows="processedData.length"
        >
          <span v-if="selectable && selectedRows.length > 0">
            {{ selectedRows.length }}
            {{ $t("i18nCommon.selectedRecord") }} /
          </span>
          <span>
            {{ processedData.length }} {{ $t("i18nCommon.record") }}
          </span>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDTableViewer",

  props: {
    // Data
    data: {
      type: Array,
      default: () => [],
    },
    columns: {
      type: Array,
      default: null,
      // Example: [{ key: 'name', label: 'Name', width: '200px', align: 'left', sortable: true, formatter: (val) => val }]
      // If not provided, columns will be auto-generated from data
    },

    // Selection
    selectable: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    rowKey: {
      type: String,
      default: "id",
    },

    // Display options
    label: {
      type: String,
      default: null,
    },
    showIndex: {
      type: Boolean,
      default: false,
    },
    indexLabel: {
      type: String,
      default: "#",
    },
    striped: {
      type: Boolean,
      default: true,
    },
    bordered: {
      type: Boolean,
      default: true,
    },
    hoverable: {
      type: Boolean,
      default: true,
    },
    stickyHeader: {
      type: Boolean,
      default: true,
    },

    // Size
    height: {
      type: String,
      default: null,
    },
    maxHeight: {
      type: String,
      default: "600px",
    },
    noMargin: {
      type: Boolean,
      default: false,
    },

    // Sorting
    sortable: {
      type: Boolean,
      default: false,
    },
    defaultSortColumn: {
      type: String,
      default: null,
    },
    defaultSortDirection: {
      type: String,
      default: "asc",
      validator: (val) => ["asc", "desc"].includes(val),
    },

    // Actions
    actions: {
      type: Array,
      default: () => [],
      // Example: [{ label: 'Edit', action: 'edit', class: 'primary' }]
    },
    actionsLabel: {
      type: String,
      default: "Actions",
    },

    // Empty state
    emptyText: {
      type: String,
      default: "No data available",
    },

    // Footer
    showFooter: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      selectedRows: [],
      sortColumn: this.defaultSortColumn,
      sortDirection: this.defaultSortDirection,
    };
  },

  computed: {
    // Auto-generate columns from data if not provided
    computedColumns() {
      if (this.columns && this.columns.length > 0) {
        return this.columns;
      }

      // Generate columns from first data row
      if (!this.data || this.data.length === 0) {
        return [];
      }

      const firstRow = this.data[0];
      return Object.keys(firstRow)
        .filter((key) => key !== this.rowKey) // Exclude rowKey from columns
        .map((key) => ({
          key,
          label: this.formatLabel(key),
          width: "auto",
          align: "left",
        }));
    },

    containerStyle() {
      const styles = {};
      if (this.height) {
        styles.height = this.height;
      }
      if (this.maxHeight) {
        styles.maxHeight = this.maxHeight;
      }
      return styles;
    },

    hasActions() {
      return this.actions && this.actions.length > 0;
    },

    totalColumns() {
      let count = this.computedColumns.length;
      if (this.selectable) count++;
      if (this.showIndex) count++;
      if (this.hasActions) count++;
      return count;
    },

    isAllSelected() {
      return (
        this.data.length > 0 && this.selectedRows.length === this.data.length
      );
    },

    processedData() {
      let data = [...this.data];

      // Apply sorting
      if (this.sortColumn) {
        data.sort((a, b) => {
          const aVal = this.getCellValue(a, this.sortColumn);
          const bVal = this.getCellValue(b, this.sortColumn);

          let comparison = 0;
          if (aVal > bVal) comparison = 1;
          if (aVal < bVal) comparison = -1;

          return this.sortDirection === "asc" ? comparison : -comparison;
        });
      }

      return data;
    },
  },

  watch: {
    modelValue: {
      handler(newVal) {
        this.selectedRows = newVal || [];
      },
      immediate: true,
    },
  },

  methods: {
    formatLabel(key) {
      // Convert camelCase or snake_case to Title Case
      return key
        .replace(/([A-Z])/g, " $1") // camelCase to spaces
        .replace(/_/g, " ") // snake_case to spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalize first letter of each word
        .trim();
    },

    getCellValue(row, key) {
      return key.split(".").reduce((obj, k) => obj?.[k], row);
    },

    formatCellValue(row, column) {
      const value = this.getCellValue(row, column.key);
      if (column.formatter && typeof column.formatter === "function") {
        return column.formatter(value, row);
      }
      return value ?? "-";
    },

    getColumnClass(column) {
      const classes = [];
      if (column.align) {
        classes.push(`td-table-cell-${column.align}`);
      }
      if (column.class) {
        classes.push(column.class);
      }
      return classes.join(" ");
    },

    getColumnStyle(column) {
      const styles = {};

      // Auto width means fit-content
      if (column.width === "auto") {
        styles.width = "fit-content";
        styles.whiteSpace = "nowrap";
      } else if (column.width) {
        styles.width = column.width;
        styles.minWidth = column.width;
      }

      if (column.minWidth) {
        styles.minWidth = column.minWidth;
      }
      if (column.maxWidth) {
        styles.maxWidth = column.maxWidth;
      }
      return styles;
    },

    isRowSelected(row) {
      const rowId = row[this.rowKey];
      return this.selectedRows.some((r) => r[this.rowKey] === rowId);
    },

    toggleRowSelection(row) {
      const rowId = row[this.rowKey];
      const index = this.selectedRows.findIndex(
        (r) => r[this.rowKey] === rowId,
      );

      if (index > -1) {
        this.selectedRows.splice(index, 1);
      } else {
        this.selectedRows.push(row);
      }

      this.$emit("update:modelValue", this.selectedRows);
      this.$emit("selection-change", this.selectedRows);
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedRows = [];
      } else {
        this.selectedRows = [...this.data];
      }

      this.$emit("update:modelValue", this.selectedRows);
      this.$emit("selection-change", this.selectedRows);
    },

    handleHeaderClick(column) {
      if (!column.sortable) return;

      if (this.sortColumn === column.key) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortColumn = column.key;
        this.sortDirection = "asc";
      }

      this.$emit("sort-change", {
        column: this.sortColumn,
        direction: this.sortDirection,
      });
    },

    handleRowClick(row, index) {
      this.$emit("row-click", row, index);
    },

    handleAction(action, row, index) {
      this.$emit("action", {
        action: action.action || action.label,
        row,
        index,
      });
    },

    clearSelection() {
      this.selectedRows = [];
      this.$emit("update:modelValue", this.selectedRows);
      this.$emit("selection-change", this.selectedRows);
    },

    selectAll() {
      this.selectedRows = [...this.data];
      this.$emit("update:modelValue", this.selectedRows);
      this.$emit("selection-change", this.selectedRows);
    },
  },
};
</script>

<style lang="scss" scoped>
.td-table-viewer {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: var(--padding);

  .td-table-label {
    font-size: var(--font-size-l-medium);
    font-weight: 500;
    margin-bottom: var(--padding);
    color: var(--text-primary-color);
  }

  .td-table-container {
    position: relative;
    overflow: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--bg-main-color);

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: var(--bg-layer-color);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 4px;

      &:hover {
        background: var(--text-secondary-color);
      }
    }
  }

  .td-table-wrapper {
    min-width: 100%;
    width: fit-content;
  }

  .td-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-medium);

    .td-table-header {
      background-color: var(--bg-layer-color);

      &.td-table-header-sticky {
        position: sticky;
        top: 0;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      tr {
        border-bottom: 2px solid var(--border-color);
      }
    }

    .td-table-cell {
      padding: var(--padding) calc(var(--padding) * 1.5);
      text-align: left;
      color: var(--text-primary-color);

      &-header {
        font-weight: 600;
        cursor: default;
        user-select: none;

        .td-table-header-content {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .td-table-sort-icon {
          font-size: 10px;
          opacity: 0.7;

          &-inactive {
            opacity: 0.3;
          }
        }
      }

      &-checkbox {
        width: 40px;
        text-align: center;
        padding: var(--padding);
      }

      &-index {
        width: 50px;
        text-align: center;
        color: var(--text-secondary-color);
        font-weight: 500;
      }

      &-actions {
        width: auto;
        white-space: nowrap;
      }

      &-left {
        text-align: left;
      }

      &-center {
        text-align: center;
      }

      &-right {
        text-align: right;
      }

      &-empty {
        text-align: center;
        padding: calc(var(--padding) * 4);
        color: var(--text-secondary-color);
      }
    }

    .td-table-body {
      .td-table-row {
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s ease;

        &:last-child {
          border-bottom: none;
        }

        &-selected {
          background-color: rgba(var(--focus-color-rgb), 0.1);
        }

        &-empty {
          background-color: transparent;

          &:hover {
            background-color: transparent;
          }
        }
      }
    }
  }

  // Checkbox styles
  .td-table-checkbox-label {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .td-table-checkbox {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }

    .td-checkbox-custom {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--bg-main-color);
      transition: all 0.2s ease;

      .td-checkbox-active {
        width: 10px;
        height: 6px;
        border-width: 0 0 2px 2px;
        border-style: solid;
        border-color: var(--btn-color);
        transform: rotate(-45deg) translate(1px, -1px);
      }
    }

    .td-table-checkbox:checked + .td-checkbox-custom {
      border-color: var(--btn-color);
    }

    &:hover .td-checkbox-custom {
      border-color: var(--focus-color);
    }
  }

  // Actions
  .td-table-actions {
    display: flex;
    gap: calc(var(--padding) / 2);

    .td-table-action-button {
      padding: calc(var(--padding) / 2) var(--padding);
      font-size: var(--font-size-small);
      border: 1px solid var(--border-color);
      border-radius: calc(var(--border-radius) / 2);
      background-color: var(--bg-thirt-color);
      color: var(--text-primary-color);
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        border-color: var(--focus-color);
        background-color: var(--bg-layer-color);
      }

      &:active {
        transform: scale(0.98);
      }

      &.primary {
        background-color: var(--btn-color);
        color: white;
        border-color: var(--btn-color);

        &:hover {
          background-color: var(--focus-color);
          border-color: var(--focus-color);
        }
      }

      &.danger {
        color: #dc3545;
        border-color: #dc3545;

        &:hover {
          background-color: #dc3545;
          color: white;
        }
      }
    }
  }

  // Footer
  .td-table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--padding);
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-layer-color);
    border-radius: 0 0 var(--border-radius) var(--border-radius);

    .td-table-info {
      font-size: var(--font-size-small);
      color: var(--text-secondary-color);
    }
  }
}

// Striped rows
.td-table-viewer-striped {
  .td-table-body .td-table-row:nth-child(even) {
    background-color: var(--bg-layer-color);
  }
}

// Hoverable rows
.td-table-viewer-hoverable {
  .td-table-body .td-table-row:hover {
    background-color: var(--bg-thirt-color);
    cursor: pointer;
  }

  .td-table-body .td-table-row-selected:hover {
    background-color: rgba(var(--focus-color-rgb), 0.15);
  }
}

// No margin
.td-table-viewer-no-margin {
  margin: 0;
}

// Responsive
@media (max-width: 768px) {
  .td-table-viewer {
    .td-table-cell {
      padding: calc(var(--padding) / 2) var(--padding);
      font-size: var(--font-size-small);

      &-actions {
        .td-table-action-button {
          padding: calc(var(--padding) / 3) calc(var(--padding) / 2);
          font-size: 11px;
        }
      }
    }
  }
}
</style>
