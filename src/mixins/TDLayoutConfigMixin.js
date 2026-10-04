export default {
  props: {},
  computed: {},
  created() {
    // Đọc cache là async nên created/mounted của component chạy trước khi
    // currentConfigLayout được gộp xong. Lưu lại promise để component con
    // await được rồi mới chuẩn hoá/ghi đè config sau khi đã đọc cache.
    this.configLayoutLoaded = this.applyConfigLayout();
  },
  methods: {
    async applyConfigLayout() {
      let me = this;
      if (me.keyCacheLayout != null && me.keyCacheLayout != undefined) {
        let tmpcurrentConfigLayout = await me.$tdCache.get(me.keyCacheLayout);
        if (tmpcurrentConfigLayout) {
          me.currentConfigLayout = Object.assign(
            me.currentConfigLayout,
            tmpcurrentConfigLayout,
          );
        }
      }
    },
    async updateConfigLayout() {
      let me = this;
      if (
        me.keyCacheLayout != null &&
        me.keyCacheLayout != undefined &&
        me.currentConfigLayout != null &&
        me.currentConfigLayout != undefined
      ) {
        await me.$tdCache.set(me.keyCacheLayout, me.currentConfigLayout);
      }
    },
  },
};
