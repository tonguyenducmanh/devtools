import tdEnum from "@/common/TDEnum.js";
import tdUtility from "@/common/TDUtility.js";
import { TDCacheConfig } from "@/common/TDCacheConfig.js";
import { EnumCacheConfig } from "@/common/TDEnumCacheConfig.js";
import CryptoJS from "crypto-js";

class TDCache {
  getStorage(level) {
    switch (level) {
      case tdEnum.cacheType.session:
        return sessionStorage;
      case tdEnum.cacheType.local:
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

  set(configKey, value, params = {}, password = null) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
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

    storage.setItem(key, JSON.stringify(payload));
  }

  get(configKey, params = {}, password = null) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);
    let result = null;
    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
    const raw = storage.getItem(key);
    if (!raw) return result;

    try {
      const { data, expiredAt } = JSON.parse(raw);
      if (expiredAt && Date.now() > expiredAt) {
        storage.removeItem(key);
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
      if (result == "[]") {
        result = [];
      }
    } catch {
      result = null;
    }
    return result;
  }

  remove(configKey, params = {}) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
    storage.removeItem(key);
  }
}

export default new TDCache();
