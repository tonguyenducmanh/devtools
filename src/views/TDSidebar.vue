<template>
  <div class="td-sidebar">
    <template v-for="(item, index) in routerLink">
      <RouterLink
        class="td-sidebar-item"
        activeClass="td-item-active"
        :id="index"
        :to="item.path"
        >{{ item.title }}</RouterLink
      >
    </template>
  </div>
</template>

<script>
export default {
  name: "TDSidebar",
  components: {},

  created() {},
  mounted() {},
  methods: {},
  props: {},
  data() {
    return {
      routerLink: [
        {
          path: "/",
          title: "Welcome",
        },
        {
          path: "/imagetobase64",
          title: "Image to base64",
        },
        {
          path: "/base64toimage",
          title: "Base64 to image",
        },
        {
          path: "/jsontopostgresql",
          title: "Json to postgre sql",
        },
        {
          path: "/textoqrcode",
          title: "Text to QR code",
        },
      ],
    };
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
.td-sidebar {
  width: 250px;
  min-width: 250px;
  max-width: 250px;
  height: 100%;
  background-color: var(--bg-sub-color);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;

  .td-sidebar-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 30px;
    padding: var(--padding);
    padding-left: var(--padding-large);
  }
  .td-sidebar-item:hover {
    background-color: var(--bg-main-color);
  }
  .td-item-active {
    background-color: var(--bg-active-color);
  }
}
</style>
