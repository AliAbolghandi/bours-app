/**
 * summary.js
 * ساخت جدول خلاصه‌ی جامع - خروجی اصلی اپلیکیشن.
 * هر ماژول تحلیلی دقیقاً یک ردیف در این جدول تولید می‌کند.
 */
const SummaryModule = (() => {

  const ROW_ORDER = [
    'trend', 'support', 'priceAction', 'volume', 'smartMoney',
    'movingAverage', 'ema', 'rsi', 'macd', 'divergence',
    'candlestick', 'patterns', 'fibonacci', 'ichimoku', 'pivot',
    'bollinger', 'stochastic', 'adx', 'atr', 'cci', 'mfi', 'obv', 'vwap'
  ];

  function statusEmoji(signal) {
    if (signal === 'خرید') return '🟢';
    if (signal === 'فروش') return '🔴';
    return '🟡';
  }

  function signalBadgeClass(signal) {
    if (signal === 'خرید') return 'badge-buy';
    if (signal === 'فروش') return 'badge-sell';
    return 'badge-neutral';
  }

  function buildRows(results) {
    return ROW_ORDER
      .filter(key => results[key])
      .map(key => {
        const r = results[key];
        return {
          analysis: r.title,
          currentValue: r.currentValue,
          interpretation: r.interpretation,
          signal: r.signal,
          weight: r.weight,
          score: r.score,
          maxScore: r.maxScore,
          status: statusEmoji(r.signal)
        };
      });
  }

  function render(container, evalResult) {
    const { results, totals, risk } = evalResult;
    const rows = buildRows(results);

    const tableRows = rows.map(r => `
      <tr>
        <td class="cell-analysis">${r.analysis}</td>
        <td>${r.currentValue}</td>
        <td class="cell-interp">${r.interpretation}</td>
        <td><span class="badge ${signalBadgeClass(r.signal)}">${r.signal}</span></td>
        <td>${Utils.faDigits(r.weight)}</td>
        <td>${Utils.faDigits(r.score)}/${Utils.faDigits(r.maxScore)}</td>
        <td class="cell-status">${r.status}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="summary-wrapper">
        <table class="summary-table">
          <thead>
            <tr>
              <th>تحلیل</th>
              <th>مقدار فعلی</th>
              <th>تفسیر</th>
              <th>سیگنال</th>
              <th>وزن</th>
              <th>امتیاز</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>

        <div class="summary-footer-grid">
          <div class="footer-card score-card">
            <div class="gauge" style="--pct:${totals.technicalScore}">
              <span>${Utils.faDigits(totals.technicalScore)}</span>
            </div>
            <div class="footer-label">امتیاز فنی (Technical Score)</div>
          </div>

          <div class="footer-card">
            <div class="big-number">${Utils.formatPercent(totals.buyPercentage)}</div>
            <div class="footer-label">درصد خرید</div>
          </div>

          <div class="footer-card">
            <div class="big-badge ${signalBadgeClass(totals.buyPercentage >= 50 ? 'خرید' : 'فروش')}">${totals.recommendation}</div>
            <div class="footer-label">توصیه نهایی</div>
          </div>

          <div class="footer-card">
            <div class="big-number">${risk.riskLevel}</div>
            <div class="footer-label">سطح ریسک</div>
          </div>

          <div class="footer-card">
            <div class="big-number">${Utils.formatToman(risk.entry)}</div>
            <div class="footer-label">قیمت ورود</div>
          </div>
          <div class="footer-card">
            <div class="big-number danger">${Utils.formatToman(risk.stopLoss)}</div>
            <div class="footer-label">حد ضرر</div>
          </div>
          <div class="footer-card">
            <div class="big-number success">${Utils.formatToman(risk.target1)}</div>
            <div class="footer-label">هدف اول</div>
          </div>
          <div class="footer-card">
            <div class="big-number success">${Utils.formatToman(risk.target2)}</div>
            <div class="footer-label">هدف دوم</div>
          </div>
          <div class="footer-card">
            <div class="big-number success">${Utils.formatToman(risk.target3)}</div>
            <div class="footer-label">هدف سوم</div>
          </div>

          <div class="footer-card">
            <div class="big-number">${Utils.formatPercent(totals.confidence)}</div>
            <div class="footer-label">سطح اطمینان</div>
          </div>
          <div class="footer-card">
            <div class="big-number">${Utils.faDigits(totals.bullish)} 🟢 / ${Utils.faDigits(totals.bearish)} 🔴 / ${Utils.faDigits(totals.neutral)} 🟡</div>
            <div class="footer-label">تعداد سیگنال‌ها (صعودی/نزولی/خنثی)</div>
          </div>
          <div class="footer-card">
            <div class="big-number">${Utils.faDigits(totals.totalAnalyses)}</div>
            <div class="footer-label">تعداد کل تحلیل‌های انجام‌شده</div>
          </div>
          <div class="footer-card">
            <div class="big-number">${totals.overallBias}</div>
            <div class="footer-label">جهت‌گیری کلی بازار</div>
          </div>
        </div>
      </div>
    `;
  }

  return { render, buildRows };
})();
