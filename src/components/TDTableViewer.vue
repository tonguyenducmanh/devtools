<template>
  <div
    class="td-table-viewer"
    :class="{
      'td-table-viewer-no-margin': noMargin,
      'td-table-viewer-hoverable': hoverable,
    }"
  >
    <!-- Table View -->
    <template v-if="viewMode === 'table'">
      <div
        class="td-table-container"
        :class="{ 'td-table-grabbing': _isDragging }"
        :style="containerStyle"
        ref="tableContainer"
        @scroll="handleScroll"
        @mousedown="onDragStart"
      >
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
                  class="td-table-cell td-table-cell-checkbox td-table-cell-sticky-header"
                  :style="checkboxStickyStyle"
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
                <th
                  v-if="showIndex"
                  class="td-table-cell td-table-cell-index td-table-cell-sticky-header"
                  :style="indexStickyStyle"
                >
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
                <th
                  v-if="hasActions"
                  class="td-table-cell td-table-cell-actions"
                >
                  {{ actionsLabel }}
                </th>
              </tr>
            </thead>

            <!-- Body -->
            <tbody class="td-table-body">
              <!-- Top spacer for virtual scroll -->
              <tr
                v-if="virtualScroll && paddingTop > 0"
                :style="{ height: paddingTop + 'px' }"
              >
                <td
                  :colspan="totalColumns"
                  style="padding: 0; border: none"
                ></td>
              </tr>

              <tr
                v-for="{ row, index: rowIndex } in visibleData"
                :key="row[rowKey] || `row-${rowIndex}`"
                class="td-table-row"
                :class="{ 'td-table-row-selected': isRowSelected(row) }"
                @click="handleRowClick(row, rowIndex)"
              >
                <!-- Selection Column -->
                <td
                  v-if="selectable"
                  class="td-table-cell td-table-cell-checkbox td-table-cell-sticky"
                  :style="checkboxStickyStyle"
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
                <td
                  v-if="showIndex"
                  class="td-table-cell td-table-cell-index td-table-cell-sticky"
                  :style="indexStickyStyle"
                  @click="copyRow(row)"
                  @contextmenu.prevent="onIndexContextMenu(row, $event)"
                >
                  <div>
                    {{ rowIndex + 1 }}
                  </div>
                </td>

                <!-- Data Columns -->
                <td
                  v-for="(column, colIndex) in computedColumns"
                  :key="`cell-${rowIndex}-${colIndex}`"
                  class="td-table-cell"
                  :class="[getColumnClass(column)]"
                  :style="getColumnStyle(column)"
                  @contextmenu.prevent="onCellContextMenu(row, column, $event)"
                >
                  <slot
                    :name="`cell-${column.key}`"
                    :row="row"
                    :column="column"
                    :value="getCellValue(row, column.key)"
                    :rowIndex="rowIndex"
                  >
                    <div
                      class="td-table-cell-content"
                      :class="{
                        'td-table-cell-content-clamped': virtualScroll,
                      }"
                      :style="getCellContentStyle()"
                    >
                      {{ formatCellValue(row, column) }}
                    </div>
                  </slot>
                </td>

                <!-- Actions Column -->
                <td
                  v-if="hasActions"
                  class="td-table-cell td-table-cell-actions"
                >
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

              <!-- Bottom spacer for virtual scroll -->
              <tr
                v-if="virtualScroll && paddingBottom > 0"
                :style="{ height: paddingBottom + 'px' }"
              >
                <td
                  :colspan="totalColumns"
                  style="padding: 0; border: none"
                ></td>
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
                    {{ emptyText || $t("i18nCommon.noDataAvailable") }}
                  </slot>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Record View -->
    <div v-else class="td-record-container" :style="containerStyle">
      <div class="td-record-header">
        <div class="td-record-back-btn" @click="switchToTableView">
          <TDArrow
            :arrowDirection="tdEnum.Direction.left"
            :openProp="false"
            v-tooltip="$t('i18nCommon.backToTable')"
          />
        </div>
        <span class="td-record-title"
          >{{ $t("i18nCommon.viewRecord") }} #{{ currentRecordIndex + 1 }}</span
        >
      </div>
      <div class="td-record-body">
        <table class="td-record-table">
          <tbody>
            <tr
              v-for="col in computedColumns"
              :key="col.key"
              class="td-record-row"
            >
              <td class="td-record-cell td-record-cell-label">
                {{ col.label || col.key }}
              </td>
              <td class="td-record-cell td-record-cell-value">
                {{ formatCellValue(currentRecord, col) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer Info -->
    <div v-if="showFooter" class="td-table-footer">
      <div class="flex td-table-info">
        <slot
          name="footer"
          :selectedRows="selectedRows"
          :totalRows="processedData.length"
        >
          <span class="td-table-info-row-count">
            <span v-if="selectable && selectedRows.length > 0">
              {{ selectedRows.length }}
              {{ $t("i18nCommon.selectedRecord") }} /
            </span>
            <span>
              {{ processedData.length }} {{ $t("i18nCommon.record") }}
            </span>
          </span>
          <span
            v-if="usingFooterHelp"
            v-tooltip="$t('i18nCommon.footerHelpDesc')"
          >
            {{ footerHelpText }}
          </span>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import tdEnum from "@/common/TDEnum.js";
import TDArrow from "@/components/TDArrow.vue";

export default {
  name: "TDTableViewer",
  components: { TDArrow },

  props: {
    // Data
    tableData: {
      type: Array,
      default: () => [],
    },
    usingFooterHelp: {
      type: Boolean,
      default: true,
    },
    footerHelp: {
      type: String,
      default: null,
    },
    columns: {
      type: Array,
      default: null,
      // Example: [{
      //   key: 'name',
      //   label: 'Name',
      //   width: '200px',
      //   minWidth: '100px',
      //   maxWidth: '400px',
      //   align: 'left',
      //   sortable: true,
      //   formatter: (val) => val,
      //   autoWidth: true,
      // }]
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
    showIndex: {
      type: Boolean,
      default: false,
    },
    indexLabel: {
      type: String,
      default: "",
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
      default: "100%",
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
    autoCalculateWidth: {
      type: Boolean,
      default: true, // Enable auto width calculation by default
    },
    charWidthPx: {
      type: Number,
      default: 10, // Average character width in pixels
    },
    minColumnWidth: {
      type: Number,
      default: 100, // Minimum column width in pixels
    },
    maxColumnWidth: {
      type: Number,
      default: 400, // Maximum column width in pixels
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
    emptyCellText: {
      type: String,
      default: "",
    },

    // Actions
    actions: {
      type: Array,
      default: () => [],
    },
    actionsLabel: {
      type: String,
      default: "Actions",
    },

    // Empty state
    emptyText: {
      type: String,
      default: null,
    },

    // Footer
    showFooter: {
      type: Boolean,
      default: false,
    },
    enableLogCopyData: {
      type: Boolean,
      default: true,
    },

    // Virtual Scroll
    virtualScroll: {
      type: Boolean,
      default: true,
    },
    rowHeight: {
      type: Number,
      default: 45,
    },
    bufferSize: {
      type: Number,
      default: 5,
    },

    // Khi virtual scroll bật thì cell text chỉ hiển thị tối đa N dòng
    virtualScrollLineClamp: {
      type: Number,
      default: 2,
    },
  },

  data() {
    return {
      selectedRows: [],
      sortColumn: this.defaultSortColumn,
      sortDirection: this.defaultSortDirection,
      columnWidthCache: {}, // Cache calculated widths
      scrollTop: 0,
      containerHeight: 400,

      // drag-to-scroll
      _isDragging: false,
      _dragStartX: 0,
      _dragStartY: 0,
      _scrollStartLeft: 0,
      _scrollStartTop: 0,

      // record view mode
      viewMode: "table",
      currentRecord: null,
    };
  },

  computed: {
    tdEnum() {
      return tdEnum;
    },
    currentRecordIndex() {
      if (!this.currentRecord) return -1;
      return this.processedData.findIndex(
        (r) => r[this.rowKey] === this.currentRecord[this.rowKey],
      );
    },
    checkboxStickyStyle() {
      return {
        position: "sticky",
        left: "0px",
      };
    },
    indexStickyStyle() {
      return {
        position: "sticky",
        left: this.selectable ? "48px" : "0px",
      };
    },
    footerHelpText() {
      let me = this;
      if (me.usingFooterHelp) {
        if (me.footerHelp) {
          return me.footerHelp;
        } else {
          return me.$t("i18nCommon.footerHelp");
        }
      }
      return null;
    },

    // Auto-generate columns from data if not provided
    computedColumns() {
      if (this.columns && this.columns.length > 0) {
        return this.columns.map((col) => ({
          ...col,
          autoWidth:
            col.autoWidth !== undefined
              ? col.autoWidth
              : this.autoCalculateWidth,
        }));
      }

      // Generate columns from first data row
      if (!this.tableData || this.tableData.length === 0) {
        return [];
      }

      const firstRow = this.tableData[0];
      return Object.keys(firstRow).map((key) => ({
        key,
        label: this.formatLabel(key),
        align: "left",
        autoWidth: this.autoCalculateWidth,
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
        this.tableData.length > 0 &&
        this.selectedRows.length === this.tableData.length
      );
    },

    processedData() {
      let tableData = [...this.tableData];

      // Apply sorting
      if (this.sortColumn) {
        tableData.sort((a, b) => {
          const aVal = this.getCellValue(a, this.sortColumn);
          const bVal = this.getCellValue(b, this.sortColumn);

          let comparison = 0;
          if (aVal > bVal) comparison = 1;
          if (aVal < bVal) comparison = -1;

          return this.sortDirection === "asc" ? comparison : -comparison;
        });
      }

      return tableData;
    },

    // Virtual Scroll computed properties
    totalRows() {
      return this.processedData.length;
    },
    visibleData() {
      if (!this.virtualScroll) {
        return this.processedData.map((row, index) => ({ row, index }));
      }
      const start = this.startRowWithBuffer;
      const end = this.endRowWithBuffer;
      return this.processedData.slice(start, end).map((row, i) => ({
        row,
        index: start + i,
      }));
    },
    startRow() {
      return Math.max(0, Math.floor(this.scrollTop / this.rowHeight));
    },
    endRow() {
      return Math.min(
        this.totalRows - 1,
        Math.ceil((this.scrollTop + this.containerHeight) / this.rowHeight),
      );
    },
    startRowWithBuffer() {
      return Math.max(0, this.startRow - this.bufferSize);
    },
    endRowWithBuffer() {
      return Math.min(this.totalRows, this.endRow + this.bufferSize + 1);
    },
    paddingTop() {
      if (!this.virtualScroll) return 0;
      return this.startRowWithBuffer * this.rowHeight;
    },
    paddingBottom() {
      if (!this.virtualScroll) return 0;
      const remainingRows = this.totalRows - this.endRowWithBuffer;
      return Math.max(0, remainingRows * this.rowHeight);
    },
  },

  watch: {
    modelValue: {
      handler(newVal) {
        this.selectedRows = newVal || [];
      },
      immediate: true,
    },
    tableData: {
      handler() {
        // Recalculate widths when data changes
        this.columnWidthCache = {};
      },
      deep: true,
    },
  },

  mounted() {
    if (this.virtualScroll) {
      this.updateContainerSize();
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerSize();
      });
      if (this.$refs.tableContainer) {
        this.resizeObserver.observe(this.$refs.tableContainer);
      }
    }
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    document.removeEventListener("mousemove", this.onDragMove);
    document.removeEventListener("mouseup", this.onDragEnd);
  },

  methods: {
    handleScroll(event) {
      if (this.virtualScroll) {
        this.scrollTop = event.target.scrollTop;
      }
    },

    updateContainerSize() {
      if (this.$refs.tableContainer) {
        this.containerHeight = this.$refs.tableContainer.clientHeight;
      }
    },

    formatLabel(key) {
      return key.trim();
    },

    getCellValue(row, key) {
      return key.split(".").reduce((obj, k) => obj?.[k], row);
    },

    formatCellValue(row, column) {
      const value = this.getCellValue(row, column.key);
      if (column.formatter && typeof column.formatter === "function") {
        return column.formatter(value, row);
      }
      if (value === null || value === undefined) {
        return "null";
      }
      if (value === false) {
        return "false";
      }
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return value === "" ? this.emptyCellText : value;
    },

    getCellContentStyle() {
      if (!this.virtualScroll) return {};

      return {
        WebkitLineClamp: String(this.virtualScrollLineClamp),
        lineClamp: String(this.virtualScrollLineClamp),
      };
    },

    /**
     * Calculate the maximum content width for a column
     */
    calculateMaxContentWidth(column) {
      // Check cache first
      if (this.columnWidthCache[column.key]) {
        return this.columnWidthCache[column.key];
      }

      let maxLength = 0;

      // Check header length
      const headerText = column.label || column.key;
      maxLength = Math.max(maxLength, headerText.length);

      // Check all data rows
      this.tableData.forEach((row) => {
        const value = this.formatCellValue(row, column);
        const valueStr = String(value);
        maxLength = Math.max(maxLength, valueStr.length);
      });

      // Calculate width in pixels (character count * average char width + padding)
      let calculatedWidth = maxLength * this.charWidthPx + 48; // 48px for padding

      // Cache the result
      if (calculatedWidth > this.maxColumnWidth) {
        calculatedWidth = this.maxColumnWidth;
      } else if (calculatedWidth < this.minColumnWidth) {
        calculatedWidth = this.minColumnWidth;
      }
      this.columnWidthCache[column.key] = calculatedWidth;
      return calculatedWidth;
    },

    /**
     * Get tooltip content for truncated cells
     */
    getTooltipContent(row, column) {
      const value = this.formatCellValue(row, column);
      const valueStr = String(value);
      return valueStr;
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

      // If column has explicit width, use it
      if (column.width && column.width !== "auto") {
        styles.width = column.width;
        styles.minWidth = column.width;
      }
      // Auto calculate width based on content
      else if (column.autoWidth) {
        const calculatedWidth = this.calculateMaxContentWidth(column);
        styles.width = `${calculatedWidth}px`;
        styles.minWidth = `${calculatedWidth}px`;
      }

      // Apply explicit min/max width if provided
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
        this.selectedRows = [...this.tableData];
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
      this.selectedRows = [...this.tableData];
      this.$emit("update:modelValue", this.selectedRows);
      this.$emit("selection-change", this.selectedRows);
    },

    onCellContextMenu(row, column, event) {
      this.$tdContextMenu.open(event, [
        {
          key: "copyCell",
          label: this.$t("i18nCommon.copy"),
          action: () => this.handleDataSelected(row, column),
        },
        {
          key: "viewFullData",
          label: this.$t("i18nCommon.viewFullData"),
          action: () => this.onCellPreview(row, column),
        },
        {
          key: "viewRecord",
          label: this.$t("i18nCommon.viewRecord"),
          action: () => this.onRecordView(row),
        },
      ]);
    },

    onIndexContextMenu(row, event) {
      this.$tdContextMenu.open(event, [
        {
          key: "copyRow",
          label: this.$t("i18nCommon.copy"),
          action: () => this.copyRow(row),
        },
        {
          key: "viewFullRow",
          label: this.$t("i18nCommon.viewFullData"),
          action: () => this.onRowPreview(row),
        },
        {
          key: "viewRecord",
          label: this.$t("i18nCommon.viewRecord"),
          action: () => this.onRecordView(row),
        },
      ]);
    },

    handleDataSelected(row, column) {
      let data = this.formatCellValue(row, column);
      if (data !== null && typeof data === "object") {
        data = JSON.stringify(data);
      }
      this.$tdUtility.copyToClipboard(data, true, this.enableLogCopyData);
    },

    copyRow(row) {
      this.$tdUtility.copyToClipboard(
        JSON.stringify(row),
        true,
        this.enableLogCopyData,
      );
    },

    onRowPreview(row) {
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDQuickPreview,
        ownerForm: this,
        props: {},
        param: { value: row, label: this.$t("i18nCommon.rowData") },
      });
    },

    onCellPreview(row, column) {
      const value = this.getCellValue(row, column.key);
      const label = column.label || column.key;
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDQuickPreview,
        ownerForm: this,
        props: {},
        param: { value, label },
      });
    },

    onRecordView(row) {
      this.currentRecord = row;
      this.viewMode = "record";
    },

    switchToTableView() {
      this.viewMode = "table";
      this.currentRecord = null;
      this.scrollTop = 0;
      if (this.virtualScroll) {
        this.$nextTick(() => {
          this.updateContainerSize();
          if (this.resizeObserver) {
            this.resizeObserver.disconnect();
          }
          this.resizeObserver = new ResizeObserver(() => {
            this.updateContainerSize();
          });
          if (this.$refs.tableContainer) {
            this.resizeObserver.observe(this.$refs.tableContainer);
          }
        });
      }
    },

    onDragStart(e) {
      const el = this.$refs.tableContainer;
      if (
        !el ||
        (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)
      )
        return;
      if (e.shiftKey || e.ctrlKey || e.metaKey || e.button !== 0) return;

      // Không kéo từ sticky cells (index, checkbox)
      const target =
        e.target.closest?.(".td-table-cell-sticky") ||
        e.target.closest?.(".td-table-cell-checkbox");
      if (target) return;

      this._isDragging = true;
      this._dragStartX = e.clientX;
      this._dragStartY = e.clientY;
      this._scrollStartLeft = el.scrollLeft;
      this._scrollStartTop = el.scrollTop;

      document.addEventListener("mousemove", this.onDragMove);
      document.addEventListener("mouseup", this.onDragEnd);
    },

    onDragMove(e) {
      if (!this._isDragging) return;
      const el = this.$refs.tableContainer;
      if (!el) return;

      const dx = e.clientX - this._dragStartX;
      const dy = e.clientY - this._dragStartY;
      el.scrollLeft = this._scrollStartLeft - dx;
      el.scrollTop = this._scrollStartTop - dy;
    },

    onDragEnd() {
      if (!this._isDragging) return;
      this._isDragging = false;
      document.removeEventListener("mousemove", this.onDragMove);
      document.removeEventListener("mouseup", this.onDragEnd);
    },
  },
};
</script>

<style lang="scss" scoped>
.td-table-viewer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
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
    border-radius: var(--border-radius-component);
    background-color: var(--bg-main-color);

    &.td-table-grabbing {
      cursor: grabbing;
      user-select: none;
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

      &.td-table-header-sticky th {
        position: sticky;
        top: 0;
        z-index: 1;
        background-color: var(--bg-layer-color);
      }

      tr {
        border-bottom: 1px solid var(--border-color);
      }
    }

    .td-table-cell {
      padding: var(--padding) calc(var(--padding) * 1.5);
      text-align: left;
      color: var(--text-primary-color);
      vertical-align: top;

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

      &-content {
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
        line-height: 1.5;

        &.td-table-cell-content-clamped {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      &-truncated {
        .td-table-cell-content {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 1;
          line-clamp: 1;
        }
      }

      &-checkbox {
        width: 48px;
        min-width: 48px;
        max-width: 48px;
        box-sizing: border-box;
        text-align: center;
        padding: 0 var(--padding);
      }

      &-index {
        width: 40px;
        min-width: 40px;
        max-width: 40px;
        box-sizing: border-box;
        text-align: center;
        padding: 0 var(--padding);
        color: var(--text-secondary-color);
        font-weight: 500;
        display: table-cell;
        text-align: center;
        vertical-align: middle;
      }

      &-sticky {
        background-color: var(--bg-main-color);
        box-shadow: 1px 0 0 0 var(--border-color);
        z-index: 1;
      }

      tr:hover > &-sticky {
        background-color: var(--bg-layer-color);
      }

      &-sticky-header {
        background-color: var(--bg-layer-color);
        box-shadow: 1px 0 0 0 var(--border-color);
        z-index: 3 !important;
        top: 0;
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

    .td-table-cell:hover {
      background-color: var(--bg-layer-color);
      cursor: pointer;
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
      border-radius: var(--border-radius-component);
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
    margin-top: var(--padding);
    background-color: var(--bg-layer-color);
    border-radius: var(--border-radius-component);

    .td-table-info {
      font-size: var(--font-size-small);
      color: var(--text-secondary-color);
      justify-content: space-between;
      width: 100%;
    }
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

// Record View
.td-record-container {
  position: relative;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  background-color: var(--bg-main-color);

  .td-record-header {
    display: flex;
    align-items: center;
    gap: var(--padding);
    padding: var(--padding) calc(var(--padding) * 1.5);
    text-align: left;
    color: var(--text-primary-color);
    vertical-align: top;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-layer-color);
    position: sticky;
    top: 0;
    z-index: 1;

    .td-record-back-btn {
      cursor: pointer;
      white-space: nowrap;
    }

    .td-record-title {
      font-size: var(--font-size-medium-rare);
      font-weight: 600;
      color: var(--text-primary-color);
    }
  }

  .td-record-table {
    width: 100%;
    border-collapse: collapse;

    .td-record-row {
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }
    }

    .td-record-cell {
      padding: var(--padding-medium) var(--padding-x-medium);
      vertical-align: top;
      line-height: 1.5;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;

      &-label {
        width: 30%;
        min-width: 150px;
        font-weight: 500;
        font-size: var(--font-size-medium-rare);
        color: var(--text-secondary-color);
        background-color: var(--bg-layer-color);
        border-right: 1px solid var(--border-color);
      }

      &-value {
        font-size: var(--font-size-medium);
        color: var(--text-primary-color);
        font-family: var(--main-font);
      }
    }
  }
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

.td-table-cell:not(:last-child) {
  border-right: 1px solid var(--border-color);
}
</style>
