/**
 * mfi.js
 * شاخص جریان پول (Money Flow Index) - RSI وزن‌دار با حجم.
 */
const MfiModule = (() => {

  function analyze(candles, settings) {
    const period = settings.mfiPeriod || 14;
    const typical = candles.map(c => (c.high + c.low + c.close) / 3);
    const rawMoneyFlow = typical.map((tp, i) => tp * (candles[i].volume || 0));

    const posFlow = new Array(candles.length).fill(0);
    const negFlow = new Array(candles.length).fill(0);
    for (let i = 1; i < candles.length; i++) {
      if (typical[i] > typical[i - 1]) posFlow[i] = rawMoneyFlow[i];
      else if (typical[i] < typical[i - 1]) negFlow[i] = rawMoneyFlow[i];
    }

    const mfi = new Array(candles.length).fill(null);
    for (let i = period; i < candles.length; i++) {
      const posSum = posFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      const negSum = negFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      const ratio = negSum === 0 ? 100 : posSum / negSum;
      mfi[i] = 100 - (100 / (1 + ratio));
    }

    const value = Utils.last(mfi);
    let signal = 'خنثی', interpretation = 'جریان پول متعادل', score = 5;
    if (value != null) {
      if (value >= 80) { signal = 'فروش'; interpretation = 'اشباع خرید (جریان پول بالا)'; score = 3; }
      else if (value <= 20) { signal = 'خرید'; interpretation = 'اشباع فروش (جریان پول پایین)'; score = 8; }
      else if (value > 50) { signal = 'خرید'; interpretation = 'جریان پول مثبت'; score = 7; }
      else { signal = 'فروش'; interpretation = 'جریان پول منفی'; score = 4; }
    }

    return {
      key: 'mfi',
      title: 'MFI',
      currentValue: Utils.formatNumber(value),
      interpretation,
      signal,
      weight: 4,
      score: Math.round(score * 0.5),
      maxScore: 4,
      raw: { mfi, value }
    };
  }

  return { analyze };
})();
