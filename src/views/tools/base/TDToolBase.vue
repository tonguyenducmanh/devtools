<!-- Component base cho tất cả các tool -->
<script>
import _ from "@/common/TDCommonFunction.js";
import TDLayoutConfigMixin from "@/mixins/TDLayoutConfigMixin.js";
import TDShortcutAction from "@/common/TDShortcutAction.js";

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
      this._applyTabLifecycleEnter();
    },

    /**
     * Hàm này được gọi khi tab bị inactive hoặc trước khi component bị unmount (nếu đang active)
     * Base xử lý gọi các kịch bản chung khi leave tab
     * Component con KHÔNG override hàm này
     */
    onTabLeave() {
      this.disposeIntellisense();
      this._applyTabLifecycleLeave();
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
     * Trả về cấu hình lifecycle khi tab enter/leave.
     * Component con override để khai báo shortcuts và domEvents.
     *
     * Cấu trúc:
     * {
     *   shortcuts: [{ enum, config }],
     *   domEvents: [{ event, handler }]
     * }
     */
    getTabLifecycleConfig() {
      return {
        shortcuts: [],
        domEvents: [],
      };
    },

    /**
     * Đăng ký shortcuts và thêm DOM event khi tab enter
     */
    _applyTabLifecycleEnter() {
      let me = this;
      let config = me.getTabLifecycleConfig();

      (config.shortcuts || []).forEach((item) => {
        TDShortcutAction.register(item.enum, item.config);
      });

      (config.domEvents || []).forEach((item) => {
        if (item.handler) document.addEventListener(item.event, item.handler);
      });
    },

    /**
     * Hủy shortcuts và xóa DOM event khi tab leave
     */
    _applyTabLifecycleLeave() {
      let me = this;
      let config = me.getTabLifecycleConfig();

      (config.shortcuts || []).forEach((item) => {
        TDShortcutAction.unregister(item.enum);
      });

      (config.domEvents || []).forEach((item) => {
        if (item.handler) document.removeEventListener(item.event, item.handler);
      });
    },

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
