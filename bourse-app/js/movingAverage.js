/**
 * movingAverage.js
 * میانگین متحرک ساده (SMA) در چند دوره‌ی استاندارد.
 */
const MovingAverageModule = (() => {

  function analyze(candles, settings) {
    const close = Utils.series(candles, 'close');
    const period = settings.maLength || 20;

    const ma20 = Utils.sma(close, 20);
    const ma50 = Utils.sma(close, 50);
    const ma200 = Utils.sma(close, 200);
    const maCustom = Utils.sma(close, period);

    const price = Utils.last(close);
    const v20 = Utils.last(ma20);
    const v50 = Utils.last(ma50);
    const v200 = Utils.last(ma200);

    let signal = 'خنثی', interpretation = 'نامشخص', score = 5;

    if (v20 != null && v50 != null && v200 != null && price != null) {
      const aboveAll = price > v20 && price > v50 && price > v200;
      const belowAll = price < v20 && price < v50 && price < v200;
      const bullishStack = v20 > v50 && v50 > v200;
      const bearishStack = v20 < v50 && v50 < v200;

      if (aboveAll && bullishStack) {
        signal = 'خرید'; interpretation = 'بالای MA200 (روند صعودی قوی)'; score = 10;
      } else if (belowAll && bearishStack) {
        signal = 'فروش'; interpretation = 'زیر MA200 (روند نزولی قوی)'; score = 1;
      } else if (price > v200) {
        signal = 'خرید'; interpretation = 'بالای MA200'; score = 7;
      } else if (price < v200) {
        signal = 'فروش'; interpretation = 'زیر MA200'; score = 3;
      } else {
        signal = 'خنثی'; interpretation = 'نزدیک میانگین‌ها'; score = 5;
      }
    }

    return {
      key: 'movingAverage',
      title: 'میانگین متحرک',
      currentValue: `MA20: ${Utils.formatNumber(v20)} | MA50: ${Utils.formatNumber(v50)} | MA200: ${Utils.formatNumber(v200)}`,
      interpretation,
      signal,
      weight: 10,
      score,
      maxScore: 10,
      raw: { ma20: v20, ma50: v50, ma200: v200, maCustom: Utils.last(maCustom) }
    };
  }

  return { analyze };
})();
