<!-- Component base cho tất cả các tool -->
<script>
import _ from "@/common/TDCommonFunction.js";
import TDLayoutConfigMixin from "@/mixins/TDLayoutConfigMixin.js";

export default {
  name: "TDToolBase",
  mixins: [TDLayoutConfigMixin],
  props: {
    tabId: {
      type: String,
      default: null,
    },
  },
  mounted() {
    this.onTabEnter();
  },
  beforeUnmount() {
    // mặc định file này unmount là remove hết event
    this.onTabLeave();
  },
  methods: {
    /**
     * Hàm này được gọi khi tab được active hoặc khi component được mount (nếu đang active)
     * Base xử lý gọi các kịch bản chung khi enter tab
     * Component con KHÔNG override hàm này
     */
    onTabEnter() {
      this.registerIntellisense();
      this.onTabEnterCustom();
    },

    /**
     * Hàm này được gọi khi tab bị inactive hoặc trước khi component bị unmount (nếu đang active)
     * Base xử lý gọi các kịch bản chung khi leave tab
     * Component con KHÔNG override hàm này
     */
    onTabLeave() {
      this.disposeIntellisense();
      this.onTabLeaveCustom();
    },

    /**
     * Đăng ký lại intellisense provider khi tab được active
     * Component con override để đăng ký completion/hover provider
     */
    registerIntellisense() {},

    /**
     * Hủy bỏ intellisense provider khi tab bị inactive hoặc component bị unmount
     * Component con override để dispose các disposable
     */
    disposeIntellisense() {},

    /**
     * Logic riêng của tool khi tab được active (vd: đăng ký shortcut)
     * Component con override nếu cần
     */
    onTabEnterCustom() {},

    /**
     * Logic riêng của tool khi tab bị inactive (vd: unregister shortcut)
     * Component con override nếu cần
     */
    onTabLeaveCustom() {},

    reBuildTabTitle: _.debounce(function (content) {
      let me = this;
      me.$emit("updateTabTitle", {
        tabId: me.tabId,
        title: content,
        append: true,
      });
    }, 300),
    async toggleSidebar() {
      let me = this;
      await me.updateConfigLayout();
    },
  },
};
</script>
