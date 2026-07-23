/**
 * volume.js
 * تحلیل پیشرفته حجم: حجم امروز، میانگین‌ها، حجم نسبی، روند حجم،
 * شکست/ریزش حجمی، فشار خرید/فروش و امتیاز حجم.
 */
const VolumeModule = (() => {

  function analyze(candles) {
    const vol = Utils.series(candles, 'volume');
    const close = Utils.series(candles, 'close');
    const n = candles.length;

    const todayVol = Utils.last(vol);
    const avg10 = Utils.last(Utils.sma(vol, 10));
    const avg20 = Utils.last(Utils.sma(vol, 20));
    const avg30 = Utils.last(Utils.sma(vol, 30));

    const rvol = avg20 ? todayVol / avg20 : null;
    const volRatio = avg10 && avg30 ? avg10 / avg30 : null;
    const priceChange = n >= 2 ? close[n - 1] - close[n - 2] : 0;

    // فشار خرید/فروش تخمینی از موقعیت close نسبت به high/low روز
    let buyPressure = 0, sellPressure = 0;
    const last = candles[n - 1];
    const dayRange = (last.high - last.low) || 1e-9;
    const closeLoc = (last.close - last.low) / dayRange; // ۰..۱
    buyPressure = closeLoc * todayVol;
    sellPressure = (1 - closeLoc) * todayVol;

    const volumeTrend = avg10 != null && avg30 != null ? (avg10 > avg30 ? 'صعودی' : 'نزولی') : 'نامشخص';

    const isBreakoutVol = rvol != null && rvol >= 2 && priceChange > 0;
    const isBreakdownVol = rvol != null && rvol >= 2 && priceChange < 0;
    const isLowVolPullback = rvol != null && rvol < 0.7 && priceChange < 0;
    const confirmed = (priceChange > 0 && closeLoc > 0.5) || (priceChange < 0 && closeLoc < 0.5);

    // انباشت/توزیع ساده: چند کندل اخیر با فشار خرید/فروش غالب
    const recent = candles.slice(-10);
    let accCount = 0, distCount = 0;
    recent.forEach(c => {
      const r = (c.high - c.low) || 1e-9;
      const loc = (c.close - c.low) / r;
      if (loc > 0.6) accCount++;
      else if (loc < 0.4) distCount++;
    });
    const accumulation = accCount > distCount;

    let signal = 'خنثی', interpretation = 'حجم عادی', score = 8;
    if (isBreakoutVol) { signal = 'خرید'; interpretation = `حجم ${Utils.formatNumber(rvol)}× میانگین (شکست حجمی صعودی)`; score = 15; }
    else if (isBreakdownVol) { signal = 'فروش'; interpretation = `حجم ${Utils.formatNumber(rvol)}× میانگین (ریزش حجمی)`; score = 3; }
    else if (isLowVolPullback) { signal = 'خرید'; interpretation = 'اصلاح با حجم کم (سالم)'; score = 10; }
    else if (accumulation) { signal = 'خرید'; interpretation = 'شواهد انباشت'; score = 11; }
    else if (!confirmed) { signal = 'خنثی'; interpretation = 'عدم تأیید حجمی حرکت قیمت'; score = 6; }

    return {
      key: 'volume',
      title: 'حجم معاملات',
      currentValue: `${Utils.formatNumber(rvol)}× میانگین`,
      interpretation,
      signal,
      weight: 15,
      score,
      maxScore: 15,
      raw: {
        todayVol, avg10, avg20, avg30, rvol, volRatio, volumeTrend,
        isBreakoutVol, isBreakdownVol, isLowVolPullback, confirmed,
        buyPressure, sellPressure, accumulation
      }
    };
  }

  return { analyze };
})();
