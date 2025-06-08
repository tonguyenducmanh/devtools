class TDCacheIndexDB {
  DB_NAME = "TDCacheDB";
  STORE_NAME = "CacheStore";
  DB_VERSION = 1;

  openIndexedDB() {
    let me = this;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(me.DB_NAME, me.DB_VERSION);
      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(me.STORE_NAME)) {
          db.createObjectStore(me.STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async setItem(key, value) {
    let me = this;
    const db = await me.openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(me.STORE_NAME, "readwrite");
      const store = tx.objectStore(me.STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getItem(key) {
    let me = this;
    const db = await me.openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(me.STORE_NAME, "readonly");
      const store = tx.objectStore(me.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeItem(key) {
    let me = this;
    const db = await me.openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}
export default new TDCacheIndexDB();
