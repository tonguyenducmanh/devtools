<template>
  <iframe
    class="preview-frame"
    :srcdoc="previewDocument"
    :title="$t('i18nCommon.markdownText.preview')"
    sandbox=""
  ></iframe>
</template>

<script>
import githubLightCss from "github-markdown-css/github-markdown-light.css?raw";
import githubDarkCss from "github-markdown-css/github-markdown-dark-dimmed.css?raw";
import { injectAppCssVariables } from "@/common/TMPreviewUtil.js";
import { renderMarkdownToHtml } from "@/common/markdown/TMMarkdownUtils.js";

/**
 * Cách preview theo https://github.com/tanabe/markdown-live-preview:
 * marked -> DOMPurify -> nội dung đặt trong `.markdown-body`, CSS là bộ
 * github-markdown-css (đổi light/dark theo theme của app).
 * Giữ iframe để CSS của GitHub không lẫn vào stylesheet của app.
 */
const WRAPPER_STYLE = `
body {
  margin: 0;
  padding: var(--padding-large);
  background: var(--bg-main-color);
}
.markdown-body {
  min-height: 100%;
  background: transparent;
}
`;

export default {
  name: "TMBlankTextMarkdownPreview",
  props: {
    source: {
      type: String,
      default: "",
    },
    // Tăng khi bấm nút "Thực hiện" để buộc render lại dù nội dung không đổi.
    renderNonce: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      themeVersion: 0,
    };
  },
  computed: {
    isDarkTheme() {
      // Theo dõi theme để đổi stylesheet light/dark (xem mounted()).
      void this.themeVersion;
      return (
        typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    },
    previewDocument() {
      let me = this;
      void me.renderNonce;
      let body = renderMarkdownToHtml(me.source);
      let css = me.isDarkTheme ? githubDarkCss : githubLightCss;
      let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${css}</style>
<style>${WRAPPER_STYLE}</style>
</head>
<body>
<article class="markdown-body">
${body}
</article>
</body>
</html>`;
      return injectAppCssVariables(html);
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
};
</script>

<style scoped lang="scss">
.preview-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
</style>
