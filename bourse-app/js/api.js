/**
 * api.js
 * لایه‌ی اتصال کامل لوکال به پوشه‌ی sahm — بدون هیچ بک‌اند یا شبکه‌ای.
 *
 * در مرورگرهای پشتیبان (Chrome/Edge/Opera) از File System Access API
 * استفاده می‌شود: کاربر یک‌بار پوشه‌ی sahm را انتخاب می‌کند، دسترسی در
 * IndexedDB ذخیره می‌شود و در بازدیدهای بعدی به‌صورت خودکار (یا با یک
 * تأیید کوچک) دوباره وصل می‌شود.
 *
 * در مرورگرهایی که این API را ندارند (Safari/Firefox)، به‌صورت خودکار
 * روی انتخاب پوشه با <input type="file" webkitdirectory> سوییچ می‌شود؛
 * تفاوت فقط این است که در آن مرورگرها باید هر بار پوشه دوباره انتخاب شود.
 */
const Api = (() => {
  const DB_NAME = 'bourseFsDB';
  const STORE = 'handles';
  const HANDLE_KEY = 'sahmFolder';

  let dirHandle = null;
  let memory = {};     // ticker -> candles[]
  let fileCount = 0;

  const supportsFsAccess = typeof window.showDirectoryPicker === 'function';

  // ---- ذخیره‌ی دسته (handle) پوشه در IndexedDB --------------------------
  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveHandle(handle) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadHandle() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // ---- خواندن و تجمیع فایل‌های CSV --------------------------------------
  function groupToTickers(grouped) {
    const result = {};
    Object.keys(grouped).forEach(t => { result[t] = CsvParser.rowsToCandles(grouped[t]); });
    return result;
  }

  async function scanDirectoryHandle(handle) {
    const grouped = {};
    let count = 0;
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind === 'file' && name.toLowerCase().endsWith('.csv')) {
        const file = await entry.getFile();
        const text = await file.text();
        const rows = CsvParser.parse(text);
        rows.forEach(r => {
          if (!grouped[r.Ticker]) grouped[r.Ticker] = [];
          grouped[r.Ticker].push(r);
        });
        count++;
      }
    }
    return { result: groupToTickers(grouped), count };
  }

  async function scanFileList(fileList) {
    const files = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.csv'));
    const grouped = {};
    for (const file of files) {
      const text = await file.text();
      const rows = CsvParser.parse(text);
      rows.forEach(r => {
        if (!grouped[r.Ticker]) grouped[r.Ticker] = [];
        grouped[r.Ticker].push(r);
      });
    }
    return { result: groupToTickers(grouped), count: files.length };
  }

  // ---- Fallback با <input webkitdirectory> برای مرورگرهای بدون FS Access ----
  function pickFolderFallback() {
    return new Promise((resolve, reject) => {
      let input = document.getElementById('fsFallbackInput');
      if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'fsFallbackInput';
        input.webkitdirectory = true;
        input.multiple = true;
        input.style.display = 'none';
        document.body.appendChild(input);
      }
      input.value = '';
      input.onchange = () => {
        if (input.files && input.files.length) resolve(input.files);
        else reject(new Error('پوشه‌ای انتخاب نشد'));
      };
      input.click();
    });
  }

  // ---- API عمومی ---------------------------------------------------------
  async function scan() {
    if (!dirHandle) throw new Error('هیچ پوشه‌ای متصل نیست');
    const { result, count } = await scanDirectoryHandle(dirHandle);
    memory = result;
    fileCount = count;
  }

  async function connectFileList(fileList) {
    const { result, count } = await scanFileList(fileList);
    memory = result;
    fileCount = count;
  }

  async function connectFolder() {
    if (supportsFsAccess) {
      const handle = await window.showDirectoryPicker();
      dirHandle = handle;
      await saveHandle(handle);
      await scan();
      return;
    }
    const files = await pickFolderFallback();
    await connectFileList(files);
  }

  /** تلاش خاموش برای اتصال به آخرین پوشه‌ی مجازشده، بدون نیاز به کلیک کاربر */
  async function tryAutoConnect() {
    if (!supportsFsAccess) return { ok: false, hasHandle: false };
    try {
      const handle = await loadHandle();
      if (!handle) return { ok: false, hasHandle: false };
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm === 'granted') {
        dirHandle = handle;
        await scan();
        return { ok: true, hasHandle: true };
      }
      dirHandle = handle; // برای درخواست مجوز مجدد نگه داشته می‌شود
      return { ok: false, hasHandle: true };
    } catch (e) {
      return { ok: false, hasHandle: false };
    }
  }

  async function requestPermissionAgain() {
    if (!dirHandle) throw new Error('دسته‌ی پوشه یافت نشد؛ لطفاً دوباره پوشه را انتخاب کنید');
    const perm = await dirHandle.requestPermission({ mode: 'read' });
    if (perm !== 'granted') throw new Error('دسترسی به پوشه رد شد');
    await scan();
  }

  function isConnected() { return Object.keys(memory).length > 0; }
  function getFileCount() { return fileCount; }
  function getTickerCount() { return Object.keys(memory).length; }
  function getStocks() { return Object.keys(memory).sort(); }
  function getHistory(ticker) { return memory[ticker] || []; }
  function getLatest(ticker) { const h = memory[ticker]; return h && h.length ? h[h.length - 1] : null; }
  function clearCache() { /* داده همیشه مستقیم از دیسک خوانده می‌شود؛ کش جداگانه‌ای نیست */ }

  return {
    supportsFsAccess,
    connectFolder, connectFileList, tryAutoConnect, requestPermissionAgain, scan,
    isConnected, getFileCount, getTickerCount,
    getStocks, getHistory, getLatest, clearCache
  };
})();
