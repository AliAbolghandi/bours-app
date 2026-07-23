/**
 * app.js
 * نقطه ورود برنامه: مسیریابی بین صفحات، مدیریت وضعیت نماد انتخاب‌شده
 * و اتصال تمام ماژول‌ها به یکدیگر.
 */
(function () {
  const state = {
    settings: SettingsModule.load(),
    tickers: [],
    currentTicker: null,
    currentPage: 'dashboard',
    overlays: { ma: true, ema: false, bollinger: false, levels: true }
  };

  const els = {
    pages: document.querySelectorAll('.page'),
    navItems: document.querySelectorAll('.nav-item'),
    symbolSelect: document.getElementById('symbolSelect'),
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    dashboardContainer: document.getElementById('dashboardContainer'),
    summaryContainer: document.getElementById('summaryContainer'),
    chartContainer: document.getElementById('chartContainer'),
    settingsContainer: document.getElementById('settingsContainer'),
    refreshBtn: document.getElementById('refreshBtn'),
  };

  document.documentElement.setAttribute('data-theme', state.settings.theme);

  function showPage(page) {
    state.currentPage = page;
    els.pages.forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
    els.navItems.forEach(n => n.classList.toggle('active', n.dataset.page === page));

    const titles = {
      dashboard: ['داشبورد', 'نمای کلی بازار و نمادهای پیگیری‌شده'],
      analysis: ['تحلیل تکنیکال', 'جدول جامع تحلیل برای نماد انتخاب‌شده'],
      chart: ['نمودار تعاملی', 'کندل‌استیک، اندیکاتورها و سطوح کلیدی'],
      settings: ['تنظیمات', 'پارامترهای اندیکاتور و ظاهر برنامه']
    };
    [els.pageTitle.textContent, els.pageSubtitle.textContent] = titles[page];

    if (page === 'analysis') renderAnalysis();
    if (page === 'chart') renderChart();
    if (page === 'settings') renderSettings();
  }

  async function loadTickers() {
    state.tickers = await Api.getStocks();
    els.symbolSelect.innerHTML = state.tickers.map(t => `<option value="${t}">${t}</option>`).join('');
    if (state.tickers.length) {
      state.currentTicker = state.tickers[0];
      els.symbolSelect.value = state.currentTicker;
    }
  }

  async function ensureEvaluated(ticker) {
    let cached = DashboardModule.getCached(ticker);
    if (cached) return cached;
    const candles = await Api.getHistory(ticker);
    const evalResult = ScoreEngine.evaluate(candles, state.settings);
    return { candles, evalResult };
  }

  async function renderAnalysis() {
    if (!state.currentTicker) return;
    els.summaryContainer.innerHTML = '<div class="loading">در حال محاسبه تحلیل...</div>';
    try {
      const { candles, evalResult } = await ensureEvaluated(state.currentTicker);
      SummaryModule.render(els.summaryContainer, evalResult);
    } catch (e) {
      els.summaryContainer.innerHTML = `<div class="loading">خطا: ${e.message}</div>`;
    }
  }

  async function renderChart() {
    if (!state.currentTicker) return;
    try {
      const { candles, evalResult } = await ensureEvaluated(state.currentTicker);
      ChartModule.render(els.chartContainer, candles, evalResult, state.overlays);
    } catch (e) {
      els.chartContainer.innerHTML = `<div class="loading">خطا: ${e.message}</div>`;
    }
  }

  function renderSettings() {
    SettingsModule.renderForm(els.settingsContainer, state.settings, (next) => {
      state.settings = next;
      document.documentElement.setAttribute('data-theme', next.theme);
      Api.clearCache();
      DashboardModule.getCached && (window.__dashCache = {}); // فورس رفرش محاسبات
    });
  }

  async function renderDashboard() {
    await DashboardModule.render(els.dashboardContainer, state.tickers, state.settings, (ticker) => {
      state.currentTicker = ticker;
      els.symbolSelect.value = ticker;
      showPage('analysis');
    });
  }

  // ---- رویدادها ---------------------------------------------------------
  els.navItems.forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
  });

  els.symbolSelect.addEventListener('change', (e) => {
    state.currentTicker = e.target.value;
    if (state.currentPage === 'analysis') renderAnalysis();
    if (state.currentPage === 'chart') renderChart();
  });

  els.refreshBtn.addEventListener('click', () => {
    Api.clearCache();
    if (state.currentPage === 'dashboard') renderDashboard();
    if (state.currentPage === 'analysis') renderAnalysis();
    if (state.currentPage === 'chart') renderChart();
  });

  document.querySelectorAll('.overlay-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      state.overlays[cb.dataset.overlay] = cb.checked;
      if (state.currentPage === 'chart') renderChart();
    });
  });

  // ---- راه‌اندازی --------------------------------------------------------
  (async function init() {
    try {
      await loadTickers();
      await renderDashboard();
      showPage('dashboard');
    } catch (e) {
      els.dashboardContainer.innerHTML = `<div class="loading">خطا در اتصال به سرور: ${e.message}<br>آدرس Web App را در js/api.js بررسی کنید.</div>`;
    }
  })();
})();
