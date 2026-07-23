/**
 * ema.js
 * میانگین متحرک نمایی (EMA).
 */
const EmaModule = (() => {

  function analyze(candles, settings) {
    const close = Utils.series(candles, 'close');
    const period = settings.emaLength || 21;

    const ema12 = Utils.ema(close, 12);
    const ema26 = Utils.ema(close, 26);
    const emaCustom = Utils.ema(close, period);

    const price = Utils.last(close);
    const v12 = Utils.last(ema12);
    const v26 = Utils.last(ema26);
    const vCustom = Utils.last(emaCustom);

    let signal = 'خنثی', interpretation = 'نامشخص', score = 5;
    if (v12 != null && v26 != null) {
      if (v12 > v26 && price > vCustom) {
        signal = 'خرید'; interpretation = 'EMA12 بالای EMA26'; score = 9;
      } else if (v12 < v26 && price < vCustom) {
        signal = 'فروش'; interpretation = 'EMA12 زیر EMA26'; score = 2;
      } else {
        signal = 'خنثی'; interpretation = 'تقاطع نامشخص'; score = 5;
      }
    }

    return {
      key: 'ema',
      title: 'میانگین متحرک نمایی',
      currentValue: `EMA${period}: ${Utils.formatNumber(vCustom)}`,
      interpretation,
      signal,
      weight: 5,
      score: Math.round(score / 2),
      maxScore: 5,
      raw: { ema12: v12, ema26: v26, emaCustom: vCustom }
    };
  }

  return { analyze };
})();
