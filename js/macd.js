/**
 * macd.js
 * Moving Average Convergence Divergence
 */
const MacdModule = (() => {

  function analyze(candles, settings) {
    const close = Utils.series(candles, 'close');
    const fast = (settings.macd && settings.macd.fast) || 12;
    const slow = (settings.macd && settings.macd.slow) || 26;
    const signalP = (settings.macd && settings.macd.signal) || 9;

    const emaFast = Utils.ema(close, fast);
    const emaSlow = Utils.ema(close, slow);
    const macdLine = close.map((_, i) =>
      (emaFast[i] != null && emaSlow[i] != null) ? emaFast[i] - emaSlow[i] : null);

    const filled = macdLine.map(v => v == null ? 0 : v);
    const signalLine = Utils.ema(filled, signalP).map((v, i) => macdLine[i] == null ? null : v);
    const histogram = macdLine.map((v, i) =>
      (v != null && signalLine[i] != null) ? v - signalLine[i] : null);

    const m = Utils.last(macdLine);
    const s = Utils.last(signalLine);
    const h = Utils.last(histogram);
    const hPrev = histogram.filter(x => x != null).slice(-2, -1)[0];

    let signal = 'خنثی', interpretation = 'بدون واگرایی خط‌ها', score = 5;
    if (m != null && s != null) {
      const crossUp = hPrev != null && hPrev <= 0 && h > 0;
      const crossDown = hPrev != null && hPrev >= 0 && h < 0;
      if (crossUp) { signal = 'خرید'; interpretation = 'تقاطع صعودی'; score = 10; }
      else if (crossDown) { signal = 'فروش'; interpretation = 'تقاطع نزولی'; score = 1; }
      else if (m > s) { signal = 'خرید'; interpretation = 'خط MACD بالای سیگنال'; score = 8; }
      else { signal = 'فروش'; interpretation = 'خط MACD زیر سیگنال'; score = 3; }
    }

    return {
      key: 'macd',
      title: 'MACD',
      currentValue: `MACD: ${Utils.formatNumber(m)} | Signal: ${Utils.formatNumber(s)}`,
      interpretation,
      signal,
      weight: 10,
      score,
      maxScore: 10,
      raw: { macdLine, signalLine, histogram }
    };
  }

  return { analyze };
})();
