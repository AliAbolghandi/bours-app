# تحلیل‌گر بورس اوراق بهادار ایران

اپلیکیشن تحلیل تکنیکال Production-Ready برای بورس ایران با Backend روی Google Apps Script
و Database روی Google Sheets. تمام رابط کاربری فارسی و RTL است.

## ساختار پروژه

```
bourse-app/
├── index.html              # نقطه ورود
├── css/
│   ├── style.css           # استایل اصلی، کارت‌ها، جدول، گیج
│   ├── rtl.css              # چیدمان راست‌به‌چپ
│   └── theme.css            # توکن‌های رنگی تیره/روشن
├── js/
│   ├── utils.js / api.js    # ابزار مشترک + کلاینت API
│   ├── trend.js, support.js, movingAverage.js, ema.js, rsi.js,
│   │   macd.js, adx.js, atr.js, bollinger.js, stochastic.js,
│   │   cci.js, mfi.js, obv.js, vwap.js, pivot.js, fibonacci.js,
│   │   ichimoku.js          # ۱۹ ماژول اندیکاتور مستقل
│   ├── priceAction.js, candlestick.js, patterns.js, divergence.js
│   ├── volume.js, smartMoney.js, risk.js
│   ├── score.js             # موتور امتیازدهی مرکزی
│   ├── summary.js           # جدول خلاصه (خروجی اصلی)
│   ├── dashboard.js, chart.js, settings.js
│   └── app.js               # مسیریاب و راه‌انداز
└── gas/
    └── Code.gs               # بک‌اند Google Apps Script (REST API)
```

## راه‌اندازی بک‌اند (Google Apps Script)

1. یک Google Sheet جدید بسازید و شیتی با نام دقیق `Data` ایجاد کنید.
2. ردیف اول را با این هدرها پر کنید (دقیقاً به همین ترتیب):
   `Ticker | DTYYYYMMDD | FIRST | HIGH | LOW | CLOSE | VALUE | VOL | OPENINT | PER | OPEN | LAST`
3. داده‌های تاریخی هر نماد را از ردیف دوم به بعد وارد کنید.
4. از منوی شیت: `Extensions > Apps Script` را باز کنید و محتوای `gas/Code.gs` را جایگزین کد پیش‌فرض کنید.
5. `Deploy > New deployment > Web app`:
   - Execute as: **Me**
   - Who has access: **Anyone** (یا طبق نیاز شما محدودتر)
6. آدرس دیپلوی (`.../exec`) را کپی کنید.

## اتصال فرانت‌اند به بک‌اند

در فایل `js/api.js` مقدار `BASE_URL` را با آدرس دیپلوی خودتان جایگزین کنید:

```js
const BASE_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

## اجرای فرانت‌اند

چون فرانت‌اند کاملاً استاتیک است (HTML/CSS/Vanilla JS)، کافی است پوشه را روی هر
سرور استاتیک (GitHub Pages، Netlify، یا حتی یک سرور محلی ساده) میزبانی کنید.
شیت گوگل همیشه خصوصی باقی می‌ماند؛ فرانت‌اند فقط با Apps Script صحبت می‌کند.

## نکات فنی

- کش سمت سرور با `CacheService` (۵ دقیقه) و کش سمت کلاینت در `api.js` انجام می‌شود.
- امتیاز فنی (Technical Score) از نرمال‌سازی مجموع امتیاز وزن‌دار همه‌ی ماژول‌ها به بازه ۰ تا ۱۰۰ به دست می‌آید.
- درصد خرید (Buy Percentage) ترکیبی از امتیاز فنی و نسبت سیگنال‌های خرید/فروش است.
- برای افزودن اندیکاتور جدید: یک فایل جدید در `js/` با متد `analyze(candles, settings)`
  بسازید که آبجکتی با فیلدهای `key, title, currentValue, interpretation, signal, weight, score, maxScore, raw`
  برگرداند، آن را در `js/score.js` (`MODULE_RUNNERS`) و `js/summary.js` (`ROW_ORDER`) ثبت کنید،
  و تگ `<script>` آن را در `index.html` اضافه کنید.
