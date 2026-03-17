/**
 * chứa method commonfunction chuyên dùng cho các flow khác
 * mà việc inject vào global là không hợp lý
 */
class TDCommonFunction {
  /**
   * Debounce function (thuần JS)
   * @param {Function} fn - hàm cần debounce
   * @param {number} timeDelay - thời gian delay (ms)
   * @param {boolean} immediate - gọi ngay lần đầu (tuỳ chọn)
   */
  debounce(fn, timeDelay = 300, immediate = false) {
    let timer = null;

    return function (...args) {
      const context = this;

      const callNow = immediate && !timer;

      clearTimeout(timer);

      timer = setTimeout(() => {
        timer = null;
        if (!immediate) {
          fn.apply(context, args);
        }
      }, timeDelay);

      if (callNow) {
        fn.apply(context, args);
      }
    };
  }
}

export default new TDCommonFunction();
