import tdEnum from "@/common/TDEnum.js";
import tdUtility from "@/common/TDUtility.js";
import { TDCacheConfig } from "@/common/cache/TDCacheConfig.js";
import { EnumCacheConfig } from "@/common/cache/TDEnumCacheConfig.js";
import memoryStorage from "@/common/cache/driver/TDCacheInMemory.js";
import indexDBStorage from "@/common/cache/driver/TDCacheIndexDB.js";

/* =======================
 * Web Crypto helpers
 * ======================= */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptAES(plainText, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plainText)
  );

  return JSON.stringify({
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted),
  });
}

async function decryptAES(cipherText, password) {
  const payload = JSON.parse(cipherText);

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const data = base64ToBuffer(payload.data);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return textDecoder.decode(decrypted);
}

/* =======================
 * TDCache
 * ======================= */

class TDCache {
  /**
   * danh sách các loại cache không cần serialize
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
        return indexDBStorage;
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

      valueSave = await encryptAES(valueStr, password);
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

    if (!raw) return null;

    try {
      const { data, expiredAt } = raw;

      if (expiredAt && Date.now() > expiredAt) {
        await this.remove(configKey, params);
        return null;
      }

      if (password && data) {
        const decrypted = await decryptAES(data, password);
        result = JSON.parse(decrypted);
      } else {
        result = data;
      }

      if (result === "[]") result = [];
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
