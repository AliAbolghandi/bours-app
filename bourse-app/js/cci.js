/**
 * cci.js
 * شاخص کانال کالا (Commodity Channel Index).
 */
const CciModule = (() => {

  function analyze(candles, settings) {
    const period = settings.cciPeriod || 20;
    const typical = candles.map(c => (c.high + c.low + c.close) / 3);
    const smaTp = Utils.sma(typical, period);

    const meanDev = new Array(typical.length).fill(null);
    for (let i = period - 1; i < typical.length; i++) {
      const slice = typical.slice(i - period + 1, i + 1);
      const mean = smaTp[i];
      meanDev[i] = slice.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
    }

    const cci = typical.map((tp, i) => {
      if (smaTp[i] == null || !meanDev[i]) return null;
      return (tp - smaTp[i]) / (0.015 * meanDev[i]);
    });

    const value = Utils.last(cci);
    let signal = 'خنثی', interpretation = 'محدوده عادی', score = 5;
    if (value != null) {
      if (value > 100) { signal = 'خرید'; interpretation = 'روند صعودی قوی'; score = 8; }
      else if (value < -100) { signal = 'فروش'; interpretation = 'روند نزولی قوی'; score = 3; }
      else { signal = 'خنثی'; interpretation = 'محدوده عادی'; score = 5; }
    }

    return {
      key: 'cci',
      title: 'CCI',
      currentValue: Utils.formatNumber(value),
      interpretation,
      signal,
      weight: 3,
      score: Math.round(score * 0.6),
      maxScore: 3,
      raw: { cci, value }
    };
  }

  return { analyze };
})();
