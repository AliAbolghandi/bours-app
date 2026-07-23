/**
 * rsi.js
 * شاخص قدرت نسبی (Relative Strength Index) - فرمول Wilder.
 */
const RsiModule = (() => {

  function computeRsi(close, period) {
    const out = new Array(close.length).fill(null);
    let avgGain = 0, avgLoss = 0;

    for (let i = 1; i < close.length; i++) {
      const diff = close[i] - close[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      if (i <= period) {
        avgGain += gain / period;
        avgLoss += loss / period;
        if (i === period) {
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          out[i] = 100 - (100 / (1 + rs));
        }
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out[i] = 100 - (100 / (1 + rs));
      }
    }
    return out;
  }

  function analyze(candles, settings) {
    const close = Utils.series(candles, 'close');
    const period = settings.rsiPeriod || 14;
    const rsi = computeRsi(close, period);
    const value = Utils.last(rsi);

    let signal = 'خنثی', interpretation = 'محدوده متعادل', score = 5;
    if (value != null) {
      if (value >= 70) { signal = 'فروش'; interpretation = 'اشباع خرید'; score = 2; }
      else if (value <= 30) { signal = 'خرید'; interpretation = 'اشباع فروش'; score = 8; }
      else if (value > 50) { signal = 'خرید'; interpretation = 'سالم و صعودی'; score = 8; }
      else { signal = 'فروش'; interpretation = 'ضعیف'; score = 4; }
    }

    return {
      key: 'rsi',
      title: 'RSI',
      currentValue: Utils.formatNumber(value),
      interpretation,
      signal,
      weight: 10,
      score,
      maxScore: 10,
      raw: { rsi, value }
    };
  }

  return { analyze, computeRsi };
})();
