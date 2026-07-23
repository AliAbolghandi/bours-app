/**
 * bollinger.js
 * باندهای بولینگر (Bollinger Bands).
 */
const BollingerModule = (() => {

  function analyze(candles, settings) {
    const close = Utils.series(candles, 'close');
    const period = (settings.bollinger && settings.bollinger.period) || 20;
    const mult = (settings.bollinger && settings.bollinger.mult) || 2;

    const mid = Utils.sma(close, period);
    const dev = Utils.stdev(close, period);
    const upper = mid.map((m, i) => (m != null && dev[i] != null) ? m + mult * dev[i] : null);
    const lower = mid.map((m, i) => (m != null && dev[i] != null) ? m - mult * dev[i] : null);

    const price = Utils.last(close);
    const vUpper = Utils.last(upper);
    const vLower = Utils.last(lower);
    const vMid = Utils.last(mid);
    const bandwidth = (vUpper != null && vLower != null && vMid) ? ((vUpper - vLower) / vMid) * 100 : null;

    let signal = 'خنثی', interpretation = 'داخل باند', score = 5;
    if (price != null && vUpper != null && vLower != null) {
      if (price >= vUpper) { signal = 'فروش'; interpretation = 'برخورد با باند بالایی (اشباع خرید احتمالی)'; score = 3; }
      else if (price <= vLower) { signal = 'خرید'; interpretation = 'برخورد با باند پایینی (اشباع فروش احتمالی)'; score = 8; }
      else if (price > vMid) { signal = 'خرید'; interpretation = 'بالای میانه باند'; score = 7; }
      else { signal = 'فروش'; interpretation = 'زیر میانه باند'; score = 4; }
    }

    return {
      key: 'bollinger',
      title: 'باند بولینگر',
      currentValue: `پایین: ${Utils.formatNumber(vLower)} | میانه: ${Utils.formatNumber(vMid)} | بالا: ${Utils.formatNumber(vUpper)}`,
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { upper, mid, lower, bandwidth }
    };
  }

  return { analyze };
})();
