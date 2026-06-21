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
     * Component con cần add event (ví dụ listener trên window/document) thì override lại
     */
    onTabEnter() {},

    /**
     * Hàm này được gọi khi tab bị inactive hoặc trước khi component bị unmount (nếu đang active)
     * Component con cần remove event thì override lại
     */
    onTabLeave() {},

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
