<template>
  <div class="flex flex-col td-collection">
    <!-- header: các nút icon + ô lọc item, nằm chung 1 hàng -->
    <div class="flex td-header-collection">
      <TDButton
        :noMargin="true"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.collection.addGroup')"
        iconClass="td-plus-icon"
        v-tooltip="$t('i18nCommon.collection.addGroup')"
        @click="emitAddGroup"
      />
      <TDButton
        :noMargin="true"
        :type="$tdEnum.buttonType.secondary"
        iconClass="td-reload-icon"
        v-tooltip="$t('i18nCommon.collection.refresh')"
        @click="$emit('refresh')"
      />
      <TDButton
        v-if="showToggleAll"
        :noMargin="true"
        :type="$tdEnum.buttonType.secondary"
        :readOnly="visibleGroups.length === 0"
        :iconClass="
          allGroupsOpen ? 'td-node-collapse-icon' : 'td-node-expand-icon'
        "
        v-tooltip="toggleAllLabel"
        @click="toggleAllGroups"
      />
      <!-- ô lọc item, gõ xong debounce mới lọc để không render lại liên tục -->
      <div class="flex td-collection-filter" v-if="showFilter">
        <div class="flex-one">
          <TDInput
            v-model="searchInput"
            :noMargin="true"
            :placeHolder="filterLabel"
            @keyup.esc="clearFilter"
          />
        </div>
        <div
          class="td-icon td-close-icon td-collection-filter-clear"
          v-if="searchInput"
          v-tooltip="clearFilterLabel"
          @click="clearFilter"
        ></div>
      </div>
    </div>

    <!-- loading -->
    <div class="flex flex-col td-collection-loading" v-if="isLoading">
      <TDLoading />
    </div>

    <!-- danh sách group + item -->
    <div class="td-collection-body" v-else>
      <!-- chưa có group nào -->
      <div class="td-collection-empty" v-if="groups.length === 0">
        {{ $t("i18nCommon.collection.empty") }}
      </div>
      <!-- có group nhưng không group nào còn item khớp từ khoá lọc -->
      <div class="td-collection-empty" v-else-if="visibleGroups.length === 0">
        {{ $t("i18nCommon.collection.filterEmptyResult") }}
      </div>

      <div
        v-for="group in visibleGroups"
        :key="group.id"
        class="flex flex-col no-select td-collection-item"
      >
        <!-- chế độ đổi tên group -->
        <div v-if="isRenaming(group)" class="td-collection-rename">
          <TDInput
            v-model="renamingName"
            :noMargin="true"
            :placeHolder="$t('i18nCommon.collection.renameGroup')"
            @keyup.enter="commitRename(group)"
            @clickOutSide="commitRename(group)"
          />
        </div>

        <!-- header group, click để mở/đóng -->
        <div
          v-else
          class="flex td-collection-header"
          @click="toggleGroup(group)"
        >
          <div class="flex text-nowrap td-collection-header-left">
            <TDArrow
              :openProp="isGroupOpen(group)"
              :arrowOpenDirection="$tdEnum.Direction.bottom"
              :arrowDirection="$tdEnum.Direction.right"
            />
            <div v-tooltip="group.name" class="td-collection-header-name">
              {{ group.name }}
            </div>
            <div class="td-collection-count" v-if="showItemCount">
              {{ group.items.length }}
            </div>
          </div>
          <!-- nhóm ảo "Ungrouped" không được sửa/xoá, menu của nó chỉ có Thêm item -->
          <div class="flex td-collection-edit-btn">
            <div
              class="td-icon td-menu-icon"
              v-tooltip="actionsLabel"
              @click.stop="openGroupMenu($event, group)"
            ></div>
          </div>
        </div>

        <!-- danh sách item trong group -->
        <div
          v-if="isGroupOpen(group) && group.items.length > 0"
          class="flex flex-col td-collection-content"
        >
          <div
            v-for="item in group.items"
            :key="item.id"
            class="flex td-collection-request-item"
            :class="{ 'td-collection-request-item-selected': isSelected(item) }"
            @click="$emit('select-item', item)"
          >
            <span class="text-nowrap td-collection-item-name">
              <div v-tooltip="getItemName(item)">{{ getItemName(item) }}</div>
            </span>
            <span class="td-collection-item-edit-btn">
              <div
                class="td-icon td-menu-icon"
                v-tooltip="actionsLabel"
                @click.stop="openItemMenu($event, item)"
              ></div>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TDArrow from "@/components/TDArrow.vue";
import TDLoading from "@/components/TDLoading.vue";
import _ from "@/common/TDCommonFunction.js";

/**
 * TDCollectionList - component dùng chung cho toàn bộ sidebar kiểu master-detail
 * (1 danh sách nhóm, mỗi nhóm chứa nhiều item).
 *
 * Component này chỉ lo render, không gọi API. Mọi thao tác đều emit lên cho tool,
 * nhờ vậy 1 component phục vụ được cho:
 *   - api testing     (group = collection, item = request)
 *   - api mocking     (group = group,        item = mock api)
 *   - automation      (group = collection, item = script)
 *   - postgresql     (group = group,        item = connection)
 *   - rdp             (group = group,        item = connection)
 */
export default {
  name: "TDCollectionList",
  components: {
    TDArrow,
    TDLoading,
  },

  props: {
    // Cây group đã được mixin gom sẵn: [{ id, groupId, name, items, isUngrouped }]
    groups: {
      type: Array,
      default: () => [],
    },
    // Id của item đang được chọn
    selectedItemId: {
      type: [String, Number],
      default: null,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    // Tên field hiển thị của item, mỗi tool lưu tên khác nhau
    // (request_name, connection_name, ...)
    itemNameKey: {
      type: String,
      default: "name",
    },
    // Cho phép mở popup sửa item, tool không có popup sửa thì tắt
    allowEditItem: {
      type: Boolean,
      default: true,
    },
    // Hiện số lượng item bên cạnh tên group
    showItemCount: {
      type: Boolean,
      default: true,
    },
    // Group mới load về mặc định mở hay đóng
    defaultOpen: {
      type: Boolean,
      default: true,
    },
    // Hiện ô nhập lọc item không (tool không có nhiều item thì tắt cho gọn)
    showFilter: {
      type: Boolean,
      default: true,
    },
    // Hiện nút mở/thu tất cả group không
    showToggleAll: {
      type: Boolean,
      default: true,
    },
  },

  // Đa số event emit thẳng trong template bằng $emit.
  emits: [
    "refresh",
    "add-group",
    "delete-group",
    "add-item",
    "select-item",
    "edit-item",
    "delete-item",
    "rename-group",
  ],

  data() {
    return {
      // Id của group đang đổi tên, null nghĩa là không group nào đang đổi tên
      renamingGroupId: null,
      renamingName: "",
      /**
       * Trạng thái mở/đóng của group, key là group.id.
       *
       * Component tự giữ state này thay vì nhận từ tool, để không bị lệch với dữ liệu
       * cây vừa tải về (mỗi lần tải lại cây là 1 object group mới).
       * Group chưa có trong map thì dùng giá trị mặc định defaultOpen.
       */
      openGroupIds: {},
      // Text đang gõ trong ô lọc, gán thẳng cho TDInput để không bị giật khi debounce
      searchInput: "",
      // Từ khoá đã qua debounce, mới là giá trị thật sự dùng để lọc danh sách
      filterKeyword: "",
    };
  },

  created() {
    // Tạo debounce ở created() để mỗi instance có timer riêng,
    // tránh mọi instance của component này dùng chung 1 timer như khai báo trong methods.
    this.debouncedApplyFilter = _.debounce(this.applyFilter, 300);
  },

  beforeUnmount() {
    if (this.debouncedApplyFilter?.cancel) {
      this.debouncedApplyFilter.cancel();
    }
  },

  watch: {
    // Gõ mỗi ký tự chỉ set searchInput, việc lọc chạy sau 300ms im lặng
    searchInput() {
      this.debouncedApplyFilter();
    },
  },

  computed: {
    addItemLabel() {
      return this.$t("i18nCommon.collection.addItem");
    },
    // tooltip của icon duy nhất mở context menu
    actionsLabel() {
      return this.$t("i18nCommon.collection.actions");
    },
    filterLabel() {
      return this.$t("i18nCommon.collection.filterPlaceholder");
    },
    clearFilterLabel() {
      return this.$t("i18nCommon.collection.clearFilter");
    },
    // Tooltip của nút toggle all, đổi theo trạng thái hiện tại của các group
    toggleAllLabel() {
      return this.allGroupsOpen
        ? this.$t("i18nCommon.collection.collapseAll")
        : this.$t("i18nCommon.collection.expandAll");
    },

    /**
     * Cây group đã lọc theo filterKeyword.
     *
     * - Group khớp từ khoá thì giữ nguyên toàn bộ item bên trong.
     * - Group không khớp thì chỉ giữ lại item khớp, hết item thì ẩn group.
     * - Không có từ khoá thì trả về đúng cây gốc (không copy, không tạo object mới).
     */
    visibleGroups() {
      let keyword = this.filterKeyword;
      if (!keyword) return this.groups;

      let needle = keyword.toLowerCase();
      return this.groups
        .map((group) => {
          if ((group.name ?? "").toLowerCase().includes(needle)) return group;
          let items = (group.items ?? []).filter((item) =>
            this.isItemMatchKeyword(item, needle),
          );
          return items.length > 0 ? { ...group, items } : null;
        })
        .filter((group) => group != null);
    },

    /**
     * Tất cả group đang hiện (nhóm đang lọc) đều mở hay không.
     * Không còn group nào thì coi như đang đóng để nút toggle all báo đúng trạng thái.
     */
    allGroupsOpen() {
      if (this.visibleGroups.length === 0) return false;
      return this.visibleGroups.every((group) => this.isGroupOpen(group));
    },
  },

  methods: {
    getItemName(item) {
      return item?.[this.itemNameKey] ?? "";
    },

    isSelected(item) {
      return (
        item?.id != null && String(item.id) === String(this.selectedItemId)
      );
    },

    isRenaming(group) {
      return this.renamingGroupId === group.id;
    },

    emitAddGroup() {
      this.$emit("add-group");
    },

    /**
     * Mở context menu chức năng của group.
     * Mỗi dòng chỉ hiện 1 icon cho đỡ chiếm chỗ, các chức năng gom vào menu.
     * Nhóm ảo "Ungrouped" không được sửa/xoá nên menu chỉ có Thêm item.
     */
    openGroupMenu(event, group) {
      let items = [];

      if (!group.isUngrouped) {
        items.push({
          key: "rename",
          label: this.$t("i18nCommon.collection.renameGroup"),
          action: () => this.startRename(group),
        });
      }

      items.push({
        key: "add-item",
        label: this.addItemLabel,
        action: () => this.$emit("add-item", group),
      });

      if (!group.isUngrouped) {
        items.push({
          key: "delete",
          label: this.$t("i18nCommon.collection.deleteGroup"),
          action: () => this.$emit("delete-group", group),
        });
      }

      this.$tdContextMenu.open(event, items);
    },

    /**
     * Mở context menu chức năng của item. Tool không có popup sửa thì menu chỉ còn Xoá.
     */
    openItemMenu(event, item) {
      let items = [];

      if (this.allowEditItem) {
        items.push({
          key: "edit",
          label: this.$t("i18nCommon.edit"),
          action: () => this.$emit("edit-item", item),
        });
      }

      items.push({
        key: "delete",
        label: this.$t("i18nCommon.collection.deleteItem"),
        action: () => this.$emit("delete-item", item),
      });

      this.$tdContextMenu.open(event, items);
    },

    /**
     * Item có khớp từ khoá lọc không (đã lowercase sẵn ở caller).
     * Chỉ so tên hiển thị, tool khác muốn so thêm field thì override method này.
     */
    isItemMatchKeyword(item, needle) {
      return (this.getItemName(item) ?? "").toLowerCase().includes(needle);
    },

    /**
     * Áp dụng từ khoá lọc sau khi đã debounce.
     *
     * Có từ khoá thì mở hết group còn kết quả, nếu không thì kết quả nằm trong
     * group đang đóng thì user không nhìn thấy. Xoá hết từ khoá thì giữ nguyên
     * trạng thái mở/đóng hiện tại, không đụng lại group nào.
     */
    applyFilter() {
      let keyword = (this.searchInput ?? "").trim();
      this.filterKeyword = keyword;

      if (!keyword) return;

      let nextIds = { ...this.openGroupIds };
      for (let group of this.visibleGroups) {
        nextIds[group.id] = true;
      }
      this.openGroupIds = nextIds;
    },

    /**
     * Bỏ lọc. Huỷ timer đang chờ để xoá là có hiệu lực ngay, không phải đợi debounce.
     */
    clearFilter() {
      if (this.debouncedApplyFilter?.cancel) {
        this.debouncedApplyFilter.cancel();
      }
      this.searchInput = "";
      this.filterKeyword = "";
    },

    /**
     * Mở tất cả / thu tất cả group đang hiện.
     * Chỉ đụng group trong visibleGroups, group đang bị lọc ra không bị ảnh hưởng.
     */
    toggleAllGroups() {
      let openState = !this.allGroupsOpen;
      let nextIds = { ...this.openGroupIds };
      for (let group of this.visibleGroups) {
        nextIds[group.id] = openState;
      }
      this.openGroupIds = nextIds;
    },

    /**
     * Group có đang mở không. Group chưa từng bấm thì theo giá trị mặc định.
     */
    isGroupOpen(group) {
      return this.openGroupIds[group.id] ?? this.defaultOpen;
    },

    /**
     * Mở/đóng group. State nằm ở component nên không cần báo lên tool.
     */
    toggleGroup(group) {
      this.openGroupIds = {
        ...this.openGroupIds,
        [group.id]: !this.isGroupOpen(group),
      };
    },

    /**
     * Chuyển group sang chế độ đổi tên, focus luôn vào ô input
     */
    startRename(group) {
      this.renamingGroupId = group.id;
      this.renamingName = group.name;
    },

    /**
     * Xác nhận đổi tên. Nếu tên không đổi thì huỷ luôn, không gọi API.
     */
    commitRename(group) {
      if (!this.isRenaming(group)) return;

      const newName = (this.renamingName ?? "").trim();
      const oldName = group.name;
      this.renamingGroupId = null;

      if (!newName) {
        this.$tdToast.warning(this.$t("i18nCommon.collection.nameRequired"));
        return;
      }
      if (newName === oldName) return;

      this.$emit("rename-group", group, newName);
    },
  },
};
</script>

<style lang="scss">
.td-collection {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;

  // Class .text-nowrap đã có sẵn trong main.scss. Ở đây chỉ bổ sung phần còn
  // thiếu cho việc cắt "..." (tên group / tên item), và CHỈ áp trong .td-collection.
  // Không định nghĩa lại ở cấp global để không đè lên các component khác
  // đang dùng .text-nowrap (tab, history, footer, danh sách database...).
  .text-nowrap {
    display: inline-block;
    max-width: 100%;
    vertical-align: middle;

    & > div {
      display: inline;
      white-space: nowrap;
    }
  }

  .td-collection-body {
    width: 100%;
    margin-top: var(--padding);
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    .td-collection-item {
      cursor: pointer;
      justify-content: flex-start;
      gap: var(--padding);
      width: 100%;
      min-height: var(--base-component-height);
      margin-bottom: var(--padding);

      .td-collection-header {
        position: relative;
        gap: var(--padding);
        padding: var(--padding);
        height: var(--base-component-height);
        justify-content: space-between;
        width: 100%;
        background-color: var(--bg-thirt-color);
        border-radius: var(--border-radius-component);
        .td-collection-header-left {
          gap: var(--padding);
          display: flex;
          // phần chừa chỗ cho tên + badge số lượng, co lại được
          // (min-width: 0 là bắt buộc, nếu không flex sẽ giữ min-content
          // và tên tràn ra ngoài, đè lên các nút icon)
          flex: 1;
          min-width: 0;

          // các phần tử con cũng phải cho phép co lại mới cắt "..." được
          > * {
            min-width: 0;
          }
        }

        // tên group: hết chỗ thì cắt bằng "..." thay vì tràn sang nút icon
        .td-collection-header-name {
          display: block;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      .td-collection-header:hover {
        background-color: var(--bg-hover-color);
      }
      .td-collection-content {
        justify-content: flex-start;
        gap: var(--padding);
        width: 100%;
      }
    }
  }
}

.td-collection-request-item {
  cursor: pointer;
  position: relative;
  height: 30px;
  justify-content: space-between;
  width: 100%;
  padding: var(--padding);
  border-radius: var(--border-radius-component);

  // tên item chiếm hết phần trống còn lại sau các nút icon,
  // hết chỗ thì cắt "..." (min-width: 0 là bắt buộc để co lại được)
  .td-collection-item-name {
    flex: 1;
    min-width: 0;
  }
}
.td-collection-request-item:hover {
  background-color: var(--bg-hover-color);
  color: var(--btn-color);
}
.td-collection-request-item-selected {
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
  font-weight: 600;
}

// Nút icon menu của group header và của item.
// - Luôn hiển thị, không ẩn khi hover. Mờ đi một chút cho nhẹ mắt, hover dòng thì
//   hiện rõ.
// - Để trong flow (không absolute) + margin-left:auto để dồn sát mép phải. Nhờ vậy
//   dòng luôn chừa sẵn chỗ cho nút, tên dài chỉ bị cắt bằng "..." chứ không tràn
//   đè lên icon.
// - Border luôn tồn tại ở dạng transparent, chỉ đổi màu khi hover, để không làm
//   layout nhảy khi hover.
// - Cố tình KHÔNG tự set background để nền của dòng (mặc định / hover / đang chọn)
//   hiện xuyên qua; nếu tự phủ màu riêng thì nền nút lệch nền dòng, nhìn lỗi.
.td-collection-edit-btn,
.td-collection-item-edit-btn {
  display: flex;
  gap: var(--padding);
  margin-left: auto;
  flex-shrink: 0;
  padding: calc(var(--padding) / 4);
  border: 1px solid transparent;
  border-radius: var(--border-radius-component);
  opacity: 0.6;
  transition:
    opacity 0.2s,
    border-color 0.15s ease;

  // hover: viền focus + icon sáng màu (icon vẽ bằng currentColor nên chỉ cần đổi color)
  &:hover {
    border-color: var(--focus-color);
  }

  .td-icon {
    flex-shrink: 0;
    transition:
      color 0.15s ease,
      transform 0.15s ease;
  }

  .td-icon:hover {
    color: var(--btn-color);
  }

  // active: nhấn xuống một chút
  .td-icon:active {
    color: var(--btn-color);
    transform: scale(0.88);
  }
}

.td-collection-header:hover .td-collection-edit-btn,
.td-collection-request-item:hover .td-collection-item-edit-btn {
  opacity: 1;
}

// Component dùng chung cho nhiều tool nên style không scoped,
// để class bên trong component con (TDInput, TDButton...) cũng được áp dụng.
.td-collection {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;

  .td-header-collection {
    gap: var(--padding);
    width: 100%;
    margin-top: var(--padding);
    align-items: center;
  }

  // ô lọc item, nằm chung hàng với các nút icon ở header
  .td-collection-filter {
    gap: var(--padding);
    flex: 1;
    min-width: 0;
    align-items: center;
  }
  .td-collection-filter-clear {
    flex-shrink: 0;
    opacity: 0.6;
  }
  .td-collection-filter-clear:hover {
    opacity: 1;
    color: var(--btn-color);
  }

  .td-collection-loading {
    width: 100%;
    height: 100%;
    background-color: var(--bg-layer-color);
    border: 1px solid transparent;
    border-radius: var(--border-radius);
  }

  .td-collection-empty {
    margin-top: var(--padding);
    padding: var(--padding) calc(var(--padding) * 2);
    font-size: var(--font-size-medium);
    opacity: 0.6;
    text-align: center;
  }

  .td-collection-rename {
    width: 100%;
  }

  // số lượng item hiển thị bên cạnh tên group
  .td-collection-count {
    font-size: var(--font-size-small);
    line-height: 1;
    padding: calc(var(--padding) / 4) var(--padding-medium);
    border-radius: var(--border-radius);
    background-color: var(--bg-layer-color);
    border: 1px solid var(--focus-color);
    opacity: 0.7;
    // badge không bị bóp méo khi tên group dài
    flex-shrink: 0;
  }
}
</style>
