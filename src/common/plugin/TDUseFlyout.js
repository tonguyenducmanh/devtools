import { ref } from "vue";

/**
 * Composable dùng chung cho mọi flyout-on-hover (header menu, sidebar group,
 * hoặc bất kỳ item nào sau này cần "hover vào -> hiện menu con gần đó").
 *
 * Nó CHỈ lo phần state (item nào đang mở, element nào là anchor, và grace
 * period để chuột di chuyển từ trigger sang panel mà không bị đóng giữa
 * chừng). Phần tính toán vị trí/hiển thị do <TDFlyoutPanel> đảm nhiệm.
 *
 * Cách dùng trong component:
 *
 *   setup() {
 *     return { ...useFlyout() };
 *   }
 *
 *   <div
 *     v-for="(items, key) in menuConfig"
 *     :class="{ active: activeKeyFlyOut === key }"
 *     @mouseenter="open(key, $event)"
 *     @mouseleave="scheduleCloseFlyout()"
 *   >...</div>
 *
 *   <TDFlyoutPanel
 *     :show="!!activeKeyFlyOut"
 *     :anchorElFlyout="anchorElFlyout"
 *     placement="bottom"
 *     @mouseenter="cancelCloseFlyOut"
 *     @mouseleave="scheduleCloseFlyout"
 *   >
 *     ...nội dung menu con của menuConfig[activeKeyFlyOut]...
 *   </TDFlyoutPanel>
 *
 * @param {Object} options
 * @param {number} [options.hideDelay=120] - ms trễ trước khi đóng, đủ để
 *   chuột "băng" từ trigger qua panel (panel nằm cách trigger vài px).
 */
export function useFlyout({ hideDelay = 120 } = {}) {
  const activeKeyFlyOut = ref(null);
  const anchorElFlyout = ref(null);
  let hideTimer = null;

  /** Mở flyout cho `key`, lấy `event.currentTarget` làm anchor để định vị. */
  function open(key, event) {
    clearTimeout(hideTimer);
    anchorElFlyout.value = event?.currentTarget ?? null;
    activeKeyFlyOut.value = key;
  }

  /** Lên lịch đóng sau `delay`ms (có thể bị huỷ bởi cancelCloseFlyOut). */
  function scheduleCloseFlyout(delay = hideDelay) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      activeKeyFlyOut.value = null;
    }, delay);
  }

  /** Huỷ lịch đóng đang chờ (gọi khi chuột vào trigger hoặc vào panel). */
  function cancelCloseFlyOut() {
    clearTimeout(hideTimer);
  }

  /** Đóng ngay lập tức, ví dụ sau khi user click chọn 1 item trong flyout. */
  function close() {
    clearTimeout(hideTimer);
    activeKeyFlyOut.value = null;
  }

  function isOpen(key) {
    return activeKeyFlyOut.value === key;
  }

  return {
    activeKeyFlyOut,
    anchorElFlyout,
    open,
    scheduleCloseFlyout,
    cancelCloseFlyOut,
    close,
    isOpen,
  };
}
