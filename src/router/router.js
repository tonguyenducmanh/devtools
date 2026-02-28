import { createRouter, createWebHistory } from "vue-router";
import i18nData from "@/i18n/i18nData.js";

// ─── Cấu hình sidebar ─────────────────────────────────────────────────────────
// type: "group"  → nhóm nhiều tool, hiển thị tab bar khi vào
// type: "route"  → tool đơn lẻ, điều hướng trực tiếp như cũ
// hide: true     → không hiện trên sidebar (vẫn đăng ký route)

const sidebarConfig = [
  {
    type: "route",
    hide: true,
    path: "/:pathMatch(.*)*",
    pathVisible: "/",
    name: "home",
    component: () => import("@/views/misc/TDWelcome.vue"),
    meta: { titleKey: "i18nCommon.feature.welcome" },
  },
  {
    type: "route",
    hide: true,
    path: "/TDUserSettings",
    name: "TDUserSettings",
    component: () => import("@/views/misc/TDUserSettings.vue"),
    meta: { titleKey: "i18nCommon.feature.userSettings" },
  },
  {
    type: "route",
    path: "/TDOneTimePassword",
    name: "TDOneTimePassword",
    component: () => import("@/views/tools/TDOneTimePassword.vue"),
    meta: {
      titleKey: "i18nCommon.feature.oneTimePassword",
      helpKey: "i18nHelp.feature.oneTimePassword",
    },
  },
  {
    type: "group",
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
    type: "group",
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
    type: "group",
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
    ],
  },
  {
    type: "route",
    path: "/comparecode",
    name: "comparecode",
    component: () => import("@/views/tools/TDCompareCode.vue"),
    meta: { titleKey: "i18nCommon.feature.compareCode" },
  },
  {
    type: "group",
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
    type: "group",
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
  {
    type: "route",
    path: "/codeformatter",
    name: "codeformatter",
    component: () => import("@/views/tools/TDCodeFormatter.vue"),
    meta: { titleKey: "i18nCommon.feature.CodeFormatter" },
  },
  {
    type: "route",
    path: "/cosinsimilarity",
    name: "cosinsimilarity",
    component: () => import("@/views/tools/TDCosinSimilarity.vue"),
    meta: {
      titleKey: "i18nCommon.feature.cosinSimilarity",
      helpKey: "i18nHelp.feature.cosinSimilarity",
    },
  },
  {
    type: "route",
    path: "/uuidv4generator",
    name: "uuidv4generator",
    component: () => import("@/views/tools/TDUUIDv4Generator.vue"),
    meta: { titleKey: "i18nCommon.feature.UUIDV4Generator" },
  },
  {
    type: "route",
    path: "/TDHTMLPreview",
    name: "TDHTMLPreview",
    component: () => import("@/views/tools/TDHTMLPreview.vue"),
    meta: { titleKey: "i18nCommon.feature.HTMLPreview" },
  },
];

const allRoutes = sidebarConfig.flatMap((item) => {
  if (item.type === "route") {
    // Standalone: đăng ký trực tiếp (bỏ field "type", "hide")
    const { type, hide, ...routeDef } = item;
    return [routeDef];
  }

  if (item.type === "group") {
    // Group: redirect root + mỗi child dùng TDGroupView
    const firstChildFullPath = `/${item.groupPath}/${item.children[0].path}`;
    const groupRootRoute = {
      path: `/${item.groupPath}`,
      redirect: firstChildFullPath,
    };
    const childRoutes = item.children.map((child) => ({
      path: `/${item.groupPath}/${child.path}`,
      name: child.name,
      component: () => import("@/views/misc/TDGroupView.vue"),
      meta: {
        ...child.meta,
        groupKey: item.groupKey,
        groupPath: item.groupPath,
        groupTitleKey: item.groupTitleKey,
        toolPath: child.path,
      },
    }));
    return [groupRootRoute, ...childRoutes];
  }

  return [];
});

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
          groupPath: item.groupPath,
          groupTitleKey: item.groupTitleKey,
          defaultPath: `/${item.groupPath}/${item.children[0].path}`,
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
 * Dùng trong TDGroupView để lấy danh sách tabs.
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
 * Shape: { name, fullPath, meta, groupTitleKey? }
 */
export function getAllSearchableRoutes() {
  return sidebarConfig.flatMap((item) => {
    if (item.type === "group") {
      return item.children.map((child) => ({
        name: child.name,
        fullPath: `/${item.groupPath}/${child.path}`,
        meta: child.meta,
        groupTitleKey: item.groupTitleKey,
      }));
    }
    if (item.type === "route" && !item.hide) {
      return [
        {
          name: item.name,
          fullPath: item.pathVisible ?? item.path,
          meta: item.meta,
          groupTitleKey: null,
        },
      ];
    }
    return [];
  });
}
