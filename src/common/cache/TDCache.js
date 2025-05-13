import tdEnum from "@/common/TDEnum.js";
import tdUtility from "@/common/TDUtility.js";
import { TDCacheConfig } from "@/common/cache/TDCacheConfig.js";
import { EnumCacheConfig } from "@/common/cache/TDEnumCacheConfig.js";
import CryptoJS from "crypto-js";
import memoryStorage from "@/common/cache/driver/TDCacheInMemory.js";
import indexDBStorage from "@/common/cache/driver/TDCacheIndexDB.js";

class TDCache {
  /**
   * danh sách các loại cache không cần phải serialize
   */
  _typeCacheNotSerialize = [
    tdEnum.cacheType.indexedDB,
    tdEnum.cacheType.inMemory,
  ];

  getStorage(level) {
    switch (level) {
      case tdEnum.cacheType.session:
        return sessionStorage;
      case tdEnum.cacheType.local:
        return localStorage;
      case tdEnum.cacheType.indexedDB:
        return indexDBStorage; // xử lý riêng bằng async
      case tdEnum.cacheType.inMemory:
        return memoryStorage;
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
    const storage = this.getStorage(config.CacheLevel);
    if (this._typeCacheNotSerialize.includes(config.CacheLevel)) {
      await storage.setItem(key, payload);
    } else {
      await storage.setItem(key, JSON.stringify(payload));
    }
  }

  async get(configKey, params = {}, password = null) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    let result = null;
    let raw;

    const storage = this.getStorage(config.CacheLevel);
    if (this._typeCacheNotSerialize.includes(config.CacheLevel)) {
      raw = await storage.getItem(key);
    } else {
      const rawStr = await storage.getItem(key);
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
    const storage = this.getStorage(config.CacheLevel);
    await storage.removeItem(key);
  }
}

export default new TDCache();
