/**
 * priceAction.js
 * تحلیل پرایس اکشن: ساختار بازار (HH/HL/LH/LL)، شکست ساختار (BOS)،
 * تغییر کاراکتر (CHOCH)، عرضه/تقاضا، بلوک سفارش و نقاط نقدینگی.
 */
const PriceActionModule = (() => {

  // یافتن نقاط چرخش محلی ساده برای ساخت ساختار سوئینگ
  function swingPoints(candles, leftRight = 2) {
    const swings = [];
    for (let i = leftRight; i < candles.length - leftRight; i++) {
      const win = candles.slice(i - leftRight, i + leftRight + 1);
      if (win.every(c => candles[i].high >= c.high)) swings.push({ i, type: 'high', price: candles[i].high });
      if (win.every(c => candles[i].low <= c.low)) swings.push({ i, type: 'low', price: candles[i].low });
    }
    return swings.sort((a, b) => a.i - b.i);
  }

  function classifyStructure(swings) {
    const highs = swings.filter(s => s.type === 'high');
    const lows = swings.filter(s => s.type === 'low');
    const events = [];

    for (let k = 1; k < highs.length; k++) {
      events.push({ i: highs[k].i, label: highs[k].price > highs[k - 1].price ? 'HH' : 'LH' });
    }
    for (let k = 1; k < lows.length; k++) {
      events.push({ i: lows[k].i, label: lows[k].price > lows[k - 1].price ? 'HL' : 'LL' });
    }
    return events.sort((a, b) => a.i - b.i);
  }

  function detectBosChoch(events) {
    if (events.length < 3) return { bos: false, choch: false, lastLabel: null };
    const last3 = events.slice(-3).map(e => e.label);
    const bullish = ['HL', 'HH'];
    const bearish = ['LH', 'LL'];
    const wasBullish = last3.slice(0, 2).every(l => bullish.includes(l));
    const wasBearish = last3.slice(0, 2).every(l => bearish.includes(l));
    const nowBearish = bearish.includes(last3[2]);
    const nowBullish = bullish.includes(last3[2]);

    const choch = (wasBullish && nowBearish) || (wasBearish && nowBullish);
    const bos = !choch && (nowBullish || nowBearish);
    return { bos, choch, lastLabel: last3[2] };
  }

  // مناطق عرضه/تقاضا: کندل‌های قوی قبل از حرکت بزرگ مخالف
  function findZones(candles) {
    const zones = { supply: [], demand: [] };
    for (let i = 2; i < candles.length - 1; i++) {
      const c = candles[i];
      const next = candles[i + 1];
      const body = Math.abs(c.close - c.open);
      const range = c.high - c.low || 1;
      const isStrong = body / range > 0.6;
      const bigMoveDown = (c.close - next.close) / c.close > 0.02;
      const bigMoveUp = (next.close - c.close) / c.close > 0.02;
      if (isStrong && bigMoveDown) zones.supply.push({ i, top: c.high, bottom: c.open });
      if (isStrong && bigMoveUp) zones.demand.push({ i, top: c.open, bottom: c.low });
    }
    return {
      supply: zones.supply.slice(-3),
      demand: zones.demand.slice(-3)
    };
  }

  // بلوک سفارش ساده: آخرین کندل مخالف قبل از حرکت ایمپالسیو
  function findOrderBlocks(candles) {
    const blocks = [];
    for (let i = 1; i < candles.length - 1; i++) {
      const c = candles[i];
      const next = candles[i + 1];
      const moveUp = (next.close - c.close) / c.close > 0.025;
      const moveDown = (c.close - next.close) / c.close > 0.025;
      if (moveUp && c.close < c.open) blocks.push({ i, type: 'bullish', top: c.high, bottom: c.low });
      if (moveDown && c.close > c.open) blocks.push({ i, type: 'bearish', top: c.high, bottom: c.low });
    }
    return blocks.slice(-3);
  }

  // نقاط نقدینگی: تجمع چند سقف/کف نزدیک هم (استاپ‌های احتمالی)
  function findLiquidity(swings, tolerancePct = 0.005) {
    const groups = [];
    swings.forEach(s => {
      const g = groups.find(gr => gr.type === s.type && Math.abs(gr.price - s.price) / gr.price <= tolerancePct);
      if (g) g.count++;
      else groups.push({ type: s.type, price: s.price, count: 1 });
    });
    return groups.filter(g => g.count >= 2);
  }

  function analyze(candles) {
    const swings = swingPoints(candles);
    const events = classifyStructure(swings);
    const { bos, choch, lastLabel } = detectBosChoch(events);
    const zones = findZones(candles);
    const orderBlocks = findOrderBlocks(candles);
    const liquidity = findLiquidity(swings);

    let signal = 'خنثی', interpretation = 'ساختار نامشخص', score = 8;
    if (choch) {
      const bullishNow = lastLabel === 'HL' || lastLabel === 'HH';
      signal = bullishNow ? 'خرید' : 'فروش';
      interpretation = `تغییر کاراکتر بازار (CHOCH) به ${bullishNow ? 'صعودی' : 'نزولی'}`;
      score = bullishNow ? 12 : 4;
    } else if (bos) {
      const bullishNow = lastLabel === 'HH' || lastLabel === 'HL';
      signal = bullishNow ? 'خرید' : 'فروش';
      interpretation = `شکست ساختار (BOS) ${bullishNow ? 'صعودی' : 'نزولی'} (${lastLabel})`;
      score = bullishNow ? 14 : 3;
    } else if (lastLabel) {
      interpretation = `آخرین ساختار: ${lastLabel}`;
      score = 8;
    }

    return {
      key: 'priceAction',
      title: 'پرایس اکشن',
      currentValue: `${lastLabel || '—'} ${bos ? '+ BOS' : ''}${choch ? '+ CHOCH' : ''}`,
      interpretation,
      signal,
      weight: 15,
      score,
      maxScore: 15,
      raw: { events, bos, choch, zones, orderBlocks, liquidity }
    };
  }

  return { analyze, swingPoints, classifyStructure };
})();
