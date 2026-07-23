/**
 * support.js
 * شناسایی سطوح حمایت و مقاومت با استفاده از نقاط چرخش محلی (Local Pivots) و خوشه‌بندی قیمتی.
 */
const SupportModule = (() => {

  function findPivots(candles, leftRight = 3) {
    const highs = [], lows = [];
    for (let i = leftRight; i < candles.length - leftRight; i++) {
      const windowSlice = candles.slice(i - leftRight, i + leftRight + 1);
      const isHigh = windowSlice.every(c => candles[i].high >= c.high);
      const isLow = windowSlice.every(c => candles[i].low <= c.low);
      if (isHigh) highs.push(candles[i].high);
      if (isLow) lows.push(candles[i].low);
    }
    return { highs, lows };
  }

  function cluster(values, tolerancePct = 0.015) {
    const sorted = [...values].sort((a, b) => a - b);
    const clusters = [];
    sorted.forEach(v => {
      const c = clusters.find(cl => Math.abs(cl.avg - v) / cl.avg <= tolerancePct);
      if (c) { c.values.push(v); c.avg = c.values.reduce((a, b) => a + b, 0) / c.values.length; }
      else clusters.push({ avg: v, values: [v] });
    });
    return clusters.sort((a, b) => b.values.length - a.values.length).map(c => ({ price: c.avg, strength: c.values.length }));
  }

  function analyze(candles) {
    const { highs, lows } = findPivots(candles);
    const resistances = cluster(highs).slice(0, 5).sort((a, b) => b.price - a.price);
    const supports = cluster(lows).slice(0, 5).sort((a, b) => b.price - a.price);

    const price = Utils.last(Utils.series(candles, 'close'));
    const nearestResistance = resistances.find(r => r.price > price) || resistances[0];
    const nearestSupport = [...supports].reverse().find(s => s.price < price) || supports[supports.length - 1];

    const distToRes = nearestResistance ? ((nearestResistance.price - price) / price) * 100 : null;
    const distToSup = nearestSupport ? ((price - nearestSupport.price) / price) * 100 : null;

    let signal = 'خنثی', interpretation = 'داخل محدوده', score = 5;
    if (nearestResistance && price > nearestResistance.price) {
      signal = 'خرید'; interpretation = 'شکست مقاومت'; score = 9;
    } else if (nearestSupport && price < nearestSupport.price) {
      signal = 'فروش'; interpretation = 'شکست حمایت'; score = 2;
    } else if (distToSup != null && distToRes != null) {
      if (distToSup < distToRes) { signal = 'خرید'; interpretation = 'نزدیک به حمایت معتبر'; score = 7; }
      else { signal = 'فروش'; interpretation = 'نزدیک به مقاومت'; score = 4; }
    }

    return {
      key: 'support',
      title: 'حمایت و مقاومت',
      currentValue: `حمایت: ${Utils.formatNumber(nearestSupport?.price)} | مقاومت: ${Utils.formatNumber(nearestResistance?.price)}`,
      interpretation,
      signal,
      weight: 15,
      score,
      maxScore: 15,
      raw: { supports, resistances, nearestSupport, nearestResistance }
    };
  }

  return { analyze, findPivots, cluster };
})();
