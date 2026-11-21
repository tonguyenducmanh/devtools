<template>
  <iframe
    class="preview-frame"
    :srcdoc="previewDocument"
    :title="$t('i18nCommon.codeTemplate.preview')"
    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation allow-downloads allow-pointer-lock allow-presentation"
  ></iframe>
</template>

<script>
export default {
  name: "TMCodeTemplateSCSSPreview",
  props: {
    previewHtml: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      themeVersion: 0,
    };
  },
  computed: {
    previewDocument() {
      // Theo dõi theme để copy lại CSS variable khi người dùng đổi theme.
      void this.themeVersion;
      let rootVars = this.collectCssVariables();
      return (this.previewHtml || "").replace(
        "</head>",
        `<style>:root{${rootVars}}</style></head>`,
      );
    },
  },
  mounted() {
    let me = this;
    me.themeObserver = new MutationObserver(() => {
      me.themeVersion += 1;
    });
    me.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
  },
  beforeUnmount() {
    if (this.themeObserver) this.themeObserver.disconnect();
  },
  methods: {
    /**
     * iframe là document riêng nên không kế thừa :root của app. Copy mọi CSS
     * custom property từ app sang iframe để template chỉ dùng var(--...).
     */
    collectCssVariables() {
      if (typeof window === "undefined") return "";
      let vars = [];
      [document.documentElement, document.body].forEach((element) => {
        if (!element) return;
        let style = window.getComputedStyle(element);
        for (let i = 0; i < style.length; i++) {
          let name = style[i];
          if (name.indexOf("--") === 0) {
            vars.push(`${name}:${style.getPropertyValue(name).trim()};`);
          }
        }
      });
      return vars.join("");
    },
  },
};
</script>

<style scoped lang="scss">
/* Giống TMHTMLPreview: iframe nhận nguyên HTML, chỉ style khung ở parent document. */
.preview-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
</style>
