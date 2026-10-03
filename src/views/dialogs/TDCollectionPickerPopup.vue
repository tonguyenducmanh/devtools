<template>
  <TDPopup :visible="true" :showHeader="false" @close="handleClose(false)">
    <div class="flex flex-col td-collection-picker">
      <!-- ô tìm nhóm: dùng TDInput cho đồng nhất với các ô nhập khác trong app -->
      <div class="td-collection-picker-search">
        <div class="flex-one">
          <TDInput
            ref="searchInput"
            v-model="searchQuery"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.collection.findGroup')"
            @keyup.enter="handleSelectFirst"
          />
        </div>
        <div
          class="td-icon td-close-icon td-collection-picker-clear"
          v-if="searchQuery"
          v-tooltip="clearFilterLabel"
          @click="clearSearch"
        ></div>
      </div>

      <!-- chưa có group nào khớp tìm kiếm -->
      <div
        v-if="filteredGroups.length === 0"
        class="flex flex-col td-picker-empty"
      >
        <div class="td-picker-empty-text">
          {{ $t("i18nCommon.search.noResults") }}
        </div>
        <TDButton
          :label="createButtonLabel"
          :type="$tdEnum.buttonType.secondary"
          :readOnly="!searchQuery"
          @click="handleCreateNew"
        />
      </div>

      <!-- danh sách group -->
      <div v-else class="flex-one td-collection-picker-results">
        <div class="td-picker-section">
          <div
            v-for="group in filteredGroups"
            :key="group.id"
            class="td-picker-item"
            @click="handleSelect(group)"
          >
            <div class="td-picker-item-title">{{ group.name }}</div>
            <div class="td-picker-item-count" v-if="showItemCount">
              {{ group.items.length }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDPopup from "@/components/TDPopup.vue";
import TDInput from "@/components/TDInput.vue";
import TDButton from "@/components/TDButton.vue";

/**
 * TDCollectionPickerPopup - popup chọn 1 nhóm trong cây collection.
 *
 * Dùng chung cho mọi tool: lưu request vào collection (api testing), lưu script
 * vào collection (automation), lưu connection vào nhóm (postgresql, rdp)...
 *
 * Trả về qua callback của TDDialogUtil:
 *   { groupId }        - user chọn 1 nhóm có sẵn
 *   { newGroupName }   - user muốn tạo nhóm mới, tool tự tạo rồi lưu
 */
export default {
  name: "TDCollectionPickerPopup",
  components: {
    TDPopup,
    TDInput,
    TDButton,
  },

  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
    // Cây group lấy từ collectionGroups của TDCollectionMixin
    groups: {
      type: Array,
      default: () => [],
    },
    showItemCount: {
      type: Boolean,
      default: true,
    },
  },

  emits: ["close"],

  data() {
    return {
      searchQuery: "",
      createLabelTemplate: "",
    };
  },

  computed: {
    /**
     * Group hợp lệ để chọn.
     * Nhóm ảo "Ungrouped" không phải group thật (id rỗng) nên không cho chọn.
     */
    selectableGroups() {
      return this.groups.filter((group) => !group.isUngrouped);
    },

    filteredGroups() {
      if (!this.searchQuery) return this.selectableGroups;

      const query = this.searchQuery.normalizeText();
      return this.selectableGroups
        .filter((group) => group.name.normalizeText().includes(query))
        .slice(0, 8);
    },

    createButtonLabel() {
      const template =
        this.createLabelTemplate ||
        this.$t("i18nCommon.collection.createGroupNamed");
      return template.format(this.searchQuery);
    },

    clearFilterLabel() {
      return this.$t("i18nCommon.collection.clearFilter");
    },
  },

  mounted() {
    this.focusSearchInput();
  },

  methods: {
    focusSearchInput() {
      this.$refs.searchInput?.focus?.();
    },

    /**
     * Được gọi từ TDDialogUtil ngay sau khi mount
     * @param {Object} param createLabelTemplate: dùng tên nhóm trong nhãn nút tạo mới
     */
    show(param = {}) {
      this.createLabelTemplate = param.createLabelTemplate ?? "";
      this.searchQuery = "";
      this.$nextTick(() => {
        this.focusSearchInput();
      });
    },

    /**
     * Xoá từ khoá đang tìm, quay lại hiển thị đủ danh sách group
     */
    clearSearch() {
      this.searchQuery = "";
      this.focusSearchInput();
    },

    /**
     * Enter trong ô tìm: chọn luôn group đầu tiên nếu có, không có thì tạo mới.
     */
    handleSelectFirst() {
      const first = this.filteredGroups[0];
      if (first) {
        this.handleSelect(first);
      } else {
        this.handleCreateNew();
      }
    },

    handleSelect(group) {
      this.$emit("close", { groupId: group.groupId ?? group.id });
    },

    handleCreateNew() {
      this.$emit("close", { newGroupName: this.searchQuery });
    },

    handleClose(result) {
      this.$emit("close", result);
    },
  },
};
</script>

<style scoped lang="scss">
// Nền + bo góc của popup do chính TDPopup lo (.td-popup-container),
// ở đây chỉ lo phần nội dung: ô tìm + danh sách group.
.td-collection-picker {
  width: 100%;
  height: 100%;
  overflow: hidden;

  justify-content: flex-start;
  .td-collection-picker-search {
    display: flex;
    align-items: center;
    gap: var(--padding);
    padding: var(--padding);
    width: 100%;
    border-bottom: 1px solid var(--border-color);

    .td-icon {
      flex-shrink: 0;
    }
  }

  // icon xoá từ khoá: mờ đi cho nhẹ mắt, hover dòng thì hiện rõ
  .td-collection-picker-clear {
    flex-shrink: 0;
    opacity: 0.6;

    &:hover {
      opacity: 1;
      color: var(--btn-color);
    }
  }

  .td-collection-picker-results {
    width: 100%;
    overflow-y: auto;
  }

  .td-picker-section {
    padding: var(--padding) 0;
  }

  .td-picker-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--padding);
    padding: var(--padding) calc(var(--padding) * 2);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--bg-hover-color);
    }

    .td-picker-item-title {
      font-weight: 600;
      color: var(--text-primary-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .td-picker-item-count {
      flex-shrink: 0;
      font-size: var(--font-size-small);
      color: var(--text-secondary-color);
    }
  }

  .td-picker-empty {
    padding: calc(var(--padding) * 5) calc(var(--padding) * 2);
    align-items: center;
    gap: var(--padding);
    text-align: center;

    .td-picker-empty-text {
      color: var(--text-secondary-color);
      font-size: var(--font-size-medium-rare);
    }
  }
}
</style>
