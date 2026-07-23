/**
 * utils.js
 * توابع کمکی مشترک: میانگین‌ها، ابزارهای آماری، قالب‌بندی فارسی و اعداد.
 * تمام ماژول‌های تحلیلی از این فایل برای جلوگیری از تکرار کد استفاده می‌کنند.
 */
const Utils = (() => {

  // ---- ریاضی پایه --------------------------------------------------------
  const sma = (arr, period) => {
    const out = new Array(arr.length).fill(null);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
      if (i >= period) sum -= arr[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  };

  const ema = (arr, period) => {
    const out = new Array(arr.length).fill(null);
    const k = 2 / (period + 1);
    let prev = null;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == null) continue;
      if (prev === null) {
        // seed با SMA اولین period
        if (i >= period - 1) {
          let s = 0;
          for (let j = i - period + 1; j <= i; j++) s += arr[j];
          prev = s / period;
          out[i] = prev;
        }
      } else {
        prev = arr[i] * k + prev * (1 - k);
        out[i] = prev;
      }
    }
    return out;
  };

  const stdev = (arr, period) => {
    const out = new Array(arr.length).fill(null);
    for (let i = period - 1; i < arr.length; i++) {
      const slice = arr.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
      out[i] = Math.sqrt(variance);
    }
    return out;
  };

  const highest = (arr, period) => {
    const out = new Array(arr.length).fill(null);
    for (let i = period - 1; i < arr.length; i++) {
      out[i] = Math.max(...arr.slice(i - period + 1, i + 1));
    }
    return out;
  };

  const lowest = (arr, period) => {
    const out = new Array(arr.length).fill(null);
    for (let i = period - 1; i < arr.length; i++) {
      out[i] = Math.min(...arr.slice(i - period + 1, i + 1));
    }
    return out;
  };

  const change = (arr) => {
    const out = new Array(arr.length).fill(null);
    for (let i = 1; i < arr.length; i++) out[i] = arr[i] - arr[i - 1];
    return out;
  };

  const last = (arr) => {
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return arr[i];
    return null;
  };

  const round = (n, d = 2) => (n == null || isNaN(n)) ? null : Number(n.toFixed(d));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // ---- قالب‌بندی فارسی -----------------------------------------------------
  const faDigits = (str) => String(str).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  const formatNumber = (n) => {
    if (n == null || isNaN(n)) return '—';
    return faDigits(Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }));
  };

  const formatToman = (n) => n == null ? '—' : formatNumber(Math.round(n)) + ' ریال';

  const formatPercent = (n) => n == null ? '—' : faDigits(Number(n).toFixed(1)) + '٪';

  const formatJalaliFromYYYYMMDD = (yyyymmdd) => {
    // ورودی مانند 20260720 (شمسی ذخیره‌شده در شیت) -> نمایش با جداکننده
    const s = String(yyyymmdd);
    return faDigits(`${s.slice(0, 4)}/${s.slice(4, 6)}/${s.slice(6, 8)}`);
  };

  // ---- استخراج سری از کندل‌ها ----------------------------------------------
  const series = (candles, key) => candles.map(c => c[key]);

  return {
    sma, ema, stdev, highest, lowest, change, last, round, clamp,
    faDigits, formatNumber, formatToman, formatPercent, formatJalaliFromYYYYMMDD,
    series
  };
})();
