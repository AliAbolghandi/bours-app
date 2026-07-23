/**
 * score.js
 * موتور امتیازدهی مرکزی. تمام ماژول‌های تحلیلی را اجرا می‌کند،
 * امتیاز وزن‌دار نهایی (Technical Score)، درصد خرید (Buy Percentage)
 * و توصیه‌ی نهایی را محاسبه می‌کند.
 */
const ScoreEngine = (() => {

  // ترتیب اجرا مهم است چون برخی ماژول‌ها (ریسک، واگرایی) به خروجی بقیه نیاز دارند
  const MODULE_RUNNERS = [
    { key: 'trend', run: (c, s) => TrendModule.analyze(c) },
    { key: 'support', run: (c, s) => SupportModule.analyze(c) },
    { key: 'priceAction', run: (c, s) => PriceActionModule.analyze(c) },
    { key: 'volume', run: (c, s) => VolumeModule.analyze(c) },
    { key: 'smartMoney', run: (c, s) => SmartMoneyModule.analyze(c) },
    { key: 'movingAverage', run: (c, s) => MovingAverageModule.analyze(c, s) },
    { key: 'ema', run: (c, s) => EmaModule.analyze(c, s) },
    { key: 'rsi', run: (c, s) => RsiModule.analyze(c, s) },
    { key: 'macd', run: (c, s) => MacdModule.analyze(c, s) },
    { key: 'candlestick', run: (c, s) => CandlestickModule.analyze(c) },
    { key: 'patterns', run: (c, s) => PatternsModule.analyze(c) },
    { key: 'fibonacci', run: (c, s) => FibonacciModule.analyze(c, s) },
    { key: 'atr', run: (c, s) => AtrModule.analyze(c, s) },
    { key: 'adx', run: (c, s) => AdxModule.analyze(c, s) },
    { key: 'bollinger', run: (c, s) => BollingerModule.analyze(c, s) },
    { key: 'stochastic', run: (c, s) => StochasticModule.analyze(c, s) },
    { key: 'cci', run: (c, s) => CciModule.analyze(c, s) },
    { key: 'mfi', run: (c, s) => MfiModule.analyze(c, s) },
    { key: 'obv', run: (c, s) => ObvModule.analyze(c) },
    { key: 'vwap', run: (c, s) => VwapModule.analyze(c) },
    { key: 'pivot', run: (c, s) => PivotModule.analyze(c) },
    { key: 'ichimoku', run: (c, s) => IchimokuModule.analyze(c) },
    { key: 'divergence', run: (c, s, ctx) => DivergenceModule.analyze(c, ctx) }
  ];

  function runAll(candles, settings) {
    const results = {};
    const ctx = {};

    MODULE_RUNNERS.forEach(m => {
      try {
        const res = m.run(candles, settings, ctx);
        results[m.key] = res;
        if (m.key === 'rsi') ctx.rsiRaw = res.raw;
      } catch (err) {
        results[m.key] = {
          key: m.key, title: m.key, currentValue: '—',
          interpretation: 'خطا در محاسبه: ' + err.message,
          signal: 'خنثی', weight: 0, score: 0, maxScore: 0, raw: {}
        };
      }
    });

    return results;
  }

  function computeTotals(results) {
    let sumScore = 0, sumMax = 0;
    let bullish = 0, bearish = 0, neutral = 0;

    Object.values(results).forEach(r => {
      sumScore += r.score || 0;
      sumMax += r.maxScore || 0;
      if (r.signal === 'خرید') bullish++;
      else if (r.signal === 'فروش') bearish++;
      else neutral++;
    });

    const technicalScore = sumMax ? Utils.round((sumScore / sumMax) * 100, 1) : 0;
    const signalRatio = (bullish + bearish) ? (bullish / (bullish + bearish)) * 100 : 50;
    const buyPercentage = Utils.round(Utils.clamp(0.7 * technicalScore + 0.3 * signalRatio, 0, 100), 1);

    let recommendation = 'نگهداری';
    if (buyPercentage >= 80) recommendation = 'خرید قوی';
    else if (buyPercentage >= 60) recommendation = 'خرید';
    else if (buyPercentage >= 40) recommendation = 'نگهداری';
    else if (buyPercentage >= 20) recommendation = 'فروش';
    else recommendation = 'فروش قوی';

    const totalAnalyses = Object.keys(results).length;
    const confidence = Utils.round(Math.abs(buyPercentage - 50) * 2, 0); // فاصله از خنثی = قطعیت

    return {
      technicalScore, buyPercentage, recommendation,
      bullish, bearish, neutral, totalAnalyses, confidence,
      overallBias: buyPercentage >= 55 ? 'صعودی' : (buyPercentage <= 45 ? 'نزولی' : 'خنثی')
    };
  }

  function evaluate(candles, settings) {
    const results = runAll(candles, settings);
    const totals = computeTotals(results);
    const risk = RiskModule.compute(candles, results);
    return { results, totals, risk };
  }

  return { evaluate, MODULE_RUNNERS };
})();
