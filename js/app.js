/**
 * app.js
 * نقطه ورود برنامه: مسیریابی بین صفحات، مدیریت اتصال به پوشه‌ی sahm
 * (به‌جای Google Apps Script) و اتصال تمام ماژول‌ها به یکدیگر.
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
    connectBtn: document.getElementById('connectBtn'),
    connectionStatus: document.getElementById('connectionStatus'),
  };

  document.documentElement.setAttribute('data-theme', state.settings.theme);

  function updateConnectionStatus() {
    if (Api.isConnected()) {
      els.connectionStatus.textContent = `متصل — ${Utils.faDigits(Api.getFileCount())} فایل / ${Utils.faDigits(Api.getTickerCount())} نماد`;
      els.connectBtn.textContent = '🔄 اتصال مجدد پوشه sahm';
    } else {
      els.connectionStatus.textContent = 'به پوشه sahm متصل نیستید';
      els.connectBtn.textContent = '📁 اتصال پوشه sahm';
    }
  }

  function showPage(page) {
    state.currentPage = page;
    els.pages.forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
    els.navItems.forEach(n => n.classList.toggle('active', n.dataset.page === page));

    const titles = {
      dashboard: ['داشبورد', 'نمای کلی بازار و نمادهای موجود در پوشه sahm'],
      analysis: ['تحلیل تکنیکال', 'جدول جامع تحلیل برای نماد انتخاب‌شده'],
      chart: ['نمودار تعاملی', 'کندل‌استیک، اندیکاتورها و سطوح کلیدی'],
      settings: ['تنظیمات', 'پارامترهای اندیکاتور و ظاهر برنامه']
    };
    [els.pageTitle.textContent, els.pageSubtitle.textContent] = titles[page];

    if (page === 'analysis') renderAnalysis();
    if (page === 'chart') renderChart();
    if (page === 'settings') renderSettings();
  }

  async function refreshTickerList() {
    state.tickers = await Api.getStocks();
    els.symbolSelect.innerHTML = state.tickers.map(t => `<option value="${t}">${t}</option>`).join('');
    if (state.tickers.length) {
      if (!state.tickers.includes(state.currentTicker)) state.currentTicker = state.tickers[0];
      els.symbolSelect.value = state.currentTicker;
    } else {
      state.currentTicker = null;
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
    if (!state.currentTicker) {
      els.summaryContainer.innerHTML = emptyStateHtml();
      return;
    }
    els.summaryContainer.innerHTML = '<div class="loading">در حال محاسبه تحلیل...</div>';
    try {
      const { evalResult } = await ensureEvaluated(state.currentTicker);
      SummaryModule.render(els.summaryContainer, evalResult);
    } catch (e) {
      els.summaryContainer.innerHTML = `<div class="loading">خطا: ${e.message}</div>`;
    }
  }

  async function renderChart() {
    if (!state.currentTicker) {
      els.chartContainer.innerHTML = '';
      return;
    }
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
    });
  }

  function emptyStateHtml() {
    return `<div class="loading">
      هنوز به پوشه sahm متصل نشده‌اید یا این پوشه خالی است.<br>
      فایل‌های CSV نمادها را داخل پوشه‌ی <b>sahm</b> بریزید و روی «اتصال پوشه sahm» بزنید.
    </div>`;
  }

  async function renderDashboard() {
    if (!state.tickers.length) {
      els.dashboardContainer.innerHTML = emptyStateHtml();
      return;
    }
    await DashboardModule.render(els.dashboardContainer, state.tickers, state.settings, (ticker) => {
      state.currentTicker = ticker;
      els.symbolSelect.value = ticker;
      showPage('analysis');
    });
  }

  async function reloadEverything() {
    await refreshTickerList();
    updateConnectionStatus();
    if (state.currentPage === 'dashboard') await renderDashboard();
    if (state.currentPage === 'analysis') await renderAnalysis();
    if (state.currentPage === 'chart') await renderChart();
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

  els.refreshBtn.addEventListener('click', async () => {
    if (!Api.isConnected()) { await connect(); return; }
    Api.clearCache();
    await Api.scan();
    await reloadEverything();
  });

  els.connectBtn.addEventListener('click', connect);

  async function connect() {
    els.connectBtn.disabled = true;
    try {
      if (Api.supportsFsAccess) {
        // اگر handle قبلی وجود دارد فقط اجازه را دوباره درخواست کن
        const auto = await Api.tryAutoConnect();
        if (!auto.ok) {
          if (auto.hasHandle) await Api.requestPermissionAgain();
          else await Api.connectFolder();
        }
      } else {
        await Api.connectFolder();
      }
      await reloadEverything();
    } catch (e) {
      // کاربر انتخاب پوشه را لغو کرده یا خطای دیگر
      console.warn('اتصال پوشه ناموفق بود:', e);
    } finally {
      els.connectBtn.disabled = false;
    }
  }

  document.querySelectorAll('.overlay-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      state.overlays[cb.dataset.overlay] = cb.checked;
      if (state.currentPage === 'chart') renderChart();
    });
  });

  // ---- راه‌اندازی --------------------------------------------------------
  (async function init() {
    updateConnectionStatus();
    showPage('dashboard');
    // تلاش خاموش برای اتصال خودکار به آخرین پوشه‌ی مجازشده (بدون کلیک کاربر)
    const auto = await Api.tryAutoConnect();
    if (auto.ok) {
      await reloadEverything();
    } else {
      els.dashboardContainer.innerHTML = emptyStateHtml();
      if (auto.hasHandle) {
        els.connectBtn.textContent = '🔓 اعطای مجدد دسترسی به پوشه sahm';
      }
    }
  })();
})();
