/**
 * settings.js
 * مدیریت تنظیمات قابل شخصی‌سازی: دوره‌های اندیکاتورها، وزن‌های امتیازدهی و تم.
 * تنظیمات در localStorage مرورگر ذخیره می‌شود.
 */
const SettingsModule = (() => {

  const STORAGE_KEY = 'bourse_settings_v1';

  const DEFAULTS = {
    rsiPeriod: 14,
    maLength: 20,
    emaLength: 21,
    macd: { fast: 12, slow: 26, signal: 9 },
    atrPeriod: 14,
    adxPeriod: 14,
    bollinger: { period: 20, mult: 2 },
    stochastic: { period: 14, d: 3 },
    cciPeriod: 20,
    mfiPeriod: 14,
    theme: 'dark'
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function save(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULTS };
  }

  function renderForm(container, current, onSave) {
    container.innerHTML = `
      <form class="settings-form" id="settingsForm">
        <div class="settings-section">
          <h3>پارامترهای اندیکاتور</h3>
          <div class="settings-grid">
            <label>دوره RSI <input type="number" name="rsiPeriod" value="${current.rsiPeriod}" min="2" max="100"></label>
            <label>طول میانگین متحرک <input type="number" name="maLength" value="${current.maLength}" min="2" max="300"></label>
            <label>طول EMA <input type="number" name="emaLength" value="${current.emaLength}" min="2" max="300"></label>
            <label>دوره ATR <input type="number" name="atrPeriod" value="${current.atrPeriod}" min="2" max="100"></label>
            <label>دوره ADX <input type="number" name="adxPeriod" value="${current.adxPeriod}" min="2" max="100"></label>
            <label>دوره CCI <input type="number" name="cciPeriod" value="${current.cciPeriod}" min="2" max="100"></label>
            <label>دوره MFI <input type="number" name="mfiPeriod" value="${current.mfiPeriod}" min="2" max="100"></label>
          </div>
        </div>

        <div class="settings-section">
          <h3>MACD</h3>
          <div class="settings-grid">
            <label>سریع <input type="number" name="macd.fast" value="${current.macd.fast}"></label>
            <label>کند <input type="number" name="macd.slow" value="${current.macd.slow}"></label>
            <label>سیگنال <input type="number" name="macd.signal" value="${current.macd.signal}"></label>
          </div>
        </div>

        <div class="settings-section">
          <h3>باند بولینگر</h3>
          <div class="settings-grid">
            <label>دوره <input type="number" name="bollinger.period" value="${current.bollinger.period}"></label>
            <label>ضریب انحراف معیار <input type="number" step="0.1" name="bollinger.mult" value="${current.bollinger.mult}"></label>
          </div>
        </div>

        <div class="settings-section">
          <h3>استوکاستیک</h3>
          <div class="settings-grid">
            <label>دوره K <input type="number" name="stochastic.period" value="${current.stochastic.period}"></label>
            <label>هموارسازی D <input type="number" name="stochastic.d" value="${current.stochastic.d}"></label>
          </div>
        </div>

        <div class="settings-section">
          <h3>ظاهر برنامه</h3>
          <div class="settings-grid">
            <label>تم
              <select name="theme">
                <option value="dark" ${current.theme === 'dark' ? 'selected' : ''}>تیره</option>
                <option value="light" ${current.theme === 'light' ? 'selected' : ''}>روشن</option>
              </select>
            </label>
          </div>
        </div>

        <div class="settings-actions">
          <button type="submit" class="btn btn-primary">ذخیره تنظیمات</button>
          <button type="button" class="btn btn-secondary" id="resetSettingsBtn">بازگشت به پیش‌فرض</button>
        </div>
      </form>
    `;

    const form = container.querySelector('#settingsForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const next = JSON.parse(JSON.stringify(current));
      for (const [key, value] of fd.entries()) {
        const num = value !== '' && !isNaN(value) ? Number(value) : value;
        if (key.includes('.')) {
          const [a, b] = key.split('.');
          next[a][b] = num;
        } else {
          next[key] = num;
        }
      }
      save(next);
      onSave(next);
    });

    container.querySelector('#resetSettingsBtn').addEventListener('click', () => {
      const fresh = reset();
      onSave(fresh);
      renderForm(container, fresh, onSave);
    });
  }

  return { load, save, reset, renderForm, DEFAULTS };
})();
