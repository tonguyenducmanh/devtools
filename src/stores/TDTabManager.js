/**
 * File chuyên xử lý việc mở tool thành nhiều tab
 * để user có thể handle nhiều việc cùng lúc
 */

import { reactive, markRaw } from "vue";

// biến toàn cục lưu trữ danh sách các tab đang làm việc
// thay vì dùng viewrouter render 1 trang duy nhất
const state = reactive({
  tabs: [],
  activeTabId: null,
});

let _idCounter = 0;

/**
 * tạo ra id ngẫu nhiên cho từng tab
 */
function genId() {
  return `tab-${Date.now()}-${_idCounter++}`;
}

/**
 * Hàm expose ra bên ngoài để sử dụng tab
 */
export function useTabManager() {
  /**
   * mở 1 tab mới
   */
  async function openTab({ titleKey, helpKey, groupKey, toolKey, component }) {
    const id = genId();

    // Load component trước, rồi mới push vào state
    // → khi Vue render lần đầu, resolvedComponent đã có sẵn, không có "đang tải"
    const mod = await component();
    const resolvedComponent = mod.default ?? mod;

    const tab = {
      id,
      toolKey,
      groupKey: groupKey || "",
      titleKey,
      helpKey,
      component,
      resolvedComponent: markRaw(resolvedComponent),
      // title tùy chỉnh do component emit lên, null = dùng titleKey mặc định
      customTitle: null,
    };

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
    const idx = state.tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const wasActive = state.activeTabId === id;
    state.tabs.splice(idx, 1);

    if (wasActive) {
      const next = state.tabs[idx - 1] ?? state.tabs[idx] ?? null;
      state.activeTabId = next?.id ?? null;
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
   * Nhân bản 1 tab theo id — mở tab mới với cùng component, đặt active
   * @param {string} id - id của tab cần nhân bản
   * @returns {string|null} id của tab mới, hoặc null nếu không tìm thấy
   */
  async function duplicateTab(id) {
    const source = state.tabs.find((t) => t.id === id);
    if (!source) return null;

    const newId = genId();
    const tab = {
      ...source,
      id: newId,
      customTitle: null, // reset custom title cho bản clone
    };

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
    activateTab,
    exitTabMode,
    setTabTitle,
    duplicateTab,
  };
}
