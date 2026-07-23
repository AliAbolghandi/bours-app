/**
 * pivot.js
 * نقاط پیوت کلاسیک بر اساس آخرین کندل تکمیل‌شده.
 */
const PivotModule = (() => {

  function analyze(candles) {
    if (candles.length < 2) {
      return { key: 'pivot', title: 'نقاط پیوت', currentValue: '—', interpretation: 'داده کافی نیست', signal: 'خنثی', weight: 3, score: 1, maxScore: 3, raw: {} };
    }
    const prev = candles[candles.length - 2];
    const price = Utils.last(Utils.series(candles, 'close'));

    const pp = (prev.high + prev.low + prev.close) / 3;
    const r1 = 2 * pp - prev.low;
    const s1 = 2 * pp - prev.high;
    const r2 = pp + (prev.high - prev.low);
    const s2 = pp - (prev.high - prev.low);
    const r3 = prev.high + 2 * (pp - prev.low);
    const s3 = prev.low - 2 * (prev.high - pp);

    let signal = 'خنثی', interpretation = 'نزدیک نقطه پیوت', score = 5;
    if (price != null) {
      if (price > r1) { signal = 'خرید'; interpretation = 'بالای مقاومت R1'; score = 8; }
      else if (price < s1) { signal = 'فروش'; interpretation = 'زیر حمایت S1'; score = 3; }
      else if (price > pp) { signal = 'خرید'; interpretation = 'بالای نقطه پیوت'; score = 7; }
      else { signal = 'فروش'; interpretation = 'زیر نقطه پیوت'; score = 4; }
    }

    return {
      key: 'pivot',
      title: 'نقاط پیوت',
      currentValue: `PP: ${Utils.formatNumber(pp)} | R1: ${Utils.formatNumber(r1)} | S1: ${Utils.formatNumber(s1)}`,
      interpretation,
      signal,
      weight: 3,
      score: Math.round(score * 0.4),
      maxScore: 3,
      raw: { pp, r1, r2, r3, s1, s2, s3 }
    };
  }

  return { analyze };
})();
