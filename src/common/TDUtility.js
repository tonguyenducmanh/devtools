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

  /**
   * clone 1 object để tránh reference
   * @param {object} obj
   */
  cloneDeep(obj) {
    return structuredClone(obj);
  }

  /**
   * copy dữ liệu vào bộ nhớ tạm
   * @param {string} value
   */
  copyToClipboard(value) {
    let me = this;
    navigator.clipboard.writeText(value);
  }

  /**
   * tạo uuid v4 mới
   * @returns uuid
   */
  newGuid() {
    return uuidv4();
  }

  /**
   * thiết lập chủ đề giao diện ứng dụng
   * @param {string} currentTheme
   */
  setTheme(currentTheme) {
    document.body.setAttribute("data-theme", currentTheme);
  }

  /**
   * apply giá trị mock ( fake data ) cho 1 file vue, đỡ phải nhập liệu nhiều
   * @param  vm vue instance
   * @param {object} mockObj dữ liệu fake
   */
  applyMock(vm, mockObj) {
    if (vm && vm.$data && typeof vm.$data == "object" && mockObj) {
      for (const [key, value] of Object.entries(mockObj)) {
        vm.$data[key] = value;
      }
    }
  }

  getValueByPath(obj, path) {
    const regex = /(?:\[(["'])(.*?)\1\])|(?:\[(\d+)\])|(?:\.?([^.\[\]]+))/g;
    const keys = [];
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[2] !== undefined) {
        // bracket string: ["web-app"]
        keys.push(match[2]);
      } else if (match[3] !== undefined) {
        // bracket index: [0]
        keys.push(Number(match[3]));
      } else if (match[4] !== undefined) {
        // dot or bareword: .key or key
        keys.push(match[4]);
      }
    }

    return keys.reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      obj
    );
  }
}

export default new TDUtility();
