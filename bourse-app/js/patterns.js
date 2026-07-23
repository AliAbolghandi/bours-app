/**
 * patterns.js
 * شناسایی الگوهای کلاسیک نموداری بر پایه‌ی نقاط چرخش (swing points).
 * الگوها به صورت هندسی و با تلورانس درصدی شناسایی می‌شوند؛
 * چون تشخیص کامل بصری در این سطح ممکن نیست، این یک تخمین قوی مبتنی بر قوانین است.
 */
const PatternsModule = (() => {

  const near = (a, b, tol = 0.02) => Math.abs(a - b) / ((a + b) / 2) <= tol;

  function analyze(candles) {
    const swings = PriceActionModule.swingPoints(candles, 3);
    const highs = swings.filter(s => s.type === 'high').slice(-5);
    const lows = swings.filter(s => s.type === 'low').slice(-5);
    const detected = [];

    // سر و شانه (سه سقف، وسطی بالاتر)
    if (highs.length >= 3) {
      const [h1, h2, h3] = highs.slice(-3);
      if (h2.price > h1.price && h2.price > h3.price && near(h1.price, h3.price, 0.03)) {
        detected.push({ name: 'سر و شانه', bias: 'bearish' });
      }
    }
    // سر و شانه معکوس (سه کف، وسطی پایین‌تر)
    if (lows.length >= 3) {
      const [l1, l2, l3] = lows.slice(-3);
      if (l2.price < l1.price && l2.price < l3.price && near(l1.price, l3.price, 0.03)) {
        detected.push({ name: 'سر و شانه معکوس', bias: 'bullish' });
      }
    }
    // سقف دوقلو
    if (highs.length >= 2) {
      const [h1, h2] = highs.slice(-2);
      if (near(h1.price, h2.price, 0.02)) detected.push({ name: 'سقف دوقلو', bias: 'bearish' });
    }
    // کف دوقلو
    if (lows.length >= 2) {
      const [l1, l2] = lows.slice(-2);
      if (near(l1.price, l2.price, 0.02)) detected.push({ name: 'کف دوقلو', bias: 'bullish' });
    }
    // سقف سه‌قلو
    if (highs.length >= 3) {
      const last3 = highs.slice(-3);
      if (near(last3[0].price, last3[1].price, 0.02) && near(last3[1].price, last3[2].price, 0.02)) {
        detected.push({ name: 'سقف سه‌قلو', bias: 'bearish' });
      }
    }
    // کف سه‌قلو
    if (lows.length >= 3) {
      const last3 = lows.slice(-3);
      if (near(last3[0].price, last3[1].price, 0.02) && near(last3[1].price, last3[2].price, 0.02)) {
        detected.push({ name: 'کف سه‌قلو', bias: 'bullish' });
      }
    }
    // مثلث صعودی: سقف‌ها ثابت، کف‌ها صعودی
    if (highs.length >= 2 && lows.length >= 2) {
      const hFlat = near(highs[highs.length - 1].price, highs[highs.length - 2].price, 0.015);
      const lRising = lows[lows.length - 1].price > lows[lows.length - 2].price;
      const lFalling = lows[lows.length - 1].price < lows[lows.length - 2].price;
      const hRising = highs[highs.length - 1].price > highs[highs.length - 2].price;
      const hFalling = highs[highs.length - 1].price < highs[highs.length - 2].price;

      if (hFlat && lRising) detected.push({ name: 'مثلث صعودی', bias: 'bullish' });
      if (near(lows[lows.length - 1].price, lows[lows.length - 2].price, 0.015) && hFalling) {
        detected.push({ name: 'مثلث نزولی', bias: 'bearish' });
      }
      if (hFalling && lRising) detected.push({ name: 'مثلث متقارن', bias: 'neutral' });
      if (hRising && lRising && (highs[highs.length - 1].price - lows[lows.length - 1].price) <
          (highs[highs.length - 2].price - lows[lows.length - 2].price)) {
        detected.push({ name: 'گوه صعودی (Rising Wedge)', bias: 'bearish' });
      }
      if (hFalling && lFalling && (highs[highs.length - 1].price - lows[lows.length - 1].price) <
          (highs[highs.length - 2].price - lows[lows.length - 2].price)) {
        detected.push({ name: 'گوه نزولی (Falling Wedge)', bias: 'bullish' });
      }
    }

    let signal = 'خنثی', interpretation = 'الگوی کلاسیک یافت نشد', score = 3;
    if (detected.length) {
      const bullish = detected.filter(d => d.bias === 'bullish').length;
      const bearish = detected.filter(d => d.bias === 'bearish').length;
      if (bullish > bearish) { signal = 'خرید'; score = 7; }
      else if (bearish > bullish) { signal = 'فروش'; score = 2; }
      interpretation = detected.map(d => d.name).join('، ');
    }

    return {
      key: 'patterns',
      title: 'الگوهای کلاسیک',
      currentValue: detected.length ? detected[0].name : 'بدون الگو',
      interpretation,
      signal,
      weight: 5,
      score,
      maxScore: 5,
      raw: { detected }
    };
  }

  return { analyze };
})();
