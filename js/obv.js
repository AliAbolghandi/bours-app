/**
 * obv.js
 * حجم تعادلی (On-Balance Volume) - پایه‌ی تحلیل پول هوشمند.
 */
const ObvModule = (() => {

  function computeObv(candles) {
    const obv = new Array(candles.length).fill(0);
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].close > candles[i - 1].close) obv[i] = obv[i - 1] + candles[i].volume;
      else if (candles[i].close < candles[i - 1].close) obv[i] = obv[i - 1] - candles[i].volume;
      else obv[i] = obv[i - 1];
    }
    return obv;
  }

  function analyze(candles) {
    const obv = computeObv(candles);
    const obvMa = Utils.sma(obv, 20);
    const value = Utils.last(obv);
    const ma = Utils.last(obvMa);

    let signal = 'خنثی', interpretation = 'بدون سیگنال واضح', score = 5;
    if (value != null && ma != null) {
      if (value > ma) { signal = 'خرید'; interpretation = 'OBV بالای میانگین (تجمیع خرید)'; score = 7; }
      else { signal = 'فروش'; interpretation = 'OBV زیر میانگین (تجمیع فروش)'; score = 4; }
    }

    return {
      key: 'obv',
      title: 'OBV',
      currentValue: Utils.formatNumber(value),
      interpretation,
      signal,
      weight: 3,
      score: Math.round(score * 0.4),
      maxScore: 3,
      raw: { obv, value }
    };
  }

  return { analyze, computeObv };
})();
