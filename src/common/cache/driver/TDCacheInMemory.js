class TDCacheInMemory {
  constructor() {}

  /**
   * @private biến chứa global data
   */
  _cacheData = {};

  setItem(key, value) {
    let me = this;
    me._cacheData[key] = value;
  }

  getItem(key) {
    let me = this;
    return me._cacheData[key];
  }

  removeItem(key) {
    let me = this;
    delete me._cacheData[key];
  }
}

export default new TDCacheInMemory();
