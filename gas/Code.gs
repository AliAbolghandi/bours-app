/**
 * ==========================================================================
 *  بورس اوراق بهادار ایران - موتور تحلیل تکنیکال
 *  Backend: Google Apps Script REST API
 * --------------------------------------------------------------------------
 *  این فایل تنها نقطه‌ی ارتباط بین Google Sheet (پایگاه داده‌ی خصوصی)
 *  و رابط کاربری (Frontend) است. شیت هرگز مستقیماً در دسترس کاربر نیست.
 *
 *  Endpoints:
 *    GET ?path=stocks                     -> لیست تمام نمادها
 *    GET ?path=history&ticker=XXXX         -> تاریخچه کامل کندل‌ها
 *    GET ?path=latest&ticker=XXXX          -> آخرین کندل
 * ==========================================================================
 */

// ---------------------------------------------------------------------------
// تنظیمات
// ---------------------------------------------------------------------------
var CONFIG = {
  SHEET_NAME: 'Data',           // نام شیت داده‌ی خام
  CACHE_TTL_SECONDS: 300,       // مدت کش (۵ دقیقه)
  MAX_ROWS: 200000              // سقف ایمنی برای خواندن شیت
};

var COLUMNS = [
  'Ticker', 'DTYYYYMMDD', 'FIRST', 'HIGH', 'LOW', 'CLOSE',
  'VALUE', 'VOL', 'OPENINT', 'PER', 'OPEN', 'LAST'
];

// ---------------------------------------------------------------------------
// ورودی اصلی HTTP GET
// ---------------------------------------------------------------------------
function doGet(e) {
  var path = (e && e.parameter && e.parameter.path) || '';
  var ticker = (e && e.parameter && e.parameter.ticker) || '';
  var output;

  try {
    switch (path) {
      case 'stocks':
        output = apiListStocks_();
        break;
      case 'history':
        output = apiGetHistory_(ticker);
        break;
      case 'latest':
        output = apiGetLatest_(ticker);
        break;
      default:
        output = { ok: false, error: 'مسیر نامعتبر است (path)' };
    }
  } catch (err) {
    output = { ok: false, error: String(err && err.message ? err.message : err) };
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// API: لیست نمادها
// ---------------------------------------------------------------------------
function apiListStocks_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('stocks_list');
  if (cached) return { ok: true, data: JSON.parse(cached), cached: true };

  var rows = readSheetRows_();
  var seen = {};
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    var t = rows[i].Ticker;
    if (t && !seen[t]) {
      seen[t] = true;
      list.push(t);
    }
  }
  list.sort();

  cache.put('stocks_list', JSON.stringify(list), CONFIG.CACHE_TTL_SECONDS);
  return { ok: true, data: list, cached: false };
}

// ---------------------------------------------------------------------------
// API: تاریخچه کامل یک نماد
// ---------------------------------------------------------------------------
function apiGetHistory_(ticker) {
  if (!ticker) return { ok: false, error: 'پارامتر ticker الزامی است' };

  var cacheKey = 'hist_' + ticker;
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) return { ok: true, data: JSON.parse(cached), cached: true };

  var rows = readSheetRows_();
  var candles = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Ticker === ticker) {
      candles.push(rowToCandle_(rows[i]));
    }
  }
  candles.sort(function (a, b) { return a.date - b.date; });

  var json = JSON.stringify(candles);
  // CacheService per-key limit is 100KB; skip caching if too large.
  if (json.length < 95000) cache.put(cacheKey, json, CONFIG.CACHE_TTL_SECONDS);

  return { ok: true, data: candles, cached: false };
}

// ---------------------------------------------------------------------------
// API: آخرین کندل یک نماد
// ---------------------------------------------------------------------------
function apiGetLatest_(ticker) {
  if (!ticker) return { ok: false, error: 'پارامتر ticker الزامی است' };
  var hist = apiGetHistory_(ticker);
  if (!hist.ok || !hist.data.length) {
    return { ok: false, error: 'داده‌ای برای این نماد یافت نشد' };
  }
  return { ok: true, data: hist.data[hist.data.length - 1] };
}

// ---------------------------------------------------------------------------
// خواندن خام شیت و تبدیل به آبجکت‌ها
// ---------------------------------------------------------------------------
function readSheetRows_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('شیت "' + CONFIG.SHEET_NAME + '" یافت نشد');

  var lastRow = Math.min(sheet.getLastRow(), CONFIG.MAX_ROWS);
  var lastCol = COLUMNS.length;
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    var obj = {};
    for (var c = 0; c < COLUMNS.length; c++) obj[COLUMNS[c]] = r[c];
    rows.push(obj);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// تبدیل یک ردیف خام شیت به کندل استاندارد OHLCV
// ---------------------------------------------------------------------------
function rowToCandle_(row) {
  return {
    date: Number(row.DTYYYYMMDD),      // 20260720
    open: Number(row.OPEN || row.FIRST),
    high: Number(row.HIGH),
    low: Number(row.LOW),
    close: Number(row.CLOSE),
    last: Number(row.LAST),
    value: Number(row.VALUE),
    volume: Number(row.VOL),
    openInt: Number(row.OPENINT),
    period: row.PER
  };
}
