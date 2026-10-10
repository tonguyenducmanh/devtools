// ─── Cấu hình sidebar ─────────────────────────────────────────────────────────
// type: "group"  → nhóm nhiều tool, hiển thị tab bar khi vào
// type: "route"  → tool đơn lẻ, điều hướng trực tiếp như cũ
// hide: true     → không hiện trên sidebar (vẫn đăng ký)

const sidebarConfig = [
  {
    type: "route",
    hide: true,
    name: "home",
    component: () => import("@/views/misc/TMWelcome.vue"),
    meta: { titleKey: "i18nCommon.feature.welcome" },
  },
  {
    type: "route",
    hide: true,
    name: "TMUserSettings",
    component: () => import("@/views/misc/TMUserSettings.vue"),
    meta: { titleKey: "i18nCommon.feature.userSettings" },
  },
  {
    type: "group",
    groupKey: "graphicdesign",
    groupTitleKey: "i18nCommon.group.GraphicDesign",
    children: [
      {
        name: "TMPhotoCraft",
        component: () => import("@/views/tools/Craft/TMPhotoCraft.vue"),
        meta: {
          titleKey: "i18nCommon.feature.PhotoCraft",
        },
      },
      {
        name: "TMVectorCraft",
        component: () => import("@/views/tools/Craft/TMVectorCraft.vue"),
        meta: {
          titleKey: "i18nCommon.feature.VectorCraft",
        },
      },
    ],
  },
  {
    type: "route",
    name: "TMOneTimePassword",
    component: () => import("@/views/tools/TMOneTimePassword.vue"),
    meta: {
      titleKey: "i18nCommon.feature.oneTimePassword",
    },
  },
  {
    type: "group",
    groupKey: "api",
    groupTitleKey: "i18nCommon.group.API",
    children: [
      {
        name: "apitesting",
        component: () => import("@/views/tools/APITesting/TMAPITesting.vue"),
        meta: {
          titleKey: "i18nCommon.feature.APITesting",
        },
      },
      {
        name: "apimocking",
        component: () => import("@/views/tools/TMAPIMocking.vue"),
        meta: {
          titleKey: "i18nCommon.feature.APIMocking",
        },
      },
    ],
  },
  {
    type: "automation",
    name: "TMAutomation",
    component: () => import("@/views/tools/APITesting/TMAutomation.vue"),
    meta: {
      titleKey: "i18nCommon.feature.Automation",
    },
  },
  {
    type: "group",
    groupKey: "qrcode",
    groupTitleKey: "i18nCommon.group.QRCode",
    children: [
      {
        name: "textoqrcode",
        component: () => import("@/views/tools/TMTextToQRCode.vue"),
        meta: {
          titleKey: "i18nCommon.feature.QRCodeFromText",
        },
      },
      {
        name: "qrcodetotext",
        component: () => import("@/views/tools/TMQRCodeToText.vue"),
        meta: {
          titleKey: "i18nCommon.feature.QRCodeToText",
        },
      },
    ],
  },
  {
    type: "group",
    groupKey: "database",
    groupTitleKey: "i18nCommon.group.Database",
    children: [
      {
        name: "TMPostgreSQLQuery",
        component: () =>
          import("@/views/tools/PostgreSQLQuery/TMPostgreSQLQuery.vue"),
        meta: { titleKey: "i18nCommon.postgreSQLQuery.featureName" },
      },
      {
        name: "TMAppDataMiner",
        component: () => import("@/views/tools/TMAppDataMiner.vue"),
        meta: { titleKey: "i18nCommon.feature.AppDataMiner" },
      },
    ],
  },
  {
    type: "group",
    groupKey: "remotedesktop",
    groupTitleKey: "i18nCommon.group.RemoteDesktop",
    children: [
      {
        name: "TMRemoteDesktopRDP",
        component: () => import("@/views/tools/TMRemoteDesktopRDP.vue"),
        meta: {
          titleKey: "i18nCommon.feature.remoteDesktopRDP",
        },
      },
    ],
  },
  {
    type: "group",
    groupKey: "text",
    groupTitleKey: "i18nCommon.group.Text",
    children: [
      {
        name: "TMBlankText",
        component: () => import("@/views/tools/TMBlankText.vue"),
        meta: {
          titleKey: "i18nCommon.feature.blanktext",
        },
      },
      {
        name: "comparecode",
        component: () => import("@/views/tools/TMCompareCode.vue"),
        meta: { titleKey: "i18nCommon.feature.compareCode" },
      },
      {
        name: "codeformatter",
        component: () => import("@/views/tools/TMCodeFormatter.vue"),
        meta: { titleKey: "i18nCommon.feature.CodeFormatter" },
      },
      {
        name: "TMTextCompress",
        component: () => import("@/views/tools/TMTextCompress.vue"),
        meta: { titleKey: "i18nCommon.feature.textCompress" },
      },
      {
        name: "TMTextManipulation",
        component: () => import("@/views/tools/TMTextManipulation.vue"),
        meta: {
          titleKey: "i18nCommon.feature.textManipulation",
        },
      },
      {
        name: "textgenerator",
        component: () => import("@/views/tools/TMTextGenerator.vue"),
        meta: { titleKey: "i18nCommon.feature.textgenerator" },
      },
    ],
  },
  {
    type: "group",
    groupKey: "json",
    groupTitleKey: "i18nCommon.group.JSON",
    children: [
      {
        name: "jsontopostgresql",
        component: () => import("@/views/tools/TMJSONToPostgreSQL.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToPostgreSQL" },
      },
      {
        name: "jsontoexcel",
        component: () => import("@/views/tools/TMJSONToExcel.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToExcel" },
      },
      {
        name: "exceltojson",
        component: () => import("@/views/tools/TMExcelToJSON.vue"),
        meta: { titleKey: "i18nCommon.feature.ExcelToJSON" },
      },
      {
        name: "jsontoonelinestring",
        component: () => import("@/views/tools/TMJSONToOneLineString.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToOneLineString" },
      },
      {
        name: "jsontomodel",
        component: () => import("@/views/tools/TMJSONToModel.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToModel" },
      },
      {
        name: "jsonsortbykey",
        component: () => import("@/views/tools/TMJSONSortByKey.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONSortByKey" },
      },
    ],
  },
  {
    type: "group",
    groupKey: "sampecode",
    groupTitleKey: "i18nCommon.group.SampleCode",
    children: [
      {
        name: "postgresqltemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TMCodeTemplatePostgreSQL.vue"),
        meta: { titleKey: "i18nCommon.feature.PostgreSQLTemplate" },
      },
      {
        name: "automationtemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TMCodeTemplateAutomation.vue"),
        meta: { titleKey: "i18nCommon.feature.AutomationTemplate" },
      },
      {
        name: "javadcripttemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TMCodeTemplateJavascript.vue"),
        meta: { titleKey: "i18nCommon.feature.JavaScriptTemplate" },
      },
      {
        name: "csharptemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TMCodeTemplateCSharp.vue"),
        meta: { titleKey: "i18nCommon.feature.CSharpTemplate" },
      },
      {
        name: "powershelltemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TMCodeTemplatePowerShell.vue"),
        meta: { titleKey: "i18nCommon.feature.PowerShellTemplate" },
      },
      {
        name: "gittemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TMCodeTemplateGit.vue"),
        meta: { titleKey: "i18nCommon.feature.GitTemplate" },
      },
    ],
  },
  {
    type: "group",
    groupKey: "image",
    groupTitleKey: "i18nCommon.group.Image",
    children: [
      {
        name: "base64toimage",
        component: () => import("@/views/tools/TMBase64ToImage.vue"),
        meta: { titleKey: "i18nCommon.feature.ImageFromBase64" },
      },
      {
        name: "imagetobase64",
        component: () => import("@/views/tools/TMImageToBase64.vue"),
        meta: { titleKey: "i18nCommon.feature.ImageToBase64" },
      },
      {
        name: "colorpicker",
        component: () => import("@/views/tools/TMColorPickerFromImage.vue"),
        meta: { titleKey: "i18nCommon.feature.colorPicker" },
      },
    ],
  },
  {
    type: "group",
    groupKey: "ai",
    groupTitleKey: "i18nCommon.group.ArtificialIntelligence",
    children: [
      {
        name: "cosinsimilarity",
        component: () => import("@/views/tools/TMCosinSimilarity.vue"),
        meta: {
          titleKey: "i18nCommon.feature.cosinSimilarity",
        },
      },
      {
        name: "vectormockgenerator",
        component: () => import("@/views/tools/TMVectorMockGenerator.vue"),
        meta: {
          titleKey: "i18nCommon.feature.vectorMockGenerator",
        },
      },
    ],
  },
  {
    type: "group",
    groupKey: "linhtinh",
    groupTitleKey: "i18nCommon.group.Miscellaneous",
    children: [
      {
        name: "TMBilingualWeb",
        component: () => import("@/views/tools/TMBilingualWeb.vue"),
        meta: {
          titleKey: "i18nCommon.feature.BilingualWeb",
        },
      },
      {
        name: "TMHTMLPreview",
        component: () => import("@/views/tools/TMHTMLPreview.vue"),
        meta: { titleKey: "i18nCommon.feature.HTMLPreview" },
      },
    ],
  },
  {
    type: "route",
    name: "component-showcase",
    component: () => import("@/views/tools/TMComponentShowcase.vue"),
    meta: { titleKey: "i18nCommon.feature.componentShowcase" },
    hide: true,
  },
];

/**
 * Trả về danh sách items cho sidebar theo đúng thứ tự khai báo trong sidebarConfig.
 * Group và standalone xen kẽ tự do.
 */
export function getSidebarItems() {
  return sidebarConfig
    .filter((item) => !item.hide)
    .map((item) => {
      if (item.type === "group") {
        return {
          type: "group",
          groupKey: item.groupKey,
          groupTitleKey: item.groupTitleKey,
          children: item.children,
        };
      }
      // type === "route"
      return {
        type: "route",
        route: item,
      };
    });
}

/**
 * Trả về toàn bộ config của 1 group theo groupKey.
 * Dùng để lấy danh sách tool tab.
 */
export function getGroupConfig(groupKey) {
  return (
    sidebarConfig.find(
      (item) => item.type === "group" && item.groupKey === groupKey,
    ) ?? null
  );
}

/**
 * Trả về toàn bộ danh sách tool có thể tìm kiếm (dùng cho search popup).
 * Shape: { name, meta, groupTitleKey? }
 */
export function getAllSearchableRoutes() {
  return sidebarConfig.flatMap((item) => {
    if (item.type === "group") {
      return item.children.map((child) => ({
        name: child.name,
        meta: child.meta,
        groupTitleKey: item.groupTitleKey,
        groupKey: item.groupKey,
        component: child.component,
      }));
    }
    if (item.type === "route" && !item.hide) {
      return [
        {
          name: item.name,
          meta: item.meta,
          groupTitleKey: null,
          groupKey: "",
          component: item.component,
        },
      ];
    }
    return [];
  });
}
