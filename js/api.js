/**
 * api.js
 * تنها لایه‌ی ارتباطی با Backend (Google Apps Script Web App).
 * فرانت‌اند هرگز مستقیماً به Google Sheet دسترسی ندارد.
 */
const Api = (() => {

  // آدرس دیپلوی Web App خود را اینجا جایگزین کنید
  // Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone
  const BASE_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

  const _cache = new Map();

  async function _request(path, params = {}) {
    const qs = new URLSearchParams({ path, ...params }).toString();
    const cacheKey = qs;
    if (_cache.has(cacheKey)) return _cache.get(cacheKey);

    const url = `${BASE_URL}?${qs}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('خطا در ارتباط با سرور: ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'خطای نامشخص سرور');

    _cache.set(cacheKey, json.data);
    return json.data;
  }

  const getStocks = () => _request('stocks');
  const getHistory = (ticker) => _request('history', { ticker });
  const getLatest = (ticker) => _request('latest', { ticker });

  const clearCache = () => _cache.clear();

  return { getStocks, getHistory, getLatest, clearCache };
})();
