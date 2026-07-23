/**
 * candlestick.js
 * شناسایی خودکار الگوهای کندل استیک روی آخرین ۳ کندل.
 */
const CandlestickModule = (() => {

  const body = c => Math.abs(c.close - c.open);
  const range = c => (c.high - c.low) || 1e-9;
  const upperWick = c => c.high - Math.max(c.open, c.close);
  const lowerWick = c => Math.min(c.open, c.close) - c.low;
  const isBull = c => c.close > c.open;
  const isBear = c => c.close < c.open;

  const PATTERNS = [
    {
      name: 'چکش (Hammer)', bias: 'bullish',
      test: (c) => lowerWick(c) > body(c) * 2 && upperWick(c) < body(c) * 0.5 && body(c) / range(c) < 0.4
    },
    {
      name: 'ستاره ثاقب (Shooting Star)', bias: 'bearish',
      test: (c) => upperWick(c) > body(c) * 2 && lowerWick(c) < body(c) * 0.5 && body(c) / range(c) < 0.4
    },
    {
      name: 'دوجی (Doji)', bias: 'neutral',
      test: (c) => body(c) / range(c) < 0.08
    },
    {
      name: 'فرفره (Spinning Top)', bias: 'neutral',
      test: (c) => body(c) / range(c) < 0.3 && upperWick(c) > body(c) && lowerWick(c) > body(c)
    },
    {
      name: 'پوشای صعودی (Bullish Engulfing)', bias: 'bullish',
      test: (c, p) => p && isBear(p) && isBull(c) && c.close >= p.open && c.open <= p.close
    },
    {
      name: 'پوشای نزولی (Bearish Engulfing)', bias: 'bearish',
      test: (c, p) => p && isBull(p) && isBear(c) && c.open >= p.close && c.close <= p.open
    },
    {
      name: 'هارامی (Harami)', bias: 'neutral',
      test: (c, p) => p && body(c) < body(p) * 0.6 && Math.max(c.open, c.close) < Math.max(p.open, p.close) && Math.min(c.open, c.close) > Math.min(p.open, p.close)
    },
    {
      name: 'نفوذی (Piercing Line)', bias: 'bullish',
      test: (c, p) => p && isBear(p) && isBull(c) && c.open < p.low && c.close > (p.open + p.close) / 2 && c.close < p.open
    },
    {
      name: 'ابر تیره (Dark Cloud Cover)', bias: 'bearish',
      test: (c, p) => p && isBull(p) && isBear(c) && c.open > p.high && c.close < (p.open + p.close) / 2 && c.close > p.open
    },
    {
      name: 'ستاره صبحگاهی (Morning Star)', bias: 'bullish',
      test: (c, p, pp) => pp && isBear(pp) && body(p) / range(p) < 0.35 && isBull(c) && c.close > (pp.open + pp.close) / 2
    },
    {
      name: 'ستاره عصرگاهی (Evening Star)', bias: 'bearish',
      test: (c, p, pp) => pp && isBull(pp) && body(p) / range(p) < 0.35 && isBear(c) && c.close < (pp.open + pp.close) / 2
    }
  ];

  function analyze(candles) {
    const n = candles.length;
    if (n < 3) {
      return { key: 'candlestick', title: 'الگوی کندلی', currentValue: '—', interpretation: 'داده کافی نیست', signal: 'خنثی', weight: 5, score: 2, maxScore: 5, raw: {} };
    }
    const c = candles[n - 1], p = candles[n - 2], pp = candles[n - 3];
    const found = [];

    PATTERNS.forEach(pat => {
      try { if (pat.test(c, p, pp)) found.push(pat); } catch (e) { /* ignore */ }
    });

    let signal = 'خنثی', interpretation = 'الگوی مشخصی یافت نشد', score = 2;
    if (found.length) {
      const bullish = found.filter(f => f.bias === 'bullish').length;
      const bearish = found.filter(f => f.bias === 'bearish').length;
      if (bullish > bearish) { signal = 'خرید'; score = 5; }
      else if (bearish > bullish) { signal = 'فروش'; score = 1; }
      else { signal = 'خنثی'; score = 3; }
      interpretation = found.map(f => f.name).join('، ');
    }

    return {
      key: 'candlestick',
      title: 'الگوی کندلی',
      currentValue: found.length ? found[0].name : 'بدون الگو',
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { found }
    };
  }

  return { analyze, PATTERNS };
})();
