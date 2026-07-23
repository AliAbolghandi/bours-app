/**
 * divergence.js
 * شناسایی واگرایی معمولی و مخفی بین قیمت و اسیلاتورها (RSI، MACD، OBV).
 */
const DivergenceModule = (() => {

  function recentSwingLows(candles, n = 2, leftRight = 3) {
    const swings = PriceActionModule.swingPoints(candles, leftRight).filter(s => s.type === 'low');
    return swings.slice(-n);
  }
  function recentSwingHighs(candles, n = 2, leftRight = 3) {
    const swings = PriceActionModule.swingPoints(candles, leftRight).filter(s => s.type === 'high');
    return swings.slice(-n);
  }

  function checkDivergence(candles, oscSeries) {
    const lows = recentSwingLows(candles);
    const highs = recentSwingHighs(candles);
    const results = [];

    if (lows.length === 2) {
      const [a, b] = lows;
      const priceHigherLow = b.price > a.price;
      const oscA = oscSeries[a.i], oscB = oscSeries[b.i];
      if (oscA != null && oscB != null) {
        if (!priceHigherLow && oscB > oscA) results.push('bullish_regular'); // قیمت LL، اسیلاتور HL
        if (priceHigherLow && oscB < oscA) results.push('bullish_hidden');
      }
    }
    if (highs.length === 2) {
      const [a, b] = highs;
      const priceLowerHigh = b.price < a.price;
      const oscA = oscSeries[a.i], oscB = oscSeries[b.i];
      if (oscA != null && oscB != null) {
        if (!priceLowerHigh && oscB < oscA) results.push('bearish_regular'); // قیمت HH، اسیلاتور LH
        if (priceLowerHigh && oscB > oscA) results.push('bearish_hidden');
      }
    }
    return results;
  }

  function analyze(candles, ctx) {
    const close = Utils.series(candles, 'close');
    const rsi = ctx?.rsiRaw?.rsi || RsiModule.computeRsi(close, 14);
    const obv = ObvModule.computeObv(candles);

    const rsiDiv = checkDivergence(candles, rsi);
    const obvDiv = checkDivergence(candles, obv);
    const all = [...rsiDiv, ...obvDiv];

    const bullish = all.filter(x => x.startsWith('bullish')).length;
    const bearish = all.filter(x => x.startsWith('bearish')).length;

    let signal = 'خنثی', interpretation = 'واگرایی یافت نشد', score = 7;
    if (bullish > bearish) { signal = 'خرید'; interpretation = 'واگرایی مثبت (صعودی)'; score = 9; }
    else if (bearish > bullish) { signal = 'فروش'; interpretation = 'واگرایی منفی (نزولی)'; score = 3; }

    return {
      key: 'divergence',
      title: 'واگرایی',
      currentValue: all.length ? all.join('، ') : 'هیچ',
      interpretation,
      signal,
      weight: 10,
      score,
      maxScore: 10,
      raw: { rsiDiv, obvDiv }
    };
  }

  return { analyze };
})();
