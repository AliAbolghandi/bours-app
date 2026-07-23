/**
 * vwap.js
 * میانگین قیمت وزن‌دار به حجم (Volume Weighted Average Price) - تجمعی از ابتدای سری.
 */
const VwapModule = (() => {

  function analyze(candles) {
    let cumPV = 0, cumVol = 0;
    const vwap = candles.map(c => {
      const tp = (c.high + c.low + c.close) / 3;
      cumPV += tp * (c.volume || 0);
      cumVol += (c.volume || 0);
      return cumVol ? cumPV / cumVol : null;
    });

    const price = Utils.last(Utils.series(candles, 'close'));
    const value = Utils.last(vwap);

    let signal = 'خنثی', interpretation = 'نزدیک VWAP', score = 5;
    if (price != null && value != null) {
      if (price > value) { signal = 'خرید'; interpretation = 'قیمت بالای VWAP'; score = 7; }
      else { signal = 'فروش'; interpretation = 'قیمت زیر VWAP'; score = 4; }
    }

    return {
      key: 'vwap',
      title: 'VWAP',
      currentValue: Utils.formatNumber(value),
      interpretation,
      signal,
      weight: 3,
      score: Math.round(score * 0.4),
      maxScore: 3,
      raw: { vwap, value }
    };
  }

  return { analyze };
})();
