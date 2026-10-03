<template>
  <TDPopup :visible="true" :showHeader="false" @close="handleClose(false)">
    <div class="flex flex-col td-collection-picker">
      <div class="td-collection-picker-search">
        <div class="td-icon td-search-icon"></div>
        <input
          ref="searchInput"
          v-model="searchQuery"
          class="td-collection-picker-input"
          :placeholder="$t('i18nCommon.collection.findGroup')"
        />
      </div>

      <!-- chưa có group nào khớp tìm kiếm -->
      <div v-if="filteredGroups.length === 0" class="flex flex-col td-picker-empty">
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
  },

  mounted() {
    this.$refs.searchInput?.focus?.();
  },

  methods: {
    /**
     * Được gọi từ TDDialogUtil ngay sau khi mount
     * @param {Object} param createLabelTemplate: dùng tên nhóm trong nhãn nút tạo mới
     */
    show(param = {}) {
      this.createLabelTemplate = param.createLabelTemplate ?? "";
      this.searchQuery = "";
      this.$nextTick(() => {
        this.$refs.searchInput?.focus?.();
      });
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
.td-collection-picker {
  width: 100%;
  height: 100%;
  background-color: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: calc(var(--border-radius) * 1.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .td-collection-picker-search {
    display: flex;
    align-items: center;
    padding: 16px;
    width: 100%;
    border-bottom: 1px solid var(--border-color);

    .td-icon {
      margin-right: var(--padding);
    }

    .td-collection-picker-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-color);

      &::placeholder {
        color: var(--text-color-secondary);
        opacity: var(--placeholder-opacity);
      }
    }
  }

  .td-collection-picker-results {
    width: 100%;
    overflow: auto;
  }

  .td-picker-section {
    padding: 8px 0;
  }

  .td-picker-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--padding);
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--bg-layer-color);
    }

    .td-picker-item-title {
      font-weight: 500;
      color: var(--text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .td-picker-item-count {
      flex-shrink: 0;
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }

  .td-picker-empty {
    padding: 40px 16px;
    align-items: center;
    gap: var(--padding);
    text-align: center;

    .td-picker-empty-text {
      color: var(--text-color-secondary);
      font-size: 14px;
    }
  }
}
</style>