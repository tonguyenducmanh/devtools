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

  set(configKey, value, params = {}) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
    const payload = {
      value,
      expiredAt:
        config.ExpireTime > 0 ? Date.now() + config.ExpireTime * 1000 : null,
    };

    storage.setItem(key, JSON.stringify(payload));
  }

  get(configKey, params = {}) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
    const raw = storage.getItem(key);
    if (!raw) return null;

    try {
      const { value, expiredAt } = JSON.parse(raw);
      if (expiredAt && Date.now() > expiredAt) {
        storage.removeItem(key);
        return null;
      }
      if (value == "[]") {
        return [];
      }
      return value;
    } catch {
      return raw;
    }
  }

  remove(configKey, params = {}) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
    storage.removeItem(key);
  }

  setEncrypted(configKey, value, password, params = {}) {
    const config = this.getCacheConfigByKey(configKey);
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);
    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(valueStr, password).toString();
    const payload = {
      value: encrypted,
      expiredAt:
        config.ExpireTime > 0 ? Date.now() + config.ExpireTime * 1000 : null,
    };
    storage.setItem(key, JSON.stringify(payload));
  }

  getEncrypted(configKey, password, params = {}) {
    const config = this.getCacheConfigByKey(configKey);
    let result = null;
    if (!config) throw new Error(`Không tìm thấy cấu hình cache: ${configKey}`);

    const key = this.formatKey(config.KeyFormat, params);
    const storage = this.getStorage(config.CacheLevel);
    const encrypted = storage.getItem(key);
    if (!encrypted) return result;

    try {
      const { value, expiredAt } = JSON.parse(encrypted);
      if (expiredAt && Date.now() > expiredAt) {
        storage.removeItem(key);
        return result;
      }
      if (value) {
        const bytes = CryptoJS.AES.decrypt(value, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        result = JSON.parse(decrypted);
        if (result == "[]") {
          result = [];
        }
      }
    } catch (e) {
      console.error("Lỗi giải mã: Sai mật khẩu hoặc dữ liệu lỗi", e);
      return result;
    }
    return result;
  }
}

export default new TDCache();
