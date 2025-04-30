class TDCache {
  // tạm thời để là local storage
  set(keyCache, value) {
    localStorage.setItem(keyCache, value);
  }

  get(keyCache) {
    return localStorage.getItem(keyCache);
  }
  remove(keyCache) {
    localStorage.removeItem(keyCache);
  }
}
export default new TDCache();
