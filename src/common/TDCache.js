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
}
export default new TDCache();
