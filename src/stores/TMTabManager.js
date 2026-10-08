/**
 * File chuyên xử lý việc mở tool thành nhiều tab
 * để user có thể handle nhiều việc cùng lúc
 */

import { reactive, markRaw } from "vue";
import tmUtility from "@/common/TMUtility.js";

// biến toàn cục lưu trữ danh sách các tab đang làm việc
// thay vì dùng viewrouter render 1 trang duy nhất
const state = reactive({
  tabs: [],
  activeTabId: null,
});

/**
 * tạo ra id ngẫu nhiên cho từng tab
 */
function genId(mod) {
  let result = "";
  let idForNewTab = tmUtility.newGuid();
  if (mod && mod.default && mod.default.name) {
    result = `${mod.default.name}-${idForNewTab}`;
  } else {
    result = idForNewTab;
  }
  return result;
}

/**
 * Hàm expose ra bên ngoài để sử dụng tab
 */
export function useTabManager() {
  /**
   * mở 1 tab mới
   */
  async function openTab({
    titleKey,
    helpKey,
    groupKey,
    toolKey,
    component,
    checkExisting = true,
  }) {
    if (checkExisting && toolKey) {
      const existingTab = state.tabs.find((t) => t.toolKey === toolKey);
      if (existingTab) {
        state.activeTabId = existingTab.id;
        return existingTab.id;
      }
    }
    const mod = await component();

    const id = genId(mod);

    const tab = {
      id,
      toolKey,
      groupKey: groupKey || "",
      titleKey,
      helpKey,
      component,
      resolvedComponent: null,
      customTitle: null,
    };

    tab.resolvedComponent = markRaw(mod.default ?? mod);
    state.tabs.push(tab);
    state.activeTabId = id;

    return id;
  }

  /**
   * Cập nhật tiêu đề tab do component con emit lên.
   * @param {string} id        - id của tab cần cập nhật
   * @param {string|null} title - tiêu đề mới; null để reset về mặc định
   */
  function setTabTitle(id, title) {
    const tab = state.tabs.find((t) => t.id === id);
    if (!tab) return;
    tab.customTitle = title ?? null;
  }

  /**
   * đóng 1 tab theo id
   */
  function closeTab(id) {
    closeTabs([id]);
  }

  /**
   * Đóng nhiều tab cùng lúc theo danh sách id.
   * Nếu tab đang active nằm trong danh sách đóng thì chuyển sang tab còn lại
   * gần nhất (ưu tiên tab bên trái, không có thì lấy tab bên phải) — giống hành vi
   * của closeTab nhưng chỉ set active 1 lần cho cả lô.
   * @param {string[]} ids - danh sách id tab cần đóng
   */
  function closeTabs(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const idSet = new Set(ids);
    if (!state.tabs.some((t) => idSet.has(t.id))) return;

    const activeIndex = state.tabs.findIndex((t) => t.id === state.activeTabId);
    const activeWillBeClosed = idSet.has(state.activeTabId);

    // chốt lại tab sẽ được active sau khi đóng, tìm trong danh sách cũ
    let nextActiveId = null;
    if (activeWillBeClosed) {
      for (let i = activeIndex - 1; i >= 0; i--) {
        if (!idSet.has(state.tabs[i].id)) {
          nextActiveId = state.tabs[i].id;
          break;
        }
      }
      if (!nextActiveId) {
        for (let i = activeIndex + 1; i < state.tabs.length; i++) {
          if (!idSet.has(state.tabs[i].id)) {
            nextActiveId = state.tabs[i].id;
            break;
          }
        }
      }
    }

    state.tabs = state.tabs.filter((t) => !idSet.has(t.id));

    if (activeWillBeClosed) {
      state.activeTabId = nextActiveId;
    }
  }

  /**
   * set trạng thái của tab hiện tại là active để show cho user thấy
   */
  function activateTab(id) {
    state.activeTabId = id;
  }

  /**
   * Dọn dữ liệu và thoát chế độ luôn
   */
  function exitTabMode() {
    state.tabs.splice(0, state.tabs.length);
    state.activeTabId = null;
  }

  /**
   * Tải component lazy của một tab
   */
  async function resolveTabComponent(id) {
    const tab = state.tabs.find((t) => t.id === id);
    if (!tab || tab.resolvedComponent) return;

    try {
      const mod = await tab.component();
      tab.resolvedComponent = markRaw(mod.default ?? mod);
    } catch (e) {
      console.error("Failed to load component for tab", tab, e);
    }
  }

  /**
   * Nhân bản 1 tab theo id — mở tab mới với cùng component, đặt active
   * @param {string} id - id của tab cần nhân bản
   * @returns {string|null} id của tab mới, hoặc null nếu không tìm thấy
   */
  async function duplicateTab(id) {
    const source = state.tabs.find((t) => t.id === id);
    if (!source) return null;

    const mod = await source.component();

    const newId = genId(mod);
    const tab = {
      ...source,
      id: newId,
      customTitle: null, // reset custom title cho bản clone
      resolvedComponent: null, // Clone bắt buộc tải lại/đợi render để mount cái mới
    };

    tab.resolvedComponent = markRaw(mod.default ?? mod);

    // Chèn ngay sau tab gốc
    const idx = state.tabs.findIndex((t) => t.id === id);
    state.tabs.splice(idx + 1, 0, tab);
    state.activeTabId = newId;

    return newId;
  }

  return {
    state,
    openTab,
    closeTab,
    closeTabs,
    activateTab,
    exitTabMode,
    setTabTitle,
    duplicateTab,
    resolveTabComponent,
  };
}
