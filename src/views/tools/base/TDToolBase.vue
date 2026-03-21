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
  methods: {
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
