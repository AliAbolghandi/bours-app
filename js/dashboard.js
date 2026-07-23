/**
 * dashboard.js
 * صفحه‌ی داشبورد: نمایش کارت‌های خلاصه برای هر نماد.
 */
const DashboardModule = (() => {

  let cache = {};

  function recBadgeClass(rec) {
    if (rec === 'خرید قوی') return 'badge-strong-buy';
    if (rec === 'خرید') return 'badge-buy';
    if (rec === 'فروش') return 'badge-sell';
    if (rec === 'فروش قوی') return 'badge-strong-sell';
    return 'badge-neutral';
  }

  function cardTemplate(ticker, evalResult, latest, prevClose) {
    const { totals, risk } = evalResult;
    const change = prevClose ? ((latest.close - prevClose) / prevClose) * 100 : 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const supportPrice = evalResult.results.support.raw.nearestSupport?.price;
    const resistancePrice = evalResult.results.support.raw.nearestResistance?.price;

    return `
      <div class="stock-card glass" data-ticker="${ticker}">
        <div class="stock-card-header">
          <span class="stock-name">${ticker}</span>
          <span class="badge ${recBadgeClass(totals.recommendation)}">${totals.recommendation}</span>
        </div>
        <div class="stock-price-row">
          <span class="stock-price">${Utils.formatToman(latest.close)}</span>
          <span class="stock-change ${changeClass}">${change >= 0 ? '▲' : '▼'} ${Utils.formatPercent(Math.abs(change))}</span>
        </div>
        <div class="stock-score-row">
          <div class="mini-gauge" style="--pct:${totals.technicalScore}"><span>${Utils.faDigits(totals.technicalScore)}</span></div>
          <div class="mini-meta">
            <div>درصد خرید: <b>${Utils.formatPercent(totals.buyPercentage)}</b></div>
            <div>ریسک: <b>${risk.riskLevel}</b></div>
          </div>
        </div>
        <div class="stock-levels">
          <div><span>حمایت</span><b>${Utils.formatNumber(supportPrice)}</b></div>
          <div><span>مقاومت</span><b>${Utils.formatNumber(resistancePrice)}</b></div>
          <div><span>ورود</span><b>${Utils.formatNumber(risk.entry)}</b></div>
          <div><span>حد ضرر</span><b>${Utils.formatNumber(risk.stopLoss)}</b></div>
          <div><span>هدف ۱</span><b>${Utils.formatNumber(risk.target1)}</b></div>
          <div><span>هدف ۲</span><b>${Utils.formatNumber(risk.target2)}</b></div>
          <div><span>هدف ۳</span><b>${Utils.formatNumber(risk.target3)}</b></div>
        </div>
      </div>
    `;
  }

  async function render(container, tickers, settings, onSelect) {
    container.innerHTML = '<div class="loading">در حال بارگذاری داده‌ها...</div>';
    const grid = document.createElement('div');
    grid.className = 'stock-grid';

    const cards = await Promise.all(tickers.map(async (ticker) => {
      try {
        const candles = await Api.getHistory(ticker);
        if (!candles || candles.length < 30) return null;
        const evalResult = ScoreEngine.evaluate(candles, settings);
        cache[ticker] = { candles, evalResult };
        const latest = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        return { ticker, html: cardTemplate(ticker, evalResult, latest, prev?.close) };
      } catch (e) {
        return null;
      }
    }));

    container.innerHTML = '';
    grid.innerHTML = cards.filter(Boolean).map(c => c.html).join('');
    container.appendChild(grid);

    grid.querySelectorAll('.stock-card').forEach(card => {
      card.addEventListener('click', () => onSelect(card.dataset.ticker));
    });
  }

  const getCached = (ticker) => cache[ticker];

  return { render, getCached };
})();
