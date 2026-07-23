/**
 * atr.js
 * میانگین محدوده واقعی (Average True Range) - نوسان‌سنج پایه برای ATR-based ADX و ریسک.
 */
const AtrModule = (() => {

  function trueRange(candles) {
    const tr = new Array(candles.length).fill(null);
    for (let i = 0; i < candles.length; i++) {
      if (i === 0) { tr[i] = candles[i].high - candles[i].low; continue; }
      const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
      tr[i] = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    }
    return tr;
  }

  function wilderSmooth(arr, period) {
    const out = new Array(arr.length).fill(null);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      if (i < period) { sum += arr[i]; if (i === period - 1) out[i] = sum / period; continue; }
      out[i] = (out[i - 1] * (period - 1) + arr[i]) / period;
    }
    return out;
  }

  function analyze(candles, settings) {
    const period = settings.atrPeriod || 14;
    const tr = trueRange(candles);
    const atr = wilderSmooth(tr, period);
    const value = Utils.last(atr);
    const price = Utils.last(Utils.series(candles, 'close'));
    const pct = (value != null && price) ? (value / price) * 100 : null;

    let signal = 'خنثی', interpretation = 'نوسان متوسط', score = 5;
    if (pct != null) {
      if (pct > 5) { interpretation = 'نوسان بسیار بالا'; score = 2; }
      else if (pct > 3) { interpretation = 'نوسان بالا'; score = 3; }
      else if (pct < 1) { interpretation = 'نوسان پایین'; score = 5; }
      else { interpretation = 'نوسان متعادل'; score = 5; }
    }

    return {
      key: 'atr',
      title: 'ATR',
      currentValue: `${Utils.formatNumber(value)} (${Utils.formatNumber(pct)}٪)`,
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { atr, value, pct }
    };
  }

  return { analyze, trueRange, wilderSmooth };
})();
