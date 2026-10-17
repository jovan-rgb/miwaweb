const SHEET_NAME = 'Pengkajian Komunitas';

function doPost(e) {
  try {
    const rawPayload = e && e.parameter && e.parameter.payload;
    if (!rawPayload) throw new Error('Data pengkajian tidak ditemukan.');

    const payload = JSON.parse(rawPayload);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Format data pengkajian tidak valid.');
    }
    if (!payload.record_id || !payload.nama_kk || !payload.alamat || !payload.masalah_prioritas) {
      throw new Error('Data wajib belum lengkap.');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getAssessmentSheet_();
      const headers = ensureHeaders_(sheet, Object.keys(payload));
      const existingIds = sheet.getLastRow() > 1
        ? sheet.getRange(2, headers.indexOf('record_id') + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat()
        : [];
      if (existingIds.includes(String(payload.record_id))) {
        return jsonOutput_({ ok: true, record_id: payload.record_id });
      }

      const values = headers.map(header => {
        if (header === 'timestamp') return new Date();
        return toSheetValue_(payload[header]);
      });
      sheet.appendRow(values);
      return jsonOutput_({ ok: true, record_id: payload.record_id });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonOutput_({ error: error.message || 'Gagal menyimpan data.' });
  }
}

function doGet(e) {
  try {
    const sheet = getAssessmentSheet_();
    const values = sheet.getDataRange().getValues();
    const headers = values.length ? values[0] : [];
    const rows = values.slice(1)
      .filter(row => row.some(value => value !== ''))
      .map(row => headers.reduce((record, header, index) => {
        const value = row[index];
        record[header] = value instanceof Date ? value.toISOString() : String(value || '');
        return record;
      }, {}));
    const callback = e && e.parameter && e.parameter.callback;

    if (callback) {
      if (!/^[A-Za-z_$][\w$]*$/.test(callback)) {
        return jsonOutput_({ error: 'Nama callback tidak valid.' });
      }
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(rows)});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonOutput_(rows);
  } catch (error) {
    console.error(error);
    const callback = e && e.parameter && e.parameter.callback;
    const result = { error: error.message || 'Gagal membaca data.' };
    if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(result)});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonOutput_(result);
  }
}

function getAssessmentSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Skrip harus dibuat dari Google Sheet melalui menu Ekstensi → Apps Script.');
  }
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet, payloadKeys) {
  const requiredHeaders = ['timestamp', ...payloadKeys.filter(key => key !== 'timestamp')];
  const lastColumn = sheet.getLastColumn();
  const currentHeaders = lastColumn
    ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].filter(Boolean)
    : [];
  const headers = currentHeaders.length ? currentHeaders : requiredHeaders;
  requiredHeaders.forEach(header => {
    if (!headers.includes(header)) headers.push(header);
  });

  if (!currentHeaders.length || headers.length !== currentHeaders.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return headers;
}

function toSheetValue_(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
