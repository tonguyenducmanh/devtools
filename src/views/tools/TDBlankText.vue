<template>
  <div class="flex flex-col container">
    <div class="flex editor-container">
      <TDTextarea
        :placeHolder="$t('i18nCommon.blanktext.placeholder')"
        v-model="content"
        height="100%"
        width="100%"
        :enableHighlight="enableHighlight"
        :language="language"
      ></TDTextarea>
    </div>
    <div class="flex tool-footer">
      <TDComboBox
        :width="200"
        v-model="language"
        :options="methodOptions"
        :isDropTop="true"
        :noMargin="true"
        :placeHolder="$t('i18nCommon.blanktext.selectLanguage')"
      />
      <TDButton
        :noMargin="true"
        @click="handleCopy"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.copy')"
      ></TDButton>
      <TDButton
        :noMargin="true"
        @click="handleDownload"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.blanktext.download')"
      ></TDButton>
    </div>
  </div>
</template>
<script>
export default {
  name: "TDBlankText",
  data() {
    return {
      content: "",
      enableHighlight: true,
      language: "plaintext",
      methodOptions: [
        { value: "plaintext", label: "Plain Text" },
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "json", label: "JSON" },
        { value: "xml", label: "XML" },
        { value: "html", label: "HTML" },
        { value: "css", label: "CSS" },
        { value: "scss", label: "SCSS" },
        { value: "less", label: "Less" },
        { value: "sql", label: "SQL" },
        { value: "pgsql", label: "Postgres SQL" },
        { value: "mysql", label: "MySQL" },
        { value: "csharp", label: "C#" },
        { value: "cpp", label: "C++" },
        { value: "java", label: "Java" },
        { value: "go", label: "Go" },
        { value: "rust", label: "Rust" },
        { value: "python", label: "Python" },
        { value: "php", label: "PHP" },
        { value: "ruby", label: "Ruby" },
        { value: "swift", label: "Swift" },
        { value: "kotlin", label: "Kotlin" },
        { value: "shell", label: "Shell" },
        { value: "powershell", label: "PowerShell" },
        { value: "dockerfile", label: "Dockerfile" },
        { value: "yaml", label: "YAML" },
        { value: "markdown", label: "Markdown" },
        { value: "ini", label: "INI" },
        { value: "bat", label: "Batch" },
        { value: "coffeescript", label: "CoffeeScript" },
        { value: "lua", label: "Lua" },
        { value: "perl", label: "Perl" },
        { value: "r", label: "R" },
        { value: "objective-c", label: "Objective-C" },
        { value: "vb", label: "Visual Basic" },
        { value: "dart", label: "Dart" },
        { value: "graphql", label: "GraphQL" },
        { value: "handlebars", label: "Handlebars" },
        { value: "pug", label: "Pug" },
        { value: "redis", label: "Redis" },
        { value: "sparql", label: "SPARQL" },
        { value: "scheme", label: "Scheme" },
        { value: "solidity", label: "Solidity" },
        { value: "toml", label: "TOML" },
        { value: "abap", label: "ABAP" },
        { value: "apex", label: "Apex" },
        { value: "azcli", label: "Azure CLI" },
        { value: "bicep", label: "Bicep" },
        { value: "cameligo", label: "CameLIGO" },
        { value: "cypher", label: "Cypher" },
        { value: "pascaligo", label: "PascalIGO" },
        { value: "protobuf", label: "Protocol Buffers" },
        { value: "st", label: "Structured Text" },
        { value: "tcl", label: "Tcl" },
        { value: "twig", label: "Twig" },
        { value: "wgsl", label: "WGSL" },
      ],
    };
  },
  methods: {
    handleCopy() {
      let me = this;
      if (me.content) {
        me.$tdUtility.copyToClipboard(me.content);
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.copy"));
      }
    },
    handleDownload() {
      let me = this;
      if (me.content) {
        const extension = me.getFileExtension(me.language);
        const blob = new Blob([me.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `text-editor.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        me.$tdToast.success(me.$t("i18nCommon.blanktext.downloaded"));
      }
    },
    getFileExtension(language) {
      const extensionMap = {
        javascript: "js",
        typescript: "ts",
        json: "json",
        xml: "xml",
        html: "html",
        css: "css",
        scss: "scss",
        less: "less",
        sql: "sql",
        pgsql: "sql",
        mysql: "sql",
        csharp: "cs",
        cpp: "cpp",
        java: "java",
        go: "go",
        rust: "rs",
        python: "py",
        php: "php",
        ruby: "rb",
        swift: "swift",
        kotlin: "kt",
        shell: "sh",
        powershell: "ps1",
        dockerfile: "dockerfile",
        yaml: "yaml",
        markdown: "md",
        ini: "ini",
        bat: "bat",
        coffeescript: "coffee",
        lua: "lua",
        perl: "pl",
        r: "r",
        "objective-c": "m",
        vb: "vb",
        dart: "dart",
        graphql: "graphql",
        handlebars: "hbs",
        pug: "pug",
        redis: "redis",
        sparql: "sparql",
        scheme: "scm",
        solidity: "sol",
        toml: "toml",
        abap: "abap",
        apex: "cls",
        azcli: "azcli",
        bicep: "bicep",
        cameligo: "mligo",
        cypher: "cypher",
        pascaligo: "ligo",
        protobuf: "proto",
        st: "st",
        tcl: "tcl",
        twig: "twig",
        wgsl: "wgsl",
        plaintext: "txt",
      };
      return extensionMap[language] || "txt";
    },
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tool-footer {
  width: 100%;
  align-items: center;
  gap: var(--padding);
  margin-top: var(--padding);
}
.editor-container {
  flex: 1;
  width: 100%;
}
</style>
