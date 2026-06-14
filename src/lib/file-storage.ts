// ============================================================
// Digital Garden — IndexedDB File Storage
// ============================================================
// 替代 localStorage（5MB 限制），支持大文件持久化
// 容量 ≈ 浏览器磁盘配额的 50%+（通常数百 MB）
// ============================================================

const DB_NAME = "garden-files";
const STORE_NAME = "assets";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB not available")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Store a file (as data URL) in IndexedDB */
export async function storeFile(key: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put({ key, data: dataUrl, time: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve a stored file */
export async function getFile(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

/** Delete a stored file */
export async function removeFile(key: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(key);
}

// ── Dedicated keys for persistent UI assets ──────────────

const BANNER_KEY = "ui-banner-image";
const BG_KEY = "ui-bg-image";

/** Store banner image in IndexedDB, set localStorage marker */
export async function storeBannerImage(dataUrl: string): Promise<void> {
  await storeFile(BANNER_KEY, dataUrl);
  try { localStorage.setItem("garden-banner-image", "idb:banner"); } catch {}
}

/** Load banner image from IndexedDB */
export async function loadBannerImage(): Promise<string | null> {
  return getFile(BANNER_KEY);
}

/** Remove banner image from both stores */
export async function removeBannerImage(): Promise<void> {
  await removeFile(BANNER_KEY);
  try { localStorage.removeItem("garden-banner-image"); } catch {}
}

/** Store background image in IndexedDB, set localStorage marker */
export async function storeBackgroundImage(dataUrl: string): Promise<void> {
  await storeFile(BG_KEY, dataUrl);
  try { localStorage.setItem("garden-bg-image", "idb:bg"); } catch {}
}

/** Load background image from IndexedDB */
export async function loadBackgroundImage(): Promise<string | null> {
  return getFile(BG_KEY);
}

/** Remove background image from both stores */
export async function removeBackgroundImage(): Promise<void> {
  await removeFile(BG_KEY);
  try { localStorage.removeItem("garden-bg-image"); } catch {}
}

/** Store a File object with fallback to localStorage for small files */
export async function persistFile(prefix: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const key = `${prefix}-${Date.now()}`;
      try {
        await storeFile(key, dataUrl);
        resolve(key);
      } catch {
        // Fallback: try localStorage
        try { localStorage.setItem(`garden-file-${key}`, dataUrl); resolve(key); }
        catch { reject(new Error("存储空间不足")); }
      }
    };
    reader.onerror = () => reject(new Error("读取失败"));
    reader.readAsDataURL(file);
  });
}

/** Get a persisted file by key (checks IndexedDB first, then localStorage) */
export async function loadPersistedFile(key: string): Promise<string | null> {
  const fromDB = await getFile(key);
  if (fromDB) return fromDB;
  try {
    return localStorage.getItem(`garden-file-${key}`);
  } catch { return null; }
}
