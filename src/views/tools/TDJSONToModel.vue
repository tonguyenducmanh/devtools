<template>
  <div class="flex container">
    <div class="flex flex-col main-area">
      <div class="flex io-section" :class="{ 'flex-col': splitHorizontal }">
        <TDTextarea
          isLabelTop
          :enableHighlight="enableHighlight"
          language="json"
          :label="$t('i18nCommon.JSONToModel.inputLabel')"
          :placeHolder="$t('i18nCommon.JSONToModel.inputPlaceholder')"
          v-model="inputJSON"
          :wrapText="wrapText"
        ></TDTextarea>
        <TDTextarea
          isLabelTop
          :label="$t('i18nCommon.JSONToModel.outputLabel')"
          :readOnly="true"
          :enableHighlight="enableHighlight"
          :language="outputHighlightLanguage"
          :placeHolder="$t('i18nCommon.JSONToModel.outputPlaceholder')"
          v-model="outputModel"
          :wrapText="wrapText"
        ></TDTextarea>
      </div>
      <div class="flex">
        <TDButton
          :label="$t('i18nCommon.JSONToModel.convert')"
          @click="convertToModel"
        ></TDButton>
        <TDButton
          @click="handleCopyEvent"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.JSONToModel.copy')"
        ></TDButton>
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.JSONToModel.example')"
        ></TDButton>
      </div>
    </div>

    <!-- SubSidebar: cài đặt -->
    <TDSubSidebar v-model="isShowSidebar">
      <template v-slot:main>
        <div class="flex flex-col td-sidebar-content">
          <!-- Chọn ngôn ngữ output -->
          <div class="flex flex-col group-section">
            <TDComboBox
              :width="250"
              v-model="selectedLanguage"
              :options="languageOptions"
              :noMargin="true"
              :isEditable="false"
              @change="convertToModel"
            ></TDComboBox>
          </div>

          <!-- Tên class gốc -->
          <div class="sidebar-input">
            <TDInput
              v-model="rootClassName"
              :placeHolder="$t('i18nCommon.JSONToModel.rootClassName')"
            />
          </div>

          <!-- C# options -->
          <template v-if="selectedLanguage === LANG.CSharp">
            <div class="sidebar-input">
              <TDInput
                v-model="csharp.namespace"
                :placeHolder="$t('i18nCommon.JSONToModel.namespace')"
              />
            </div>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="csharp.useJsonProperty"
              :label="$t('i18nCommon.JSONToModel.useJsonProperty')"
              @change="convertToModel"
            ></TDCheckbox>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="csharp.usePascalCase"
              :label="$t('i18nCommon.JSONToModel.usePascalCase')"
              @change="convertToModel"
            ></TDCheckbox>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="csharp.useNullable"
              :label="$t('i18nCommon.JSONToModel.useNullable')"
              @change="convertToModel"
            ></TDCheckbox>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="csharp.useRecord"
              :label="$t('i18nCommon.JSONToModel.useRecord')"
              @change="convertToModel"
            ></TDCheckbox>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="csharp.useDataAnnotation"
              :label="$t('i18nCommon.JSONToModel.useDataAnnotation')"
              @change="convertToModel"
            ></TDCheckbox>
          </template>

          <!-- Go options -->
          <template v-if="selectedLanguage === LANG.Go">
            <div class="sidebar-input">
              <TDInput
                v-model="golang.packageName"
                :placeHolder="$t('i18nCommon.JSONToModel.packageName')"
              />
            </div>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="golang.useJsonTag"
              :label="$t('i18nCommon.JSONToModel.useJsonTag')"
              @change="convertToModel"
            ></TDCheckbox>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="golang.useOmitempty"
              :label="$t('i18nCommon.JSONToModel.useOmitempty')"
              @change="convertToModel"
            ></TDCheckbox>
            <TDCheckbox
              :variant="$tdEnum.checkboxType.switch"
              v-model="golang.usePointer"
              :label="$t('i18nCommon.JSONToModel.usePointer')"
              @change="convertToModel"
            ></TDCheckbox>
          </template>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="enableHighlight"
            :label="$t('i18nCommon.enableHighlight')"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
          ></TDCheckbox>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDSubSidebar from "@/components/TDSubSidebar.vue";

const LANG = {
  CSharp: "csharp",
  Go: "go",
};

export default {
  name: "TDJSONToModel",
  components: { TDSubSidebar },
  created() {},
  beforeUnmount() {},
  mounted() {},

  computed: {
    languageOptions() {
      return [
        { label: "C#", value: LANG.CSharp },
        { label: "Go", value: LANG.Go },
      ];
    },
    outputHighlightLanguage() {
      return this.selectedLanguage === LANG.Go ? "go" : "csharp";
    },
  },

  methods: {
    // ─── Parse input (JSON strict + JS object fallback) ───────────────────────
    tryParseInput(raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {}
      try {
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${raw});`)();
        if (result !== null && typeof result === "object") return result;
      } catch (_) {}
      return undefined;
    },

    // ─── Entry point ─────────────────────────────────────────────────────────
    convertToModel() {
      let me = this;
      try {
        if (!me.inputJSON || !me.inputJSON.trim()) {
          me.outputModel = "";
          return;
        }
        const parsed = me.tryParseInput(me.inputJSON.trim());
        if (parsed === undefined) {
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
          return;
        }
        const rootName = me.rootClassName?.trim() || "RootModel";
        if (me.selectedLanguage === LANG.CSharp) {
          me.outputModel = me.buildCSharp(parsed, rootName);
        } else {
          me.outputModel = me.buildGo(parsed, rootName);
        }
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Error in convertToModel:", error);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    // ─── Helpers chung ───────────────────────────────────────────────────────

    /**
     * PascalCase từ bất kỳ key nào: snake_case, camelCase, kebab-case
     */
    toPascalCase(str, alwayBuild) {
      if (
        (this.csharp.usePascalCase && this.selectedLanguage == LANG.CSharp) ||
        this.selectedLanguage == LANG.Go ||
        alwayBuild
      ) {
        return str
          .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
          .replace(/^(.)/, (c) => c.toUpperCase());
      } else {
        return str;
      }
    },

    /**
     * Phát hiện kiểu dữ liệu của 1 giá trị JS
     * Trả về { base, isArray, isObject, children? }
     */
    detectType(value) {
      if (value === null || value === undefined) {
        return { base: "null", isArray: false, isObject: false };
      }
      if (Array.isArray(value)) {
        const sample = value.find((v) => v !== null && v !== undefined);
        if (sample === undefined) {
          return { base: "object", isArray: true, isObject: false };
        }
        const inner = this.detectType(sample);
        return { ...inner, isArray: true };
      }
      if (typeof value === "object") {
        return {
          base: "object",
          isArray: false,
          isObject: true,
          children: value,
        };
      }
      if (typeof value === "boolean")
        return { base: "bool", isArray: false, isObject: false };
      if (typeof value === "number") {
        if (!Number.isInteger(value)) {
          return { base: "double", isArray: false, isObject: false };
        }
        // Số nguyên vượt giới hạn int32 (-2^31..2^31-1) => dùng long
        const isLong = value > 2147483647 || value < -2147483648;
        return {
          base: isLong ? "long" : "int",
          isArray: false,
          isObject: false,
        };
      }
      // string — thử detect datetime / guid
      if (typeof value === "string") {
        if (/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/.test(value))
          return { base: "datetime", isArray: false, isObject: false };
        if (
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            value,
          )
        )
          return { base: "guid", isArray: false, isObject: false };
        return { base: "string", isArray: false, isObject: false };
      }
      return { base: "string", isArray: false, isObject: false };
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // C# Builder
    // ═══════════════════════════════════════════════════════════════════════════

    buildCSharp(parsed, rootName) {
      const me = this;
      // classes sẽ được gom vào đây (nested class xuất hiện trước root)
      const classes = [];
      me.buildCSharpClass(parsed, rootName, classes);

      const blocks = classes.reverse(); // root lên đầu

      const lines = [];

      // using
      if (me.csharp.useJsonProperty) lines.push("using Newtonsoft.Json;");
      if (me.csharp.useDataAnnotation)
        lines.push("using System.ComponentModel.DataAnnotations;");
      if (me.csharp.useJsonProperty || me.csharp.useDataAnnotation)
        lines.push("");

      // namespace
      if (me.csharp.namespace?.trim()) {
        lines.push(`namespace ${me.csharp.namespace.trim()}`);
        lines.push("{");
        blocks.forEach((cls) => {
          cls.split("\n").forEach((l) => lines.push("    " + l));
          lines.push("");
        });
        lines.push("}");
      } else {
        blocks.forEach((cls, i) => {
          lines.push(cls);
          if (i < blocks.length - 1) lines.push("");
        });
      }

      return lines.join("\n");
    },

    buildCSharpClass(obj, className, classes) {
      const me = this;
      const pascal = me.toPascalCase(className, true);
      const keyword = me.csharp.useRecord ? "record" : "class";
      const props = [];

      const source = Array.isArray(obj) ? obj[0] : obj;
      if (!source || typeof source !== "object") return pascal;

      Object.entries(source).forEach(([key, value]) => {
        const propName = me.toPascalCase(key);
        const typeInfo = me.detectType(value);
        let csType;

        if (
          typeInfo.isObject ||
          (typeInfo.isArray && typeInfo.base === "object")
        ) {
          // Nested class
          const nestedName = me.toPascalCase(key, true);
          const sampleObj = typeInfo.isArray ? value : value;
          me.buildCSharpClass(sampleObj, nestedName, classes);
          csType = typeInfo.isArray ? `List<${nestedName}>` : nestedName;
        } else {
          csType = me.csharpPrimitive(typeInfo.base, typeInfo.isArray);
        }

        // nullable
        const nullable =
          me.csharp.useNullable && !typeInfo.isArray && csType !== "string"
            ? "?"
            : "";

        const propLines = [];

        // [JsonProperty]
        if (me.csharp.useJsonProperty) {
          propLines.push(`    [JsonProperty("${key}")]`);
        }
        // [Required] nếu DataAnnotation
        if (me.csharp.useDataAnnotation && typeInfo.base === "string") {
          propLines.push(`    [MaxLength(256)]`);
        }

        if (me.csharp.useRecord) {
          propLines.push(`    ${csType}${nullable} ${propName},`);
        } else {
          propLines.push(
            `    public ${csType}${nullable} ${propName} { get; set; }`,
          );
        }

        props.push(propLines.join("\n"));
      });

      let classBody;
      if (me.csharp.useRecord) {
        classBody = `public ${keyword} ${pascal}(\n${props.join("\n")}\n);`;
      } else {
        classBody = `public ${keyword} ${pascal}\n{\n${props.join("\n")}\n}`;
      }

      classes.push(classBody);
      return pascal;
    },

    csharpPrimitive(base, isArray) {
      const typeMap = {
        string: "string",
        int: "int",
        long: "long",
        double: "double",
        bool: "bool",
        datetime: "DateTime",
        guid: "Guid",
        null: "object",
        object: "object",
      };
      const t = typeMap[base] || "string";
      return isArray ? `List<${t}>` : t;
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // Go Builder
    // ═══════════════════════════════════════════════════════════════════════════

    buildGo(parsed, rootName) {
      const me = this;
      const structs = [];
      me.buildGoStruct(parsed, rootName, structs);

      const lines = [];
      const pkg = me.golang.packageName?.trim() || "model";
      lines.push(`package ${pkg}`);
      lines.push("");

      // import nếu cần time
      const needTime = structs.some((s) => s.includes("time.Time"));
      if (needTime) {
        lines.push(`import "time"`);
        lines.push("");
      }

      structs.reverse().forEach((s, i) => {
        lines.push(s);
        if (i < structs.length - 1) lines.push("");
      });

      return lines.join("\n");
    },

    buildGoStruct(obj, structName, structs) {
      const me = this;
      const pascal = me.toPascalCase(structName);
      const fields = [];

      const source = Array.isArray(obj) ? obj[0] : obj;
      if (!source || typeof source !== "object") return pascal;

      // Tính độ rộng tối đa tên field để căn cột
      const fieldNames = Object.keys(source).map((k) => me.toPascalCase(k));
      const maxNameLen = Math.max(...fieldNames.map((n) => n.length));

      Object.entries(source).forEach(([key, value]) => {
        const fieldName = me.toPascalCase(key);
        const typeInfo = me.detectType(value);
        let goType;

        if (
          typeInfo.isObject ||
          (typeInfo.isArray && typeInfo.base === "object")
        ) {
          const nestedName = me.toPascalCase(key);
          const sampleObj = typeInfo.isArray ? value : value;
          me.buildGoStruct(sampleObj, nestedName, structs);
          goType = typeInfo.isArray ? `[]${nestedName}` : nestedName;
        } else {
          goType = me.goPrimitive(typeInfo.base, typeInfo.isArray);
        }

        // pointer cho nullable
        if (me.golang.usePointer && !typeInfo.isArray && goType !== "string") {
          goType = `*${goType}`;
        }

        // căn cột type
        const paddedName = fieldName.padEnd(maxNameLen);

        // json tag
        let tag = "";
        if (me.golang.useJsonTag) {
          const omit = me.golang.useOmitempty ? ",omitempty" : "";
          tag = ` \`json:"${key}${omit}"\``;
        }

        fields.push(`\t${paddedName} ${goType}${tag}`);
      });

      structs.push(`type ${pascal} struct {\n${fields.join("\n")}\n}`);
      return pascal;
    },

    goPrimitive(base, isArray) {
      const typeMap = {
        string: "string",
        int: "int64",
        long: "int64",
        double: "float64",
        bool: "bool",
        datetime: "time.Time",
        guid: "string",
        null: "interface{}",
        object: "interface{}",
      };
      const t = typeMap[base] || "string";
      return isArray ? `[]${t}` : t;
    },

    // ─── Copy & Mock ──────────────────────────────────────────────────────────
    handleCopyEvent() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.outputModel);
    },

    async applyMock() {
      let me = this;
      me.inputJSON = JSON.stringify(
        {
          id: 1,
          full_name: "Nguyễn Văn A",
          email: "example@mail.com",
          birth_date: "1995-08-20T00:00:00",
          is_active: true,
          score: 9.5,
          roles: ["admin", "editor"],
          address: {
            street: "123 Lê Lợi",
            city: "Hà Nội",
            country: "Vietnam",
          },
          tags: [
            { id: 1, name: "vip" },
            { id: 2, name: "new" },
          ],
        },
        null,
        2,
      );
      me.convertToModel();
    },
  },

  data() {
    return {
      LANG,
      isShowSidebar: true,
      enableHighlight: true,
      splitHorizontal: true,
      wrapText: true,
      selectedLanguage: LANG.CSharp,
      rootClassName: "RootModel",
      inputJSON: null,
      outputModel: null,
      // C# specific
      csharp: {
        useJsonProperty: false,
        usePascalCase: false,
        useNullable: false,
        useRecord: false,
        useDataAnnotation: false,
        namespace: "",
      },
      // Go specific
      golang: {
        useJsonTag: true,
        useOmitempty: false,
        usePointer: false,
        packageName: "model",
      },
    };
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.io-section {
  flex: 1;
  gap: var(--padding);
  width: 100%;
}
.main-area {
  flex: 1;
  height: 100%;
}
.td-sidebar-content {
  width: 100%;
  height: 100%;
  justify-content: flex-start;
}
.group-section {
  width: 100%;
  gap: calc(var(--padding) / 2);
}
.sidebar-input {
  width: 100%;
  box-sizing: border-box;
  display: flex;
}
</style>
