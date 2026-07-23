/**
 * risk.js
 * تحلیل ریسک: تعیین نقطه ورود، حد ضرر، اهداف قیمتی (بر پایه ATR و حمایت/مقاومت)
 * و سطح ریسک کلی بر اساس نوسان (ATR%) و قدرت روند (ADX).
 */
const RiskModule = (() => {

  function compute(candles, moduleResults) {
    const price = Utils.last(Utils.series(candles, 'close'));
    const atrRaw = moduleResults.atr.raw;
    const atrValue = atrRaw.value || (price * 0.02);
    const support = moduleResults.support.raw.nearestSupport?.price;
    const resistance = moduleResults.support.raw.nearestResistance?.price;

    const entry = price;
    const stopLoss = support ? Math.min(support, price - atrValue * 1.5) : price - atrValue * 1.5;
    const risk = entry - stopLoss;

    const target1 = resistance || entry + risk * 1.5;
    const target2 = entry + risk * 2.5;
    const target3 = entry + risk * 4;

    const atrPct = atrRaw.pct || 2;
    const adxValue = moduleResults.adx.raw.adx ? Utils.last(moduleResults.adx.raw.adx) : 20;

    let riskLevel = 'متوسط';
    if (atrPct > 6) riskLevel = 'بسیار بالا';
    else if (atrPct > 4) riskLevel = 'بالا';
    else if (atrPct < 1.5 && adxValue < 20) riskLevel = 'پایین';
    else if (atrPct < 1 && adxValue < 15) riskLevel = 'بسیار پایین';

    const rewardToRisk = risk ? (target1 - entry) / risk : null;

    return {
      entry, stopLoss, target1, target2, target3,
      riskLevel, rewardToRisk: Utils.round(rewardToRisk, 2), atrPct
    };
  }

  return { compute };
})();
