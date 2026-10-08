import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";

/**
 * UNGROUPED_KEY là key ảo dùng cho nhóm chứa các item chưa được gán nhóm.
 * Backend tự gom các item này vào node có is_ungrouped = true,
 * không phải do frontend tự tạo.
 */
export const TM_COLLECTION_UNGROUPED_KEY = "__ungrouped__";

/**
 * TMCollectionMixin - toàn bộ state + logic của 1 danh sách kiểu master-detail
 * (nhóm + item), dùng chung cho mọi tool.
 *
 * Trước khi có mixin này, mỗi tool tự có:
 *   - 1 computed groupedXxx để gom cây từ 2 list
 *   - 1 hàm loadAllXxx gọi song song 2 API rồi tự ghép cây
 *   - các hàm addNewGroup / toggleGroup / deleteGroup / enableRenameCollection / saveNewCollectionName
 *   - các biến allGroups / allItems / openGroups / newGroupName / isLoading
 *
 * Nay gộp hết vào đây. Tool chỉ còn viết phần riêng (load item vào form, save...).
 *
 * Cách dùng trong tool:
 *   mixins: [TMCollectionMixin],
 *   async mounted() {
 *     this.agentAPI = new TMServerTestingAPI();
 *     // trỏ collectionItemAPI / collectionGroupAPI vào API tương ứng
 *     this.collectionItemAPI = this.agentAPI.testingItem;
 *     this.collectionGroupAPI = this.agentAPI.testingGroup;
 *     await this.loadCollection();
 *   }
 *
 * Hook tool có thể override:
 *   getCollectionItemName(item)      - tên hiển thị dùng cho toast xác nhận xoá
 *   onCollectionItemDeleted(item)    - dọn state sau khi xoá item
 *   onCollectionGroupDeleted(group)  - dọn state sau khi xoá nhóm
 */
export default {
  data() {
    return {
      // Cây group + item đã gom sẵn từ backend
      collectionGroups: [],
      // Đang tải danh sách
      isLoadingCollection: false,
      // API của item, tool gán sau khi khởi tạo agentAPI
      collectionItemAPI: null,
      // API của group, tool gán sau khi khởi tạo agentAPI
      collectionGroupAPI: null,
    };
  },

  computed: {
    /**
     * Danh sách phẳng của mọi item trong cây, không phân biệt thuộc group nào.
     * Tiện cho các chỗ cần tìm item theo id (vd: lấy connection đang chọn).
     */
    allCollectionItems() {
      return this.collectionGroups.flatMap((group) => group.items);
    },

    /**
     * Option group cho combo box chọn nhóm (vd: combo box trên header của tool)
     */
    collectionGroupOptions() {
      return this.collectionGroups
        .filter((group) => !group.isUngrouped)
        .map((group) => ({
          value: group.id,
          label: group.name,
        }));
    },
  },

  methods: {
    /**
     * Tải cây group + item từ backend.
     * Backend đã gom sẵn nên chỉ cần 1 request, không phải gọi 2 API rồi ghép.
     */
    async loadCollection() {
      let me = this;
      if (!me.collectionItemAPI) return;

      me.isLoadingCollection = true;
      try {
        let response = await me.collectionItemAPI.getTree();
        let tree = response?.data?.data ?? [];
        me.applyCollectionTree(Array.isArray(tree) ? tree : []);
      } catch (error) {
        console.error("Lỗi tải collection:", error);
        me.$tmUtility.showErrorNotFoundAgentServer();
      } finally {
        me.isLoadingCollection = false;
      }
    },

    /**
     * Chuyển cây từ backend thành state cho component TMCollectionList.
     *
     * Không lưu trạng thái mở/đóng vào đây: component tự giữ, vì mỗi lần tải lại
     * cây đều tạo object group mới nên trạng thái copy vào sẽ bị stale.
     */
    applyCollectionTree(tree) {
      let me = this;

      me.collectionGroups = tree.map((node) => {
        let group = node?.group ?? {};
        let isUngrouped = !!node?.is_ungrouped;

        return {
          id: isUngrouped ? TM_COLLECTION_UNGROUPED_KEY : group.id,
          // groupId gốc, dùng khi tạo item mới thuộc group này.
          // Group ảo thì không có groupId thật -> tạo item sẽ để trống group.
          groupId: isUngrouped ? "" : group.id ?? "",
          name: isUngrouped
            ? me.$t("i18nCommon.collection.ungrouped")
            : group.name ?? "",
          isUngrouped,
          items: Array.isArray(node?.items) ? node.items : [],
        };
      });
    },

    /**
     * Tìm group chứa 1 item, dùng để biết item đang mở thuộc group nào
     * @param {string} itemId
     * @returns {Object|null} group, null nếu item không còn trong cây
     */
    findCollectionGroupByItemId(itemId) {
      if (!itemId) return null;
      return (
        this.collectionGroups.find((group) =>
          group.items.some((item) => item.id == itemId),
        ) ?? null
      );
    },

    /**
     * Mở popup tạo nhóm mới, tạo xong thì tự tải lại cây
     */
    async handleAddCollectionGroup() {
      let me = this;
      TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMCollectionGroupPopup,
        ownerForm: me,
        callback: async (payload) => {
          if (payload?.name) {
            await me.createCollectionGroup(payload.name);
          }
        },
      });
    },

    /**
     * Tạo nhóm mới, trả về group vừa tạo (hoặc null nếu lỗi)
     * @returns {Promise<Object|null>} group đã tạo
     */
    async createCollectionGroup(name) {
      let me = this;
      try {
        let response = await me.collectionGroupAPI.create({ name });
        if (response?.data?.success) {
          me.$tmToast.success(me.$t("i18nCommon.collection.createSuccess"));
          await me.loadCollection();
          // trả về group vừa tạo để caller lưu item vào đó ngay
          return (
            me.collectionGroups.find(
              (group) => !group.isUngrouped && group.name === name,
            ) ?? null
          );
        }
      } catch (error) {
        console.error("Lỗi tạo nhóm:", error);
        me.$tmToast.error(me.$t("i18nCommon.collection.createErr"));
      }
      return null;
    },

    /**
     * Đổi tên nhóm
     */
    async renameCollectionGroup(group, newName) {
      let me = this;
      try {
        let response = await me.collectionGroupAPI.update({
          id: group.groupId ?? group.id,
          name: newName,
        });
        if (response?.data?.success) {
          me.$tmToast.success(me.$t("i18nCommon.collection.updateSuccess"));
          await me.loadCollection();
        }
      } catch (error) {
        console.error("Lỗi đổi tên nhóm:", error);
        me.$tmToast.error(me.$t("i18nCommon.collection.updateErr"));
      }
    },

    /**
     * Xoá nhóm. Backend sẽ xoá luôn toàn bộ item bên trong nên hỏi lại user trước.
     */
    async deleteCollectionGroup(group) {
      let me = this;
      let confirmed = await TMDialogUtil.confirm({
        ownerForm: me,
        title: me.$t("i18nCommon.collection.deleteGroup"),
        message: me.$t("i18nCommon.collection.confirmDeleteGroup").format(
          group.name,
          group.items.length,
        ),
      });
      if (!confirmed) return;

      try {
        let response = await me.collectionGroupAPI.deleteById(
          group.groupId ?? group.id,
        );
        if (response?.data?.success) {
          me.$tmToast.success(me.$t("i18nCommon.collection.deleteSuccess"));
          // Tải lại cây TRƯỚC rồi mới gọi hook, để tool kiểm tra
          // item đang mở còn tồn tại hay không dựa trên cây mới nhất.
          // Gọi hook trước sẽ thấy cây cũ và luôn tưởng item vẫn còn.
          await me.loadCollection();
          await me.onCollectionGroupDeleted?.(group);
        }
      } catch (error) {
        console.error("Lỗi xoá nhóm:", error);
        me.$tmToast.error(me.$t("i18nCommon.collection.deleteErr"));
      }
    },

    /**
     * Xoá 1 item, có hỏi lại user trước.
     * Tool cần dọn state riêng (vd: reset form đang mở) thì override
     * onCollectionItemDeleted hoặc gọi hàm này từ handler của tool.
     */
    async deleteCollectionItem(item) {
      let me = this;
      let confirmed = await TMDialogUtil.confirm({
        ownerForm: me,
        title: me.$t("i18nCommon.collection.deleteItem"),
        message: me.$t("i18nCommon.collection.confirmDeleteItem").format(
          me.getCollectionItemName(item),
        ),
      });
      if (!confirmed) return;

      try {
        let response = await me.collectionItemAPI.deleteById(item.id);
        if (response?.data?.success) {
          me.$tmToast.success(me.$t("i18nCommon.collection.deleteSuccess"));
          await me.onCollectionItemDeleted?.(item);
          await me.loadCollection();
        }
      } catch (error) {
        console.error("Lỗi xoá item:", error);
        me.$tmToast.error(me.$t("i18nCommon.collection.deleteErr"));
      }
    },

    /**
     * Tên hiển thị của item, dùng cho toast xác nhận.
     * Tool có thể override nếu muốn hiện tên theo kiểu riêng.
     */
    getCollectionItemName(item) {
      return item?.name ?? "";
    },
  },
};