/**
 * adx.js
 * شاخص میانگین جهت‌دار (ADX) به همراه +DI و -DI برای سنجش قدرت روند.
 */
const AdxModule = (() => {

  function analyze(candles, settings) {
    const period = settings.adxPeriod || 14;
    const n = candles.length;
    const plusDM = new Array(n).fill(0);
    const minusDM = new Array(n).fill(0);

    for (let i = 1; i < n; i++) {
      const upMove = candles[i].high - candles[i - 1].high;
      const downMove = candles[i - 1].low - candles[i].low;
      plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
      minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
    }

    const tr = AtrModule.trueRange(candles);
    const smoothTR = AtrModule.wilderSmooth(tr, period);
    const smoothPlusDM = AtrModule.wilderSmooth(plusDM, period);
    const smoothMinusDM = AtrModule.wilderSmooth(minusDM, period);

    const plusDI = smoothTR.map((t, i) => (t && smoothPlusDM[i] != null) ? (smoothPlusDM[i] / t) * 100 : null);
    const minusDI = smoothTR.map((t, i) => (t && smoothMinusDM[i] != null) ? (smoothMinusDM[i] / t) * 100 : null);

    const dx = plusDI.map((p, i) => {
      const m = minusDI[i];
      if (p == null || m == null || (p + m) === 0) return null;
      return (Math.abs(p - m) / (p + m)) * 100;
    });

    const filledDx = dx.map(v => v == null ? 0 : v);
    const adx = Utils.sma(filledDx, period).map((v, i) => dx[i] == null ? null : v);

    const vAdx = Utils.last(adx);
    const vPlus = Utils.last(plusDI);
    const vMinus = Utils.last(minusDI);

    let signal = 'خنثی', interpretation = 'روند ضعیف/بدون روند', score = 4;
    if (vAdx != null) {
      const trending = vAdx >= 25;
      if (trending && vPlus > vMinus) { signal = 'خرید'; interpretation = 'روند صعودی قوی'; score = 9; }
      else if (trending && vMinus > vPlus) { signal = 'فروش'; interpretation = 'روند نزولی قوی'; score = 2; }
      else { signal = 'خنثی'; interpretation = 'بدون روند مشخص'; score = 4; }
    }

    return {
      key: 'adx',
      title: 'ADX',
      currentValue: `ADX: ${Utils.formatNumber(vAdx)} | +DI: ${Utils.formatNumber(vPlus)} | -DI: ${Utils.formatNumber(vMinus)}`,
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { adx, plusDI, minusDI }
    };
  }

  return { analyze };
})();
