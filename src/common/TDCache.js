import CryptoJS from "crypto-js";

class TDCache {
  // tạm thời để là local storage
  set(keyCache, value) {
    let valueSet = typeof value == "string" ? value : JSON.stringify(value);
    localStorage.setItem(keyCache, valueSet);
  }

  get(keyCache) {
    let cacheValue = localStorage.getItem(keyCache);
    try {
      return JSON.parse(cacheValue);
    } catch (error) {
      return cacheValue;
    }
  }
  remove(keyCache) {
    localStorage.removeItem(keyCache);
  }
  setWithPassword(keyCache, value, password) {
    let valueSet = typeof value == "string" ? value : JSON.stringify(value);
    let encrypted = CryptoJS.AES.encrypt(valueSet, password).toString();
    localStorage.setItem(keyCache, encrypted);
  }
  getWithPassword(keyCache, password) {
    const encrypted = localStorage.getItem(keyCache);
    if (!encrypted) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, password);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error("Wrong password or corrupted data", e);
      return null;
    }
  }
}
export default new TDCache();
