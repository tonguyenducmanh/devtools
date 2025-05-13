import tdEnum from "@/common/TDEnum.js";
import tdUtility from "@/common/TDUtility.js";
import { TDCacheConfig } from "@/common/cache/TDCacheConfig.js";
import { EnumCacheConfig } from "@/common/cache/TDEnumCacheConfig.js";
import CryptoJS from "crypto-js";

const DB_NAME = "TDCacheDB";
const STORE_NAME = "CacheStore";
const DB_VERSION = 1;

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function indexedDBSetItem(key, value) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function indexedDBGetItem(key) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function indexedDBRemoveItem(key) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

class TDCache {
  getStorage(level) {
    switch (level) {
      case tdEnum.cacheType.session:
        return sessionStorage;
      case tdEnum.cacheType.local:
        return localStorage;
      case tdEnum.cacheType.indexedDB:
        return null; // xử lý riêng bằng async
      default:
        return localStorage;
    }
  }

  getCacheConfigByKey(configKey) {
    let keyCache = tdUtility.getKeyByValue(EnumCacheConfig, configKey);
    return keyCache !== null ? TDCacheConfig[keyCache] : null;
  }

  formatKey(keyFormat, params = {}) {
    return keyFormat.replace(/\{(\w+)\}/g, (_, k) => params[k] || "");
  }

  async set(configKey, value, params = {}, password = null) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    let valueSave = value;
    if (password) {
      const valueStr =
        typeof value === "string" ? value : JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(valueStr, password).toString();
      valueSave = encrypted;
    }

    const payload = {
      data: valueSave,
      expiredAt:
        config.ExpireTime > 0 ? Date.now() + config.ExpireTime * 1000 : null,
    };

    if (config.CacheLevel === tdEnum.cacheType.indexedDB) {
      await indexedDBSetItem(key, payload);
    } else {
      const storage = this.getStorage(config.CacheLevel);
      storage.setItem(key, JSON.stringify(payload));
    }
  }

  async get(configKey, params = {}, password = null) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    let result = null;
    let raw;

    if (config.CacheLevel === tdEnum.cacheType.indexedDB) {
      raw = await indexedDBGetItem(key);
    } else {
      const storage = this.getStorage(config.CacheLevel);
      const rawStr = storage.getItem(key);
      raw = rawStr ? JSON.parse(rawStr) : null;
    }

    if (!raw) return result;

    try {
      const { data, expiredAt } = raw;
      if (expiredAt && Date.now() > expiredAt) {
        await this.remove(configKey, params);
        return result;
      }

      if (password && data) {
        const bytes = CryptoJS.AES.decrypt(data, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (decrypted) {
          result = JSON.parse(decrypted);
        }
      } else {
        result = data;
      }

      if (result == "[]") result = [];
    } catch {
      result = null;
    }

    return result;
  }

  async remove(configKey, params = {}) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    if (config.CacheLevel === tdEnum.cacheType.indexedDB) {
      await indexedDBRemoveItem(key);
    } else {
      const storage = this.getStorage(config.CacheLevel);
      storage.removeItem(key);
    }
  }
}

export default new TDCache();
