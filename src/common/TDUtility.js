import { v4 as uuidv4 } from "uuid";

/**
 * các method TDutility dùng cho toàn bộ frontend
 * Created by tdmanh1 19.09.2024
 */
class TDUtility {
  /**
   * Thực hiện duyệt từng phần tử của bảng hoặc thuộc tính của object để call fn
   * @param {Array/Object/...} obj
   * @param {Function} fn hàm thực hiện khi for
   * Created by tdmanh1 19.09.2024
   */
  forEach(obj, fn) {
    if (obj === null || typeof obj === "undefined") {
      return;
    }

    // Force an array if not already something
    if (typeof obj !== "object") {
      obj = [obj];
    }

    if (obj instanceof Array) {
      // Duyệt từng phần tử của mảng
      for (var i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // nếu là Object thì duyệt từng thuộc tính
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }

  /**
   * hoãn việc chạy function khau khi người dùng thao tác lặp đi lặp lại liên tục
   * @param {*} func function sẽ chạy sau 1 khoảng thời gian
   * @param {*} delay thời gian delay
   * @returns
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  /**
   * định dạng ngày tháng
   */
  formatDate(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  cloneDeep(obj) {
    return structuredClone(obj);
  }

  copyToClipboard(value) {
    let me = this;
    navigator.clipboard.writeText(value);
  }

  newGuid() {
    return uuidv4();
  }
}

export default new TDUtility();
