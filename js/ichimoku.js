/**
 * ichimoku.js
 * ایچیموکو کینکو هایو (Tenkan, Kijun, Senkou A/B, ابر کومو).
 */
const IchimokuModule = (() => {

  function midpoint(candles, period, endIndex) {
    const start = Math.max(0, endIndex - period + 1);
    const slice = candles.slice(start, endIndex + 1);
    if (!slice.length) return null;
    const hi = Math.max(...slice.map(c => c.high));
    const lo = Math.min(...slice.map(c => c.low));
    return (hi + lo) / 2;
  }

  function analyze(candles) {
    const n = candles.length;
    if (n < 52) {
      return { key: 'ichimoku', title: 'ایچیموکو', currentValue: '—', interpretation: 'داده کافی نیست', signal: 'خنثی', weight: 5, score: 2, maxScore: 5, raw: {} };
    }
    const i = n - 1;
    const tenkan = midpoint(candles, 9, i);
    const kijun = midpoint(candles, 26, i);
    const senkouA = (tenkan + kijun) / 2;
    const senkouB = midpoint(candles, 52, i);
    const price = candles[i].close;

    const cloudTop = Math.max(senkouA, senkouB);
    const cloudBottom = Math.min(senkouA, senkouB);

    let signal = 'خنثی', interpretation = 'داخل ابر کومو', score = 5;
    if (price > cloudTop && tenkan > kijun) { signal = 'خرید'; interpretation = 'بالای ابر، تنکان بالای کیجون'; score = 9; }
    else if (price < cloudBottom && tenkan < kijun) { signal = 'فروش'; interpretation = 'زیر ابر، تنکان زیر کیجون'; score = 2; }
    else if (price > cloudTop) { signal = 'خرید'; interpretation = 'بالای ابر کومو'; score = 7; }
    else if (price < cloudBottom) { signal = 'فروش'; interpretation = 'زیر ابر کومو'; score = 3; }
    else { signal = 'خنثی'; interpretation = 'داخل ابر کومو (بلاتکلیف)'; score = 5; }

    return {
      key: 'ichimoku',
      title: 'ایچیموکو',
      currentValue: `Tenkan: ${Utils.formatNumber(tenkan)} | Kijun: ${Utils.formatNumber(kijun)}`,
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { tenkan, kijun, senkouA, senkouB, cloudTop, cloudBottom }
    };
  }

  return { analyze };
})();
