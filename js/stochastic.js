/**
 * stochastic.js
 * نوسان‌ساز استوکاستیک (%K و %D).
 */
const StochasticModule = (() => {

  function analyze(candles, settings) {
    const period = (settings.stochastic && settings.stochastic.period) || 14;
    const smoothD = (settings.stochastic && settings.stochastic.d) || 3;

    const high = Utils.series(candles, 'high');
    const low = Utils.series(candles, 'low');
    const close = Utils.series(candles, 'close');

    const hh = Utils.highest(high, period);
    const ll = Utils.lowest(low, period);

    const k = close.map((c, i) => {
      if (hh[i] == null || ll[i] == null || hh[i] === ll[i]) return null;
      return ((c - ll[i]) / (hh[i] - ll[i])) * 100;
    });
    const filledK = k.map(v => v == null ? 0 : v);
    const d = Utils.sma(filledK, smoothD).map((v, i) => k[i] == null ? null : v);

    const vK = Utils.last(k);
    const vD = Utils.last(d);

    let signal = 'خنثی', interpretation = 'محدوده متعادل', score = 5;
    if (vK != null && vD != null) {
      if (vK >= 80) { signal = 'فروش'; interpretation = 'اشباع خرید'; score = 3; }
      else if (vK <= 20) { signal = 'خرید'; interpretation = 'اشباع فروش'; score = 8; }
      else if (vK > vD) { signal = 'خرید'; interpretation = '%K بالای %D'; score = 7; }
      else { signal = 'فروش'; interpretation = '%K زیر %D'; score = 4; }
    }

    return {
      key: 'stochastic',
      title: 'استوکاستیک',
      currentValue: `%K: ${Utils.formatNumber(vK)} | %D: ${Utils.formatNumber(vD)}`,
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { k, d }
    };
  }

  return { analyze };
})();
