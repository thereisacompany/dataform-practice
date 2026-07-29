function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function currentYear() {
  return new Date().getFullYear();
}

function thisWeekMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return formatDate(monday);
}

function thisWeekSunday() {
  const monday = new Date(thisWeekMonday());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return formatDate(sunday);
}

function lastWeekMonday() {
  const monday = new Date(thisWeekMonday());
  monday.setDate(monday.getDate() - 7);
  return formatDate(monday);
}

function lastWeekSunday() {
  const monday = new Date(thisWeekMonday());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() - 1);
  return formatDate(sunday);
}

function getPartitionFirstDay() {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function getYearMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function getTodayTimestamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function logSQL(description, schema = "dataform", table = "log_data") {
  return `
    INSERT INTO ${schema}.${table} (execution_date, execution_time, description)
    VALUES (CURRENT_DATE(), CURRENT_TIMESTAMP(), '${description}')
  `;
}

module.exports = {
  currentYear,
  thisWeekMonday,
  thisWeekSunday,
  lastWeekMonday,
  lastWeekSunday,
  getPartitionFirstDay,
  getYearMonth,
  getTodayTimestamp,
  logSQL
};
