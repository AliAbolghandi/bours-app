/**
 * csv.js
 * پارسر فایل‌های CSV پوشه‌ی sahm با فرمت الزامی:
 * Ticker, DTYYYYMMDD, FIRST, HIGH, LOW, CLOSE, VALUE, VOL, OPENINT, PER, OPEN, LAST
 * از هدر با هر ترتیبی پشتیبانی می‌کند؛ در نبود هدر، ترتیب پیش‌فرض ستون‌ها فرض می‌شود.
 */
const CsvParser = (() => {

  const REQUIRED_COLUMNS = [
    'Ticker', 'DTYYYYMMDD', 'FIRST', 'HIGH', 'LOW', 'CLOSE',
    'VALUE', 'VOL', 'OPENINT', 'PER', 'OPEN', 'LAST'
  ];

  // تفکیک یک خط CSV با پشتیبانی از فیلدهای داخل گیومه
  function splitLine(line, delimiter) {
    const result = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delimiter && !inQuotes) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  }

  function detectDelimiter(line) {
    if (line.includes('\t')) return '\t';
    if ((line.match(/;/g) || []).length > (line.match(/,/g) || []).length) return ';';
    return ',';
  }

  /**
   * متن خام یک فایل CSV را به آرایه‌ای از ردیف‌های استاندارد تبدیل می‌کند.
   */
  function parse(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim().length > 0);
    if (!lines.length) return [];

    const delimiter = detectDelimiter(lines[0]);
    const headerCells = splitLine(lines[0], delimiter).map(h => h.replace(/\s+/g, '').toUpperCase());
    const looksLikeHeader = REQUIRED_COLUMNS.some(c => headerCells.includes(c.toUpperCase()));

    let colIndex = {};
    let dataLines;

    if (looksLikeHeader) {
      dataLines = lines.slice(1);
      REQUIRED_COLUMNS.forEach(c => { colIndex[c] = headerCells.indexOf(c.toUpperCase()); });
    } else {
      dataLines = lines;
      REQUIRED_COLUMNS.forEach((c, i) => { colIndex[c] = i; });
    }

    const rows = [];
    dataLines.forEach(line => {
      const cells = splitLine(line, delimiter);
      const get = (c) => {
        const idx = colIndex[c];
        return (idx == null || idx < 0 || idx >= cells.length) ? null : cells[idx];
      };
      const ticker = get('Ticker');
      if (!ticker) return;

      rows.push({
        Ticker: ticker,
        DTYYYYMMDD: Number(get('DTYYYYMMDD')),
        FIRST: Number(get('FIRST')),
        HIGH: Number(get('HIGH')),
        LOW: Number(get('LOW')),
        CLOSE: Number(get('CLOSE')),
        VALUE: Number(get('VALUE')),
        VOL: Number(get('VOL')),
        OPENINT: Number(get('OPENINT')),
        PER: get('PER'),
        OPEN: Number(get('OPEN')) || Number(get('FIRST')),
        LAST: Number(get('LAST'))
      });
    });

    return rows.filter(r => !isNaN(r.DTYYYYMMDD) && !isNaN(r.CLOSE));
  }

  // تبدیل ردیف‌های خام یک نماد به کندل‌های OHLCV مرتب‌شده بر اساس تاریخ
  function rowsToCandles(rows) {
    return rows
      .map(r => ({
        date: r.DTYYYYMMDD,
        open: r.OPEN,
        high: r.HIGH,
        low: r.LOW,
        close: r.CLOSE,
        last: r.LAST,
        value: r.VALUE,
        volume: r.VOL,
        openInt: r.OPENINT,
        period: r.PER
      }))
      .sort((a, b) => a.date - b.date);
  }

  return { parse, rowsToCandles, REQUIRED_COLUMNS };
})();
