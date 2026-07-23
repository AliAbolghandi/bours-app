/**
 * smartMoney.js
 * تخمین رفتار پول هوشمند صرفاً از روی داده‌های OHLCV با ترکیب OBV، MFI،
 * منطق تجمیع/توزیع (Accumulation/Distribution) و اصل Effort vs Result.
 *
 * توضیح: بدون داده‌ی سفارشات حقیقی/حقوقی، این ماژول یک "تخمین" مبتنی بر
 * پرایس‌اکشن و حجم ارائه می‌دهد، نه داده‌ی قطعی جریان پول نهادی.
 */
const SmartMoneyModule = (() => {

  function accDistLine(candles) {
    let cum = 0;
    return candles.map(c => {
      const r = (c.high - c.low) || 1e-9;
      const mfm = ((c.close - c.low) - (c.high - c.close)) / r; // Money Flow Multiplier
      cum += mfm * (c.volume || 0);
      return cum;
    });
  }

  function analyze(candles, ctx) {
    const n = candles.length;
    const adLine = accDistLine(candles);
    const adMa = Utils.sma(adLine, 20);
    const adNow = Utils.last(adLine);
    const adAvg = Utils.last(adMa);

    const close = Utils.series(candles, 'close');
    const priceChangePct = n >= 11 ? ((close[n - 1] - close[n - 11]) / close[n - 11]) * 100 : 0;
    const adChangePct = (adNow != null && adAvg) ? ((adNow - adAvg) / Math.abs(adAvg || 1)) * 100 : 0;

    // Effort vs Result: تلاش حجمی بالا اما نتیجه (تغییر قیمت) کم -> جذب/absorbtion
    const vol = Utils.series(candles, 'volume');
    const avgVol20 = Utils.last(Utils.sma(vol, 20));
    const todayVol = Utils.last(vol);
    const todayChangePct = n >= 2 ? Math.abs((close[n - 1] - close[n - 2]) / close[n - 2]) * 100 : 0;
    const highEffortLowResult = avgVol20 && todayVol > avgVol20 * 1.5 && todayChangePct < 1;

    // اوج خرید/فروش هیجانی: حجم بسیار بالا + کندل با بدنه بزرگ در انتهای روند
    const last = candles[n - 1];
    const prev = candles[n - 2] || last;
    const climaxVolume = avgVol20 && todayVol > avgVol20 * 2.5;
    const buyingClimax = climaxVolume && last.close > prev.close && (last.close - last.open) / (last.high - last.low || 1) > 0.7;
    const sellingClimax = climaxVolume && last.close < prev.close && (last.open - last.close) / (last.high - last.low || 1) > 0.7;

    let moneyFlowTrend = 'خنثی';
    if (adNow != null && adAvg != null) moneyFlowTrend = adNow > adAvg ? 'ورود پول (تجمیع)' : 'خروج پول (توزیع)';

    let signal = 'خنثی', interpretation = moneyFlowTrend, score = 5;
    if (buyingClimax) { signal = 'فروش'; interpretation = 'اوج خرید هیجانی (احتمال برگشت)'; score = 3; }
    else if (sellingClimax) { signal = 'خرید'; interpretation = 'اوج فروش هیجانی (احتمال برگشت)'; score = 8; }
    else if (highEffortLowResult && adNow > adAvg) { signal = 'خرید'; interpretation = 'جذب عرضه (Absorption) با ورود پول'; score = 9; }
    else if (highEffortLowResult) { signal = 'فروش'; interpretation = 'تلاش حجمی بالا بدون نتیجه (توزیع احتمالی)'; score = 4; }
    else if (adNow > adAvg && priceChangePct >= 0) { signal = 'خرید'; interpretation = 'ورود پول هوشمند همسو با روند'; score = 9; }
    else if (adNow < adAvg && priceChangePct <= 0) { signal = 'فروش'; interpretation = 'خروج پول هوشمند همسو با روند'; score = 2; }
    else if (adNow > adAvg && priceChangePct < 0) { signal = 'خرید'; interpretation = 'واگرایی مثبت پول هوشمند (ورود پنهان)'; score = 8; }
    else if (adNow < adAvg && priceChangePct > 0) { signal = 'فروش'; interpretation = 'واگرایی منفی پول هوشمند (توزیع پنهان)'; score = 3; }

    return {
      key: 'smartMoney',
      title: 'پول هوشمند',
      currentValue: moneyFlowTrend,
      interpretation,
      signal,
      weight: 10,
      score,
      maxScore: 10,
      raw: { adLine, adNow, adAvg, buyingClimax, sellingClimax, highEffortLowResult }
    };
  }

  return { analyze };
})();
