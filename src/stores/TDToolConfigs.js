// ─── Cấu hình sidebar ─────────────────────────────────────────────────────────
// type: "group"  → nhóm nhiều tool, hiển thị tab bar khi vào
// type: "route"  → tool đơn lẻ, điều hướng trực tiếp như cũ
// hide: true     → không hiện trên sidebar (vẫn đăng ký)

const sidebarConfig = [
  {
    type: "route",
    hide: true,
    name: "home",
    component: () => import("@/views/misc/TDWelcome.vue"),
    meta: { titleKey: "i18nCommon.feature.welcome" },
  },
  {
    type: "route",
    hide: true,
    name: "TDUserSettings",
    component: () => import("@/views/misc/TDUserSettings.vue"),
    meta: { titleKey: "i18nCommon.feature.userSettings" },
  },
  {
    type: "route",
    name: "TDOneTimePassword",
    component: () => import("@/views/tools/TDOneTimePassword.vue"),
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
        component: () => import("@/views/tools/APITesting/TDAPITesting.vue"),
        meta: {
          titleKey: "i18nCommon.feature.APITesting",
        },
      },
      {
        name: "apimocking",
        component: () => import("@/views/tools/TDAPIMocking.vue"),
        meta: {
          titleKey: "i18nCommon.feature.APIMocking",
        },
      },
    ],
  },
  {
    type: "automation",
    name: "TDAutomation",
    component: () => import("@/views/tools/APITesting/TDAutomation.vue"),
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
        component: () => import("@/views/tools/TDTextToQRCode.vue"),
        meta: {
          titleKey: "i18nCommon.feature.QRCodeFromText",
        },
      },
      {
        name: "qrcodetotext",
        component: () => import("@/views/tools/TDQRCodeToText.vue"),
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
        name: "TDPostgreSQLQuery",
        component: () =>
          import("@/views/tools/PostgreSQLQuery/TDPostgreSQLQuery.vue"),
        meta: { titleKey: "i18nCommon.postgreSQLQuery.featureName" },
      },
      {
        name: "TDAppDataMiner",
        component: () => import("@/views/tools/TDAppDataMiner.vue"),
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
        name: "TDRemoteDesktopRDP",
        component: () => import("@/views/tools/TDRemoteDesktopRDP.vue"),
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
        name: "TDBlankText",
        component: () => import("@/views/tools/TDBlankText.vue"),
        meta: {
          titleKey: "i18nCommon.feature.blanktext",
        },
      },
      {
        name: "comparecode",
        component: () => import("@/views/tools/TDCompareCode.vue"),
        meta: { titleKey: "i18nCommon.feature.compareCode" },
      },
      {
        name: "codeformatter",
        component: () => import("@/views/tools/TDCodeFormatter.vue"),
        meta: { titleKey: "i18nCommon.feature.CodeFormatter" },
      },
      {
        name: "TDTextCompress",
        component: () => import("@/views/tools/TDTextCompress.vue"),
        meta: { titleKey: "i18nCommon.feature.textCompress" },
      },
      {
        name: "TDTextManipulation",
        component: () => import("@/views/tools/TDTextManipulation.vue"),
        meta: {
          titleKey: "i18nCommon.feature.textManipulation",
        },
      },
      {
        name: "textgenerator",
        component: () => import("@/views/tools/TDTextGenerator.vue"),
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
        component: () => import("@/views/tools/TDJSONToPostgreSQL.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToPostgreSQL" },
      },
      {
        name: "jsontoexcel",
        component: () => import("@/views/tools/TDJSONToExcel.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToExcel" },
      },
      {
        name: "exceltojson",
        component: () => import("@/views/tools/TDExcelToJSON.vue"),
        meta: { titleKey: "i18nCommon.feature.ExcelToJSON" },
      },
      {
        name: "jsontoonelinestring",
        component: () => import("@/views/tools/TDJSONToOneLineString.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToOneLineString" },
      },
      {
        name: "jsontomodel",
        component: () => import("@/views/tools/TDJSONToModel.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToModel" },
      },
      {
        name: "jsonsortbykey",
        component: () => import("@/views/tools/TDJSONSortByKey.vue"),
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
          import("@/views/tools/codeTemplateTools/TDCodeTemplatePostgreSQL.vue"),
        meta: { titleKey: "i18nCommon.feature.PostgreSQLTemplate" },
      },
      {
        name: "automationtemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TDCodeTemplateAutomation.vue"),
        meta: { titleKey: "i18nCommon.feature.AutomationTemplate" },
      },
      {
        name: "javadcripttemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TDCodeTemplateJavascript.vue"),
        meta: { titleKey: "i18nCommon.feature.JavaScriptTemplate" },
      },
      {
        name: "csharptemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TDCodeTemplateCSharp.vue"),
        meta: { titleKey: "i18nCommon.feature.CSharpTemplate" },
      },
      {
        name: "powershelltemplate",
        component: () =>
          import("@/views/tools/codeTemplateTools/TDCodeTemplatePowerShell.vue"),
        meta: { titleKey: "i18nCommon.feature.PowerShellTemplate" },
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
        component: () => import("@/views/tools/TDBase64ToImage.vue"),
        meta: { titleKey: "i18nCommon.feature.ImageFromBase64" },
      },
      {
        name: "imagetobase64",
        component: () => import("@/views/tools/TDImageToBase64.vue"),
        meta: { titleKey: "i18nCommon.feature.ImageToBase64" },
      },
      {
        name: "colorpicker",
        component: () => import("@/views/tools/TDColorPickerFromImage.vue"),
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
        component: () => import("@/views/tools/TDCosinSimilarity.vue"),
        meta: {
          titleKey: "i18nCommon.feature.cosinSimilarity",
        },
      },
      {
        name: "vectormockgenerator",
        component: () => import("@/views/tools/TDVectorMockGenerator.vue"),
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
        name: "TDBilingualWeb",
        component: () => import("@/views/tools/TDBilingualWeb.vue"),
        meta: {
          titleKey: "i18nCommon.feature.BilingualWeb",
        },
      },
      {
        name: "TDHTMLPreview",
        component: () => import("@/views/tools/TDHTMLPreview.vue"),
        meta: { titleKey: "i18nCommon.feature.HTMLPreview" },
      },
    ],
  },
  {
    type: "route",
    name: "component-showcase",
    component: () => import("@/views/tools/TDComponentShowcase.vue"),
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
