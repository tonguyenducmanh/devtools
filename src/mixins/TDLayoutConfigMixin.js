export default {
  props: {},
  computed: {},
  async created() {
    let me = this;
    await me.applyConfigLayout();
  },
  methods: {
    async applyConfigLayout() {
      let me = this;
      let tmpcurrentConfigLayout = await me.$tdCache.get(me.keyCacheLayout);
      if (tmpcurrentConfigLayout) {
        me.currentConfigLayout = Object.assign(
          me.currentConfigLayout,
          tmpcurrentConfigLayout,
        );
      }
    },
    async updateConfigLayout() {
      let me = this;
      await me.$tdCache.set(me.keyCacheLayout, me.currentConfigLayout);
    },
  },
};
