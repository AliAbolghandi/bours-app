/**
 * chart.js
 * نمودار تعاملی کندل‌استیک با پشتیبانی از میانگین متحرک، EMA، باند بولینگر،
 * حجم، حمایت/مقاومت، خطوط روند، زوم، پن و کراس‌هیر.
 * از کتابخانه Lightweight Charts (TradingView) استفاده می‌شود.
 */
const ChartModule = (() => {

  let chart = null, candleSeries = null, volumeSeries = null;
  let overlaySeries = [];

  function toChartTime(yyyymmdd) {
    const s = String(yyyymmdd);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }

  function clearOverlays() {
    overlaySeries.forEach(s => chart.removeSeries(s));
    overlaySeries = [];
  }

  function init(container) {
    chart = LightweightCharts.createChart(container, {
      layout: {
        background: { color: 'transparent' },
        textColor: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
        fontFamily: 'Vazirmatn, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(150,150,150,0.08)' },
        horzLines: { color: 'rgba(150,150,150,0.08)' }
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      handleScroll: true,
      handleScale: true
    });

    candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a', wickDownColor: '#ef5350'
    });

    volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: '#26a69a80'
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    }).observe(container);
  }

  function render(container, candles, evalResult, overlayOptions = {}) {
    if (!chart) init(container);
    clearOverlays();

    const candleData = candles.map(c => ({
      time: toChartTime(c.date), open: c.open, high: c.high, low: c.low, close: c.close
    }));
    candleSeries.setData(candleData);

    const volumeData = candles.map(c => ({
      time: toChartTime(c.date), value: c.volume,
      color: c.close >= c.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'
    }));
    volumeSeries.setData(volumeData);

    if (overlayOptions.ma) {
      const raw = evalResult.results.movingAverage.raw;
      addLineFromArray(candles, Utils.sma(Utils.series(candles, 'close'), 20), '#f0b90b', 'MA20');
      addLineFromArray(candles, Utils.sma(Utils.series(candles, 'close'), 50), '#42a5f5', 'MA50');
    }
    if (overlayOptions.ema) {
      addLineFromArray(candles, Utils.ema(Utils.series(candles, 'close'), 21), '#ab47bc', 'EMA21');
    }
    if (overlayOptions.bollinger) {
      const close = Utils.series(candles, 'close');
      const mid = Utils.sma(close, 20);
      const dev = Utils.stdev(close, 20);
      const upper = mid.map((m, i) => (m != null && dev[i] != null) ? m + 2 * dev[i] : null);
      const lower = mid.map((m, i) => (m != null && dev[i] != null) ? m - 2 * dev[i] : null);
      addLineFromArray(candles, upper, 'rgba(120,120,255,0.6)', 'BB Upper');
      addLineFromArray(candles, lower, 'rgba(120,120,255,0.6)', 'BB Lower');
    }
    if (overlayOptions.levels) {
      const sup = evalResult.results.support.raw.nearestSupport?.price;
      const res = evalResult.results.support.raw.nearestResistance?.price;
      if (sup) addHorizontalLine(sup, '#26a69a', 'حمایت');
      if (res) addHorizontalLine(res, '#ef5350', 'مقاومت');
    }

    chart.timeScale().fitContent();
  }

  function addLineFromArray(candles, arr, color, title) {
    const series = chart.addLineSeries({ color, lineWidth: 1.5, title, priceLineVisible: false });
    series.setData(candles.map((c, i) => arr[i] == null ? null : { time: toChartTime(c.date), value: arr[i] }).filter(Boolean));
    overlaySeries.push(series);
  }

  function addHorizontalLine(price, color, title) {
    const series = chart.addLineSeries({ color, lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, title, priceLineVisible: false, lastValueVisible: true });
    series.setData([]);
    series.createPriceLine({ price, color, lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, title });
    overlaySeries.push(series);
  }

  return { render };
})();
