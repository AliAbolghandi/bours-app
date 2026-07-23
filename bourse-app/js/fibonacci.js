/**
 * fibonacci.js
 * بازگشت فیبوناچی (Retracement) و امتداد فیبوناچی (Extension)
 * بر اساس آخرین سوئینگ اصلی high/low.
 */
const FibonacciModule = (() => {

  const RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const EXT_RATIOS = [1.272, 1.618, 2.0, 2.618];

  function findSwing(candles, lookback = 60) {
    const slice = candles.slice(-lookback);
    let swingHigh = -Infinity, swingLow = Infinity, hi = 0, lo = 0;
    slice.forEach((c, i) => {
      if (c.high > swingHigh) { swingHigh = c.high; hi = i; }
      if (c.low < swingLow) { swingLow = c.low; lo = i; }
    });
    const uptrend = hi > lo; // اوج پس از کف رخ داده -> حرکت صعودی اخیر
    return { swingHigh, swingLow, uptrend };
  }

  function analyze(candles, settings) {
    if (candles.length < 20) {
      return { key: 'fibonacci', title: 'فیبوناچی', currentValue: '—', interpretation: 'داده کافی نیست', signal: 'خنثی', weight: 5, score: 2, maxScore: 5, raw: {} };
    }
    const { swingHigh, swingLow, uptrend } = findSwing(candles);
    const range = swingHigh - swingLow;

    const levels = RATIOS.map(r => ({
      ratio: r,
      price: uptrend ? swingHigh - range * r : swingLow + range * r
    }));

    const extensions = EXT_RATIOS.map(r => ({
      ratio: r,
      price: uptrend ? swingHigh + range * (r - 1) : swingLow - range * (r - 1)
    }));

    const price = Utils.last(Utils.series(candles, 'close'));
    // نزدیک‌ترین سطح رتریسمنت به قیمت فعلی
    let nearest = levels[0];
    levels.forEach(l => {
      if (Math.abs(price - l.price) < Math.abs(price - nearest.price)) nearest = l;
    });

    let signal = 'خنثی', interpretation = `نزدیک سطح ${nearest.ratio}`, score = 5;
    if (nearest.ratio === 0.618 || nearest.ratio === 0.5) {
      signal = uptrend ? 'خرید' : 'فروش';
      interpretation = `واکنش به سطح طلایی فیبوناچی (${nearest.ratio})`;
      score = uptrend ? 8 : 3;
    }

    return {
      key: 'fibonacci',
      title: 'فیبوناچی',
      currentValue: `سطح نزدیک: ${nearest.ratio} (${Utils.formatNumber(nearest.price)})`,
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { levels, extensions, swingHigh, swingLow, uptrend }
    };
  }

  return { analyze };
})();
