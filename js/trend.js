/**
 * trend.js
 * تحلیل روند کلی با ترکیب ساختار قیمت (HH/HL/LH/LL) و آرایش میانگین‌های متحرک.
 */
const TrendModule = (() => {

  function analyze(candles) {
    const close = Utils.series(candles, 'close');
    const ma20 = Utils.last(Utils.sma(close, 20));
    const ma50 = Utils.last(Utils.sma(close, 50));
    const ma200 = Utils.last(Utils.sma(close, 200));
    const price = Utils.last(close);

    // ساختار قیمت در ۲۰ کندل اخیر
    const recent = candles.slice(-20);
    const firstHalf = recent.slice(0, 10);
    const secondHalf = recent.slice(10);
    const highFirst = Math.max(...firstHalf.map(c => c.high));
    const highSecond = Math.max(...secondHalf.map(c => c.high));
    const lowFirst = Math.min(...firstHalf.map(c => c.low));
    const lowSecond = Math.min(...secondHalf.map(c => c.low));

    const higherHighs = highSecond > highFirst;
    const higherLows = lowSecond > lowFirst;
    const lowerHighs = highSecond < highFirst;
    const lowerLows = lowSecond < lowFirst;

    let structure = 'خنثی';
    if (higherHighs && higherLows) structure = 'صعودی قوی (HH+HL)';
    else if (lowerHighs && lowerLows) structure = 'نزولی قوی (LH+LL)';
    else if (higherHighs) structure = 'ضعیف صعودی';
    else if (lowerLows) structure = 'ضعیف نزولی';

    const maAligned = ma20 != null && ma50 != null && ma200 != null;
    const bullishMa = maAligned && ma20 > ma50 && ma50 > ma200 && price > ma20;
    const bearishMa = maAligned && ma20 < ma50 && ma50 < ma200 && price < ma20;

    let signal = 'خنثی', interpretation = structure, score = 10;
    if ((higherHighs && higherLows) && bullishMa) { signal = 'خرید'; score = 20; interpretation = 'روند صعودی قوی و تأییدشده'; }
    else if ((lowerHighs && lowerLows) && bearishMa) { signal = 'فروش'; score = 2; interpretation = 'روند نزولی قوی و تأییدشده'; }
    else if (higherHighs || higherLows || bullishMa) { signal = 'خرید'; score = 14; interpretation = 'روند صعودی'; }
    else if (lowerHighs || lowerLows || bearishMa) { signal = 'فروش'; score = 6; interpretation = 'روند نزولی'; }
    else { signal = 'خنثی'; score = 10; interpretation = 'روند خنثی/رنج'; }

    return {
      key: 'trend',
      title: 'روند',
      currentValue: structure,
      interpretation,
      signal,
      weight: 20,
      score,
      maxScore: 20,
      raw: { structure, higherHighs, higherLows, lowerHighs, lowerLows, ma20, ma50, ma200 }
    };
  }

  return { analyze };
})();
