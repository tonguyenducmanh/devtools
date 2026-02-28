import { createRouter, createWebHistory } from "vue-router";
import i18nData from "@/i18n/i18nData.js";

/**
 * Định nghĩa các group và tool con.
 * Path tool con sẽ là: /<groupPath>/<toolPath>
 */
const groupConfig = [
  {
    groupKey: "qrcode",
    groupPath: "qrcode",
    groupTitleKey: "i18nCommon.group.QRCode",
    children: [
      {
        path: "textoqrcode",
        name: "textoqrcode",
        component: () => import("@/views/tools/TDTextToQRCode.vue"),
        meta: {
          titleKey: "i18nCommon.feature.QRCodeFromText",
          helpKey: "i18nHelp.feature.QRCodeFromText",
        },
      },
      {
        path: "qrcodetotext",
        name: "qrcodetotext",
        component: () => import("@/views/tools/TDQRCodeToText.vue"),
        meta: {
          titleKey: "i18nCommon.feature.QRCodeToText",
          helpKey: "i18nHelp.feature.QRCodeToText",
        },
      },
    ],
  },
  {
    groupKey: "api",
    groupPath: "api",
    groupTitleKey: "i18nCommon.group.API",
    children: [
      {
        path: "testing",
        name: "apitesting",
        component: () => import("@/views/tools/APITesting/TDAPITesting.vue"),
        meta: {
          titleKey: "i18nCommon.feature.APITesting",
          helpKey: "i18nHelp.feature.APITesting",
        },
      },
      {
        path: "mocking",
        name: "apimocking",
        component: () => import("@/views/tools/TDAPIMocking.vue"),
        meta: {
          titleKey: "i18nCommon.feature.APIMocking",
          helpKey: "i18nHelp.feature.APIMocking",
        },
      },
      {
        path: "dataminer",
        name: "appdataminer",
        component: () => import("@/views/tools/TDAppDataMiner.vue"),
        meta: {
          titleKey: "i18nCommon.feature.AppDataMiner",
          helpKey: "i18nHelp.feature.AppDataMiner",
        },
      },
    ],
  },
  {
    groupKey: "json",
    groupPath: "json",
    groupTitleKey: "i18nCommon.group.JSON",
    children: [
      {
        path: "topostgresql",
        name: "jsontopostgresql",
        component: () => import("@/views/tools/TDJSONToPostgreSQL.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToPostgreSQL" },
      },
      {
        path: "toexcel",
        name: "jsontoexcel",
        component: () => import("@/views/tools/TDJSONToExcel.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONToExcel" },
      },
      {
        path: "mapping",
        name: "mappingjson",
        component: () => import("@/views/tools/TDMappingJSON.vue"),
        meta: { titleKey: "i18nCommon.feature.JSONMapping" },
      },
    ],
  },
  {
    groupKey: "image",
    groupPath: "image",
    groupTitleKey: "i18nCommon.group.Image",
    children: [
      {
        path: "base64toimage",
        name: "base64toimage",
        component: () => import("@/views/tools/TDBase64ToImage.vue"),
        meta: { titleKey: "i18nCommon.feature.ImageFromBase64" },
      },
      {
        path: "imagetobase64",
        name: "imagetobase64",
        component: () => import("@/views/tools/TDImageToBase64.vue"),
        meta: { titleKey: "i18nCommon.feature.ImageToBase64" },
      },
      {
        path: "colorpicker",
        name: "colorpicker",
        component: () => import("@/views/tools/TDColorPicker.vue"),
        meta: { titleKey: "i18nCommon.feature.colorPicker" },
      },
    ],
  },
  {
    groupKey: "text",
    groupPath: "text",
    groupTitleKey: "i18nCommon.group.Text",
    children: [
      {
        path: "compress",
        name: "TDTextCompress",
        component: () => import("@/views/tools/TDTextCompress.vue"),
        meta: { titleKey: "i18nCommon.feature.textCompress" },
      },
      {
        path: "manipulation",
        name: "TDTextManipulation",
        component: () => import("@/views/tools/TDTextManipulation.vue"),
        meta: {
          titleKey: "i18nCommon.feature.textManipulation",
          helpKey: "i18nHelp.feature.textManipulation",
        },
      },
      {
        path: "generator",
        name: "textgenerator",
        component: () => import("@/views/tools/TDTextGenerator.vue"),
        meta: { titleKey: "i18nCommon.feature.textgenerator" },
      },
    ],
  },
];

/** Các route standalone (không thuộc group nào) */
const standaloneRoutes = [
  {
    path: "/:pathMatch(.*)*",
    pathVisible: "/",
    name: "home",
    component: () => import("@/views/misc/TDWelcome.vue"),
    meta: { titleKey: "i18nCommon.feature.welcome" },
    hide: true,
  },
  {
    path: "/TDUserSettings",
    name: "TDUserSettings",
    component: () => import("@/views/misc/TDUserSettings.vue"),
    meta: { titleKey: "i18nCommon.feature.userSettings" },
    hide: true,
  },
  {
    path: "/comparecode",
    name: "comparecode",
    component: () => import("@/views/tools/TDCompareCode.vue"),
    meta: { titleKey: "i18nCommon.feature.compareCode" },
  },
  {
    path: "/codeformatter",
    name: "codeformatter",
    component: () => import("@/views/tools/TDCodeFormatter.vue"),
    meta: { titleKey: "i18nCommon.feature.CodeFormatter" },
  },
  {
    path: "/cosinsimilarity",
    name: "cosinsimilarity",
    component: () => import("@/views/tools/TDCosinSimilarity.vue"),
    meta: {
      titleKey: "i18nCommon.feature.cosinSimilarity",
      helpKey: "i18nHelp.feature.cosinSimilarity",
    },
  },
  {
    path: "/downloadvscodeext",
    name: "downloadvscodeext",
    component: () => import("@/views/tools/TDDownloadVSCodeExt.vue"),
    meta: { titleKey: "i18nCommon.feature.DownloadVSCodeExtension" },
  },
  {
    path: "/uuidv4generator",
    name: "uuidv4generator",
    component: () => import("@/views/tools/TDUUIDv4Generator.vue"),
    meta: { titleKey: "i18nCommon.feature.UUIDV4Generator" },
  },
  {
    path: "/TDOneTimePassword",
    name: "TDOneTimePassword",
    component: () => import("@/views/tools/TDOneTimePassword.vue"),
    meta: {
      titleKey: "i18nCommon.feature.oneTimePassword",
      helpKey: "i18nHelp.feature.oneTimePassword",
    },
  },
  {
    path: "/TDHTMLPreview",
    name: "TDHTMLPreview",
    component: () => import("@/views/tools/TDHTMLPreview.vue"),
    meta: { titleKey: "i18nCommon.feature.HTMLPreview" },
  },
];

// ─── Build flat route list cho vue-router ────────────────────────────────────
// Mỗi group sinh ra:
//   /groupPath            → redirect sang child đầu tiên
//   /groupPath/toolPath   → TDGroupView (wrapper chứa tab bar + lazy component)

const groupRoutes = groupConfig.flatMap((group) => {
  const firstChildFullPath = `/${group.groupPath}/${group.children[0].path}`;

  const groupRootRoute = {
    path: `/${group.groupPath}`,
    redirect: firstChildFullPath,
  };

  const childRoutes = group.children.map((child) => ({
    path: `/${group.groupPath}/${child.path}`,
    name: child.name,
    // TDGroupView là wrapper dùng chung cho mọi tool trong group
    component: () => import("@/components/TDGroupView.vue"),
    meta: {
      ...child.meta,
      groupKey: group.groupKey,
      groupPath: group.groupPath,
      groupTitleKey: group.groupTitleKey,
      toolPath: child.path, // để TDGroupView xác định tab active
    },
  }));

  return [groupRootRoute, ...childRoutes];
});

const allRoutes = [...standaloneRoutes, ...groupRoutes];

// ─── Router instance ──────────────────────────────────────────────────────────

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: allRoutes,
});

router.beforeEach((to, from, next) => {
  const appName = window.__env.appName;
  if (to?.meta?.titleKey && i18nData.global.te(to.meta.titleKey)) {
    document.title = i18nData.global.t(to.meta.titleKey);
  } else if (appName) {
    document.title = `${window.__env.author} | ${appName}`;
  }
  next();
});

export default router;

// ─── Helpers export ───────────────────────────────────────────────────────────

/**
 * Trả về danh sách items cho sidebar:
 * - Group → 1 item (không expand, chỉ hiện tên)
 * - Standalone → 1 item như cũ
 */
export function getSidebarItems() {
  const groupItems = groupConfig.map((group) => ({
    type: "group",
    groupKey: group.groupKey,
    groupPath: group.groupPath,
    groupTitleKey: group.groupTitleKey,
    // Navigate tới tool đầu tiên khi click group
    defaultPath: `/${group.groupPath}/${group.children[0].path}`,
  }));

  const standaloneItems = standaloneRoutes
    .filter((r) => !r.hide)
    .map((r) => ({ type: "route", route: r }));

  return [...groupItems, ...standaloneItems];
}

/**
 * Trả về toàn bộ config của 1 group theo groupKey
 * Dùng trong TDGroupView để lấy danh sách tabs
 */
export function getGroupConfig(groupKey) {
  return groupConfig.find((g) => g.groupKey === groupKey) ?? null;
}
