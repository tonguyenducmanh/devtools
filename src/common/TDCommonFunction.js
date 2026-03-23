/**
 * chứa method commonfunction chuyên dùng cho các flow khác
 * mà việc inject vào global là không hợp lý
 */
class TDCommonFunction {
  /**
   * Debounce function (thuần JS)
   * 
   * CÓ 2 CÁCH SỬ DỤNG:
   * 
   * [CÁCH 1] - Dùng trong methods (KHÔNG KHUYẾN KHÍCH)
   * Tất cả instances chia sẻ cùng 1 debounce function, có thể gây conflict
   * 
   *   methods: {
   *     handleClick: _.debounce(function() {...}, 300),
   *   }
   * 
   * [CÁCH 2] - Dùng trong created() (KHUYẾN KHÍCH)
   * Mỗi instance có debounce riêng, tránh conflict
   * 
   *   created() {
   *     this.debounceHandleClick = _.debounce(this.handleClick, 300);
   *   },
   *   beforeUnmount() {
   *     if (this.debounceHandleClick?.cancel) {
   *       this.debounceHandleClick.cancel();
   *     }
   *   },
   *   methods: {
   *     handleClick() { ... }
   *   }
   *   // Template gọi: @click="debounceHandleClick"
   * 
   * @param {Function} fn - hàm cần debounce
   * @param {number} timeDelay - thời gian delay (ms)
   * @param {boolean} immediate - gọi ngay lần đầu (tuỳ chọn)
   * @returns {Function} debounced function với method .cancel()
   */
  debounce(fn, timeDelay = 300, immediate = false) {
    let timer = null;

    const debouncedFn = function (...args) {
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

    debouncedFn.cancel = function () {
      clearTimeout(timer);
      timer = null;
    };

    return debouncedFn;
  }
}

export default new TDCommonFunction();
