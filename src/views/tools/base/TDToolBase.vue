<!-- Component base cho tất cả các tool -->
<script>
import _ from "@/common/TDCommonFunction.js";

export default {
  name: "TDToolBase",
  props: {
    // id uuid được build động để nhận diện đây là tool nào
    tabId: {
      type: String,
      default: null,
    },
  },
  methods: {
    /**
     * rebuild title của tab khi có thay đổi
     */
    reBuildTabTitle: _.debounce(function (content) {
      let me = this;
      me.$emit("updateTabTitle", {
        tabId: me.tabId,
        title: content,
        append: true,
      });
    }, 300),
  },
};
</script>
